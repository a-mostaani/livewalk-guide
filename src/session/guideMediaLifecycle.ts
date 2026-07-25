export type GuideMediaSource = 'camera' | 'microphone';

type TimerHandle = ReturnType<typeof setTimeout> | number;

export type GuideMediaLifecycleDeps<CameraOptions> = {
  getCameraOptions: () => CameraOptions;
  startCamera: (options: CameraOptions) => Promise<void>;
  startMicrophone: () => Promise<void>;
  stopCamera: () => Promise<void>;
  stopMicrophone: () => Promise<void>;
  restartCamera: (options: CameraOptions) => Promise<void>;
  onError: (message: string) => void;
  onRecovered: () => void;
  log: (event: string, details?: Record<string, unknown>) => void;
  retryDelayMs?: number;
  setTimer?: (callback: () => void, delayMs: number) => TimerHandle;
  clearTimer?: (handle: TimerHandle) => void;
};

export class GuideMediaLifecycle<CameraOptions> {
  private epoch = 0;
  private sessionKey?: string;
  private startQueued = false;
  private stopQueued = false;
  private operationQueue: Promise<void> = Promise.resolve();
  private retryTimer?: TimerHandle;
  private pendingRetries = new Set<GuideMediaSource>();
  private retriedSources = new Set<GuideMediaSource>();

  constructor(private readonly deps: GuideMediaLifecycleDeps<CameraOptions>) {}

  startOnConnected(sessionKey: string): Promise<void> {
    if (this.sessionKey === sessionKey && this.startQueued) return this.operationQueue;

    this.epoch += 1;
    const epoch = this.epoch;
    this.sessionKey = sessionKey;
    this.startQueued = true;
    this.stopQueued = false;
    this.retriedSources.clear();
    this.cancelPendingRetries('connected');

    return this.enqueue(async () => {
      if (!this.isCurrent(epoch, sessionKey)) return;
      this.deps.onRecovered();
      this.deps.log('media-start-begin', { session: sessionKey });
      try {
        await this.deps.startCamera(this.deps.getCameraOptions());
        if (!this.isCurrent(epoch, sessionKey)) return;
        await this.deps.startMicrophone();
        if (!this.isCurrent(epoch, sessionKey)) return;
        this.deps.log('media-start-complete', { session: sessionKey });
      } catch (error) {
        this.deps.log('media-start-failed', { session: sessionKey, error: errorSummary(error) });
        this.deps.onError('Could not start the camera or microphone. Try leaving and rejoining the walk.');
      }
    });
  }

  endSession(reason: string): Promise<void> {
    if (!this.sessionKey && this.stopQueued) return this.operationQueue;
    if (!this.sessionKey && !this.startQueued) {
      this.cancelPendingRetries(reason);
      return this.operationQueue;
    }

    const session = this.sessionKey;
    this.epoch += 1;
    this.sessionKey = undefined;
    this.startQueued = false;
    this.stopQueued = true;
    this.retriedSources.clear();
    this.cancelPendingRetries(reason);

    return this.enqueue(async () => {
      this.deps.log('media-stop-begin', { session, reason });
      await this.runStop('camera', this.deps.stopCamera);
      await this.runStop('microphone', this.deps.stopMicrophone);
      this.deps.log('media-stop-complete', { session, reason });
    });
  }

  handleConnectionTransition(phase: 'reconnecting' | 'signal-reconnecting' | 'reconnected' | 'disconnected'): void {
    this.cancelPendingRetries(phase);
    this.deps.log(`connection-${phase}`, { session: this.sessionKey });
  }

