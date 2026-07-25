import { describe, expect, it, vi } from 'vitest';
import { GuideMediaLifecycle, type GuideMediaLifecycleDeps } from '../src/session/guideMediaLifecycle';

type CameraOptions = { facingMode: 'environment' | 'user' };

function createHarness(overrides: Partial<GuideMediaLifecycleDeps<CameraOptions>> = {}) {
  const calls: string[] = [];
  const errors: string[] = [];
  const logs: string[] = [];
  const deps: GuideMediaLifecycleDeps<CameraOptions> = {
    getCameraOptions: () => ({ facingMode: 'environment' }),
    startCamera: async () => {
      calls.push('start-camera');
    },
    startMicrophone: async () => {
      calls.push('start-microphone');
    },
    stopCamera: async () => {
      calls.push('stop-camera');
    },
    stopMicrophone: async () => {
      calls.push('stop-microphone');
    },
    restartCamera: async () => {
      calls.push('restart-camera');
    },
    onError: (message) => errors.push(message),
    onRecovered: () => calls.push('recovered'),
    log: (event) => logs.push(event),
    ...overrides,
  };
  return { lifecycle: new GuideMediaLifecycle(deps), calls, errors, logs };
}

describe('GuideMediaLifecycle', () => {
  it('starts camera and microphone once for repeated connected events in one session', async () => {
    const { lifecycle, calls } = createHarness();

    await Promise.all([
      lifecycle.startOnConnected('session-1'),
      lifecycle.startOnConnected('session-1'),
    ]);

    expect(calls).toEqual(['recovered', 'start-camera', 'start-microphone']);
  });

  it('coalesces camera and microphone failures into one serial delayed retry', async () => {
    vi.useFakeTimers();
    const { lifecycle, calls } = createHarness();
    await lifecycle.startOnConnected('session-1');
    calls.length = 0;

    lifecycle.handleMediaFailure(false, 'camera');
    lifecycle.handleMediaFailure(false, 'microphone');
    await vi.advanceTimersByTimeAsync(800);

    expect(calls).toEqual(['start-camera', 'start-microphone', 'recovered']);
    vi.useRealTimers();
  });

  it('cancels a delayed retry when reconnecting without restarting media', async () => {
    vi.useFakeTimers();
    const { lifecycle, calls, logs } = createHarness();
    await lifecycle.startOnConnected('session-1');
    calls.length = 0;

    lifecycle.handleMediaFailure(false, 'camera');
    lifecycle.handleConnectionTransition('reconnecting');
    await vi.advanceTimersByTimeAsync(800);

    expect(calls).toEqual([]);
    expect(logs).toContain('media-retry-cancelled');
    vi.useRealTimers();
  });

  it('cancels stale retries and serially stops media on session end', async () => {
    vi.useFakeTimers();
    const { lifecycle, calls } = createHarness();
    await lifecycle.startOnConnected('session-1');
    calls.length = 0;

    lifecycle.handleMediaFailure(false, 'camera');
    await lifecycle.endSession('session-change');
    await vi.advanceTimersByTimeAsync(800);

    expect(calls).toEqual(['stop-camera', 'stop-microphone']);
    vi.useRealTimers();
  });

  it('serializes manual camera restart behind initial media start', async () => {
    const cameraGate = Promise.withResolvers<void>();
    const { lifecycle, calls } = createHarness({
      startCamera: async () => {
        calls.push('start-camera');
        await cameraGate.promise;
      },
    });

    const start = lifecycle.startOnConnected('session-1');
    const restart = lifecycle.restartCamera({ facingMode: 'user' });
    await Promise.resolve();
    expect(calls).toEqual(['recovered', 'start-camera']);

    cameraGate.resolve();
    await start;
    await expect(restart).resolves.toBe(true);
    expect(calls).toEqual([
      'recovered',
      'start-camera',
      'start-microphone',
      'restart-camera',
      'recovered',
    ]);
  });
});
