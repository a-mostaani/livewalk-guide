// TICKET-6: on first run the camera/microphone request and the location
// request were fired at the same instant when the walk went live. Android
// handles one permission request at a time, so both hung: no video, no GPS,
// no error, until the app was restarted with the permissions already granted.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { runPermissionRequest } from '../src/session/permissionQueue';
import { broadcastWaitingMessage } from '../src/session/guideBroadcast';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('TICKET-6: first-run permissions', () => {
  it('TICKET-6: a second permission request waits until the first has been answered', async () => {
    const events: string[] = [];
    const camera = deferred<string>();
    const first = runPermissionRequest(() => { events.push('camera asked'); return camera.promise; });
    const second = runPermissionRequest(async () => { events.push('location asked'); return 'granted'; });

    await tick();
    expect(events).toEqual(['camera asked']);

    camera.resolve('granted');
    expect(await first).toBe('granted');
    expect(await second).toBe('granted');
    expect(events).toEqual(['camera asked', 'location asked']);
  });

  it('TICKET-6: a failed request does not block the ones behind it', async () => {
    const failing = runPermissionRequest(async () => { throw new Error('dialog dismissed'); });
    const next = runPermissionRequest(async () => 'granted');
    await expect(failing).rejects.toThrow('dialog dismissed');
    expect(await next).toBe('granted');
  });

  it('TICKET-6: every permission prompt in the app goes through the queue', () => {
    const camera = readFileSync('src/session/useGuideBroadcast.ts', 'utf8');
    const location = readFileSync('src/hooks/useSession.ts', 'utf8');
    expect(camera).toMatch(/runPermissionRequest\(\(\) => PermissionsAndroid\.requestMultiple/);
    expect(location).toMatch(/runPermissionRequest\(\(\) => Location\.requestForegroundPermissionsAsync\(\)\)/);
    expect(camera.match(/requestMultiple/g)).toHaveLength(1);
    expect(location.match(/requestForegroundPermissionsAsync/g)).toHaveLength(1);
  });

  it('TICKET-6: while the camera is not running the screen says why, in plain words', () => {
    expect(broadcastWaitingMessage({ status: 'idle' }, true)).toMatch(/permission/i);
    expect(broadcastWaitingMessage({ status: 'connecting', sessionId: 's' }, false)).toMatch(/starting/i);
    expect(broadcastWaitingMessage({ status: 'idle' }, false)).toMatch(/starts when the walk goes live/i);
    const visuals = readFileSync('src/components/GuideVisuals.tsx', 'utf8');
    expect(visuals).not.toMatch(/Mock broadcaster surface|Expo Go|BROADCASTING|18:42 left|5G strong/);
  });
});
