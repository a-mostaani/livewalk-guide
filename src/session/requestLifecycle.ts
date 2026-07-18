import type { LiveSession, MarketplaceRequest } from '../types';

export const CANCELLED_WALK_TITLE = 'Traveler cancelled this walk';
export const CANCELLED_WALK_DESCRIPTION = 'No session can start. This walk is no longer available for guide actions.';

export type RequestActionState =
  | { kind: 'actionable' }
  | { kind: 'cancelled'; title: typeof CANCELLED_WALK_TITLE; description: typeof CANCELLED_WALK_DESCRIPTION };

export type GuideWorkflowRenderState =
  | { kind: 'actionable'; renderActionableControls: true }
  | { kind: 'cancelled'; renderActionableControls: false; title: typeof CANCELLED_WALK_TITLE; description: typeof CANCELLED_WALK_DESCRIPTION };

type CancellationSignalCarrier = {
  requestCancellation?: unknown;
  cancellation?: unknown;
  requestCancellationReason?: unknown;
  cancellationReason?: unknown;
};

export type GuideSessionSnapshot = {
  session: Pick<LiveSession, 'id' | 'requestId' | 'status'> & CancellationSignalCarrier;
  request?: MarketplaceRequest;
} & CancellationSignalCarrier;

export type GuideSessionPollResolution =
  | { kind: 'cancelled'; request: MarketplaceRequest }
  | { kind: 'updated'; request: MarketplaceRequest }
  | { kind: 'ignored' };

function hasCancellationValue(value: unknown) {
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'boolean') return value;
  return value !== null && value !== undefined;
}

function hasCancellationReason(value?: CancellationSignalCarrier) {
  if (!value) return false;
  return [
    value.requestCancellation,
    value.cancellation,
    value.requestCancellationReason,
    value.cancellationReason,
  ].some(hasCancellationValue);
}

export function isCancelledRequestStatus(status?: MarketplaceRequest['status'] | string | null) {
  return status === 'cancelled';
}

export function getRequestActionState(request?: Pick<MarketplaceRequest, 'status'> & CancellationSignalCarrier): RequestActionState {
  if (isCancelledRequestStatus(request?.status) || hasCancellationReason(request)) {
    return { kind: 'cancelled', title: CANCELLED_WALK_TITLE, description: CANCELLED_WALK_DESCRIPTION };
  }
  return { kind: 'actionable' };
}

export function canRunGuideWalkAction(request?: Pick<MarketplaceRequest, 'status'> & CancellationSignalCarrier) {
  return getRequestActionState(request).kind === 'actionable';
}

export function getGuideWorkflowRenderState(request?: Pick<MarketplaceRequest, 'status'> & CancellationSignalCarrier): GuideWorkflowRenderState {
  const actionState = getRequestActionState(request);
  if (actionState.kind === 'cancelled') return { ...actionState, renderActionableControls: false };
  return { kind: 'actionable', renderActionableControls: true };
}

export function shouldPollGuideSession(request?: MarketplaceRequest) {
  return Boolean(request?.sessionId && canRunGuideWalkAction(request));
}

export function filterActionableRequests(requests: MarketplaceRequest[]) {
  return requests.filter((request) => getRequestActionState(request).kind === 'actionable');
}

export function normalizeActiveRequestFromSession(activeRequest: MarketplaceRequest | undefined, snapshot: GuideSessionSnapshot) {
  if (!activeRequest) return undefined;
  if (getRequestActionState(activeRequest).kind === 'cancelled') return activeRequest;
  const responseRequest = snapshot.request?.id === activeRequest.id ? snapshot.request : undefined;
  const request = { ...activeRequest, ...responseRequest };
  if (
    getRequestActionState(request).kind === 'cancelled'
    || snapshot.session.status === 'cancelled'
    || hasCancellationReason(snapshot)
    || hasCancellationReason(snapshot.session)
  ) return { ...request, status: 'cancelled' as const };
  if (snapshot.session.status === 'ended') return { ...request, status: 'completed' as const };
  if (snapshot.session.status === 'live') return { ...request, status: 'live' as const };
  return request;
}

export function applyGuideActiveRequestUpdate(current: MarketplaceRequest | undefined, requestId: string, next: MarketplaceRequest | undefined) {
  if (current?.id !== requestId) return current;
  if (getRequestActionState(current).kind === 'cancelled') return current;
  return next;
}

export function resolveGuideSessionPoll(activeRequest: MarketplaceRequest | undefined, snapshot: GuideSessionSnapshot, pollCurrent: boolean): GuideSessionPollResolution {
  const request = normalizeActiveRequestFromSession(activeRequest, snapshot);
  if (!request) return { kind: 'ignored' };
  if (getRequestActionState(request).kind === 'cancelled') return { kind: 'cancelled', request };
  if (!pollCurrent) return { kind: 'ignored' };
  return { kind: 'updated', request };
}

export function canFetchPendingRequests({ enabled, authReady, online }: { enabled: boolean; authReady: boolean; online: boolean }) {
  return enabled && authReady && online;
}

export function shouldReloadDashboard({ dashboardFocused, appActive, enabled, authReady, online }: {
  dashboardFocused: boolean;
  appActive: boolean;
  enabled: boolean;
  authReady: boolean;
  online: boolean;
}) {
  return dashboardFocused && appActive && canFetchPendingRequests({ enabled, authReady, online });
}

export function shouldRefreshGuideState({ screenFocused, appActive, enabled, authReady }: {
  screenFocused: boolean;
  appActive: boolean;
  enabled: boolean;
  authReady: boolean;
}) {
  return screenFocused && appActive && enabled && authReady;
}

type PollSnapshot = {
  authenticationEpoch: number;
  requestEpoch: number;
};

export class SingleFlightPoll {
  private inFlight?: Promise<unknown>;

  run<T>(work: () => Promise<T>): Promise<T> {
    if (this.inFlight) return this.inFlight as Promise<T>;
    const task = Promise.resolve().then(work);
    this.inFlight = task;
    const clear = () => {
      if (this.inFlight === task) this.inFlight = undefined;
    };
    void task.then(clear, clear);
    return task;
  }
}

export class RequestPollGate {
  private authenticationEpoch = 0;
  private requestEpoch = 0;
  private lastValidRequests: MarketplaceRequest[] = [];

  reset({ clearLastValid = false }: { clearLastValid?: boolean } = {}) {
    this.authenticationEpoch += 1;
    this.requestEpoch = 0;
    if (clearLastValid) this.lastValidRequests = [];
  }

  beginPoll(): PollSnapshot {
    this.requestEpoch += 1;
    return { authenticationEpoch: this.authenticationEpoch, requestEpoch: this.requestEpoch };
  }

  isCurrent(snapshot: PollSnapshot) {
    return snapshot.authenticationEpoch === this.authenticationEpoch && snapshot.requestEpoch === this.requestEpoch;
  }

  accept(snapshot: PollSnapshot, requests: MarketplaceRequest[]) {
    if (!this.isCurrent(snapshot)) return { kind: 'stale' as const, requests: this.lastValidRequests };
    this.lastValidRequests = filterActionableRequests(requests);
    return { kind: 'accepted' as const, requests: this.lastValidRequests };
  }

  retain(snapshot: PollSnapshot) {
    if (!this.isCurrent(snapshot)) return { kind: 'stale' as const, requests: this.lastValidRequests };
    return { kind: 'retained' as const, requests: this.lastValidRequests };
  }
}
