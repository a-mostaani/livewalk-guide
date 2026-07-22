export type LiveKitTokenResult = {
  token: string;
  room: string;
  identity: string;
  canPublish: boolean;
  expiresIn: number;
};

export type GuideBroadcastState =
  | { status: 'idle' }
  | { status: 'connecting'; sessionId: string }
  | { status: 'ready'; sessionId: string; token: string; room: string; canPublish: boolean }
  | { status: 'error'; sessionId: string; message: string };

export type GuideBroadcastDeps = {
  fetchToken: (sessionId: string) => Promise<LiveKitTokenResult>;
};

export type GuideBroadcastConnectionProps = {
  connect: boolean;
  token: string | undefined;
  video: boolean;
  audio: boolean;
};

const IDLE_STATE: GuideBroadcastState = { status: 'idle' };

// Orchestrates the token fetch -> connect -> publish -> cleanup lifecycle for
// the Guide's LiveKit room, independent of the real SDK so it can be unit
// tested against a mocked fetchToken. The epoch counter guards against a
// late-arriving fetchToken response overwriting state after stop() or a
// newer start() has already superseded it - mirrors RequestPollGate's
// staleness guard in requestLifecycle.ts.
export class GuideBroadcastController {
  private epoch = 0;
  private state: GuideBroadcastState = IDLE_STATE;
  private inFlight?: { sessionId: string; promise: Promise<GuideBroadcastState> };

  constructor(private deps: GuideBroadcastDeps) {}

  getState(): GuideBroadcastState {
    return this.state;
  }

  start(sessionId: string): Promise<GuideBroadcastState> {
    if (this.state.status === 'ready' && this.state.sessionId === sessionId) {
      return Promise.resolve(this.state);
    }
    if (this.inFlight && this.inFlight.sessionId === sessionId) {
      return this.inFlight.promise;
    }
    this.epoch += 1;
    const epoch = this.epoch;
    this.state = { status: 'connecting', sessionId };
    const promise: Promise<GuideBroadcastState> = this.deps.fetchToken(sessionId).then(
      (result) => {
        if (epoch !== this.epoch) return this.state;
        this.state = { status: 'ready', sessionId, token: result.token, room: result.room, canPublish: result.canPublish };
        return this.state;
      },
      (error: unknown) => {
        if (epoch !== this.epoch) return this.state;
        this.state = { status: 'error', sessionId, message: error instanceof Error ? error.message : 'Could not start the live broadcast.' };
        return this.state;
      },
    ).finally(() => {
      if (this.inFlight?.promise === promise) this.inFlight = undefined;
    });
    this.inFlight = { sessionId, promise };
    return promise;
  }

  stop(): GuideBroadcastState {
    this.epoch += 1;
    this.inFlight = undefined;
    this.state = IDLE_STATE;
    return this.state;
  }
}

export function getConnectionProps(state: GuideBroadcastState): GuideBroadcastConnectionProps {
  if (state.status !== 'ready') return { connect: false, token: undefined, video: false, audio: false };
  return { connect: true, token: state.token, video: state.canPublish, audio: state.canPublish };
}