  handleMediaFailure(permissionDenied: boolean, source: GuideMediaSource): void {
    const session = this.sessionKey;
    if (!session) {
      this.deps.log('media-failure-ignored', { source, reason: 'no-active-session' });
      return;
    }
    if (permissionDenied) {
      this.cancelPendingRetries('permission-denied');
      this.deps.log('media-permission-denied', { session, source });
      this.deps.onError('Camera and microphone permission is required to broadcast.');
      return;
    }
    if (this.retriedSources.has(source)) {
      this.deps.log('media-retry-exhausted', { session, source });
      this.deps.onError(`Could not start the ${source}. Try leaving and rejoining the walk.`);
      return;
    }

    this.retriedSources.add(source);
    this.pendingRetries.add(source);
    if (this.retryTimer) {
      this.deps.log('media-retry-coalesced', { session, source });
      return;
    }

    const epoch = this.epoch;
    const retryDelayMs = this.deps.retryDelayMs ?? 800;
    const setTimer = this.deps.setTimer ?? setTimeout;
    this.deps.log('media-retry-scheduled', { session, source, delayMs: retryDelayMs });
    this.retryTimer = setTimer(() => {
      this.retryTimer = undefined;
      const sources = [...this.pendingRetries];
      this.pendingRetries.clear();
      void this.enqueue(async () => {
        if (!this.isCurrent(epoch, session)) {
          this.deps.log('media-retry-stale', { session, sources });
          return;
        }
        this.deps.log('media-retry-begin', { session, sources });
        try {
          for (const retrySource of sources) {
            if (!this.isCurrent(epoch, session)) return;
            if (retrySource === 'camera') await this.deps.startCamera(this.deps.getCameraOptions());
            else await this.deps.startMicrophone();
          }
          if (!this.isCurrent(epoch, session)) return;
          this.deps.onRecovered();
          this.deps.log('media-retry-complete', { session, sources });
        } catch (error) {
          this.deps.log('media-retry-failed', { session, sources, error: errorSummary(error) });
          this.deps.onError('Could not restart the camera or microphone. Try leaving and rejoining the walk.');
        }
      });
    }, retryDelayMs);
  }

  restartCamera(options: CameraOptions): Promise<boolean> {
    const session = this.sessionKey;
    if (!session) return Promise.resolve(false);
    const epoch = this.epoch;
    this.cancelPendingRetries('manual-camera-restart');

    return this.enqueue(async () => {
      if (!this.isCurrent(epoch, session)) return false;
      this.deps.log('camera-restart-begin', { session });
      try {
        await this.deps.restartCamera(options);
        if (!this.isCurrent(epoch, session)) return false;
        this.deps.onRecovered();
        this.deps.log('camera-restart-complete', { session });
        return true;
      } catch (error) {
        this.deps.log('camera-restart-failed', { session, error: errorSummary(error) });
        this.deps.onError('Could not switch the camera. Try leaving and rejoining the walk.');
        return false;
      }
    });
  }

  cancelPendingRetries(reason: string): void {
    if (this.retryTimer) {
      const clearTimer = this.deps.clearTimer ?? ((handle: TimerHandle) => clearTimeout(handle as ReturnType<typeof setTimeout>));
      clearTimer(this.retryTimer);
      this.retryTimer = undefined;
    }
    if (this.pendingRetries.size > 0) {
      const sources = [...this.pendingRetries];
      this.deps.log('media-retry-cancelled', {
        session: this.sessionKey,
        sources,
        reason,
      });
      for (const source of sources) this.retriedSources.delete(source);
      this.pendingRetries.clear();
    }
  }

  private enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const next = this.operationQueue.then(operation, operation);
    this.operationQueue = next.then(() => undefined, () => undefined);
    return next;
  }

  private isCurrent(epoch: number, sessionKey: string): boolean {
    return this.epoch === epoch && this.sessionKey === sessionKey;
  }

  private async runStop(source: GuideMediaSource, operation: () => Promise<void>): Promise<void> {
    try {
      await operation();
    } catch (error) {
      this.deps.log('media-stop-failed', { source, error: errorSummary(error) });
    }
  }
}

function errorSummary(error: unknown): string {
  if (!(error instanceof Error)) return 'unknown';
  return `${error.name}: ${error.message}`
    .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '[credential-redacted]')
    .replace(/(token=)[^&\s]+/gi, '$1[credential-redacted]');
}
