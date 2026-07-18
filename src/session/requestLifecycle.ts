import type { LiveSession, MarketplaceRequest, Screen } from '../types';

export const CANCELLED_WALK_TITLE = 'Traveler cancelled this walk';
export const CANCELLED_WALK_DESCRIPTION = 'No session can start. This walk is no longer available for guide actions.';

export type RequestActionState =
  | { kind: 'actionable' }
  | { kind: 'cancelled'; title: typeof CANCELLED_WALK_TITLE; description: typeof CANCELLED_WALK_DESCRIPTION };

export type GuideWorkflowRenderState =
  | { kind: 'actionable'; renderActionableControls: true }
  | { kind: 'cancelled'; renderActionableControls: false; title: typeof CANCELLED_WALK_TITLE; description: typeof CANCELLED_WALK_DESCRIPTION };

export type GuideSelectedRequestState =
  | { kind: 'none' }
  | { kind: 'actionable'; requestId: string }
  | { kind: 'cancelled'; requestId: string; reason: 'cancelled' | 'missing' | 'latched' };

export type GuideScreenContent = {
  kind: 'content' | 'cancelled';
  travelerCancelled: boolean;
  mountsIncomingRequest: boolean;
  mountsIncomingRequestActions: boolean;
  mountsBottomNavigation: boolean;
};

export const GUIDE_WORKFLOW_SCREENS: Screen[] = ['request', 'route', 'checklist', 'live'];

export type GuideRequestIdentity = {
  requestId?: string;
  sessionId?: string | null;
};

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

export type GuidePendingSelectionResolution =
  | { kind: 'cancelled'; request: MarketplaceRequest }
  | { kind: 'missing'; request: MarketplaceRequest }
  | { kind: 'current' };

export type GuideRequestDetailResolution =
  | { kind: 'cancelled'; request: MarketplaceRequest }
  | { kind: 'updated'; request: MarketplaceRequest }
  | { kind: 'ignored' };

export class GuideCancellationLatch {
  private requestIds = new Set<string>();
  private sessionIds = new Set<string>();

  latch({ requestId, sessionId }: GuideRequestIdentity) {
    if (requestId) this.requestIds.add(requestId);
    if (sessionId) this.sessionIds.add(sessionId);
  }

  matches({ requestId, sessionId }: GuideRequestIdentity) {
    return Boolean((requestId && this.requestIds.has(requestId)) || (sessionId && this.sessionIds.has(sessionId)));
  }

  clear() {
    this.requestIds.clear();
    this.sessionIds.clear();
  }
}

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

export function isGuideWorkflowScreen(screen: Screen) {
  return GUIDE_WORKFLOW_SCREENS.includes(screen);
}

export function getGuideSelectedRequestState(activeRequest: MarketplaceRequest | undefined, pendingRequests: MarketplaceRequest[], cancellationLatch?: GuideCancellationLatch): GuideSelectedRequestState {
  if (!activeRequest) return { kind: 'none' };
  if (cancellationLatch?.matches({ requestId: activeRequest.id, sessionId: activeRequest.sessionId })) {
    return { kind: 'cancelled', requestId: activeRequest.id, reason: 'latched' };
  }
  if (getRequestActionState(activeRequest).kind === 'cancelled') {
    return { kind: 'cancelled', requestId: activeRequest.id, reason: 'cancelled' };
  }
  if (activeRequest.status === 'pending' && !activeRequest.sessionId && !pendingRequests.some((request) => request.id === activeRequest.id)) {
    return { kind: 'cancelled', requestId: activeRequest.id, reason: 'missing' };
  }
  return { kind: 'actionable', requestId: activeRequest.id };
}

export function getGuideScreenContent(screen: Screen, selectedRequestState: GuideSelectedRequestState): GuideScreenContent {
  const travelerCancelled = selectedRequestState.kind === 'cancelled';
  const terminalWorkflowScreen = travelerCancelled && isGuideWorkflowScreen(screen);
  return {
    kind: terminalWorkflowScreen ? 'cancelled' : 'content',
    travelerCancelled,
    mountsIncomingRequest: screen === 'request' && !terminalWorkflowScreen,
    mountsIncomingRequestActions: screen === 'request' && !terminalWorkflowScreen,
    mountsBottomNavigation: !travelerCancelled,
  };
}

export function shouldPollGuideSession(request?: MarketplaceRequest) {
  return Boolean(request?.sessionId && canRunGuideWalkAction(request));
}

export function filterActionableRequests(requests: MarketplaceRequest[]) {
  return requests.filter((request) => getRequestActionState(request).kind === 'actionable');
}

export function filterGuidePendingRequests(requests: MarketplaceRequest[], cancellationLatch?: GuideCancellationLatch) {
  return filterActionableRequests(requests).filter((request) => !cancellationLatch?.matches({ requestId: request.id, sessionId: request.sessionId }));
}

function cancelledGuideRequest(request: MarketplaceRequest) {
  return { ...request, status: 'cancelled' as const };
}

function isCancellationLatched(request: MarketplaceRequest, sessionId: string | null | undefined, cancellationLatch?: GuideCancellationLatch) {
  return cancellationLatch?.matches({ requestId: request.id, sessionId: sessionId ?? request.sessionId }) ?? false;
}

function latchCancelledRequest(request: MarketplaceRequest, sessionId: string | null | undefined, cancellationLatch?: GuideCancellationLatch) {
  cancellationLatch?.latch({ requestId: request.id, sessionId: sessionId ?? request.sessionId });
  return cancelledGuideRequest(request);
}

export function resolveGuidePendingSelection(activeRequest: MarketplaceRequest | undefined, pendingRequests: MarketplaceRequest[], cancellationLatch?: GuideCancellationLatch): GuidePendingSelectionResolution {
  if (!activeRequest) return { kind: 'current' };
  const selectedRequestState = getGuideSelectedRequestState(activeRequest, pendingRequests, cancellationLatch);
  if (selectedRequestState.kind === 'cancelled') {
    const request = latchCancelledRequest(activeRequest, activeRequest.sessionId, cancellationLatch);
    return { kind: selectedRequestState.reason === 'missing' ? 'missing' : 'cancelled', request };
  }
  return { kind: 'current' };
}

export function resolveGuideRequestDetail(activeRequest: MarketplaceRequest | undefined, snapshot: { request: MarketplaceRequest; session?: (Pick<LiveSession, 'id' | 'status'> & CancellationSignalCarrier) | null }, cancellationLatch?: GuideCancellationLatch): GuideRequestDetailResolution {
  if (!activeRequest || snapshot.request.id !== activeRequest.id) return { kind: 'ignored' };
  const sessionId = snapshot.session?.id ?? snapshot.request.sessionId ?? activeRequest.sessionId;
  const request = { ...activeRequest, ...snapshot.request };
  if (
    isCancellationLatched(request, sessionId, cancellationLatch)
    || getRequestActionState(request).kind === 'cancelled'
    || snapshot.session?.status === 'cancelled'
    || hasCancellationReason(snapshot.session ?? undefined)
  ) return { kind: 'cancelled', request: latchCancelledRequest(request, sessionId, cancellationLatch) };
  return { kind: 'updated', request };
}

export function normalizeActiveRequestFromSession(activeRequest: MarketplaceRequest | undefined, snapshot: GuideSessionSnapshot, cancellationLatch?: GuideCancellationLatch) {
  if (!activeRequest) return undefined;
  if (isCancellationLatched(activeRequest, snapshot.session.id, cancellationLatch) || getRequestActionState(activeRequest).kind === 'cancelled') {
    return latchCancelledRequest(activeRequest, snapshot.session.id, cancellationLatch);
  }
  const responseRequest = snapshot.request?.id === activeRequest.id ? snapshot.request : undefined;
  const request = { ...activeRequest, ...responseRequest };
  if (
    getRequestActionState(request).kind === 'cancelled'
    || snapshot.session.status === 'cancelled'
    || hasCancellationReason(snapshot)
    || hasCancellationReason(snapshot.session)
  ) return latchCancelledRequest(request, snapshot.session.id, cancellationLatch);
  if (snapshot.session.status === 'ended') return { ...request, status: 'completed' as const };
  if (snapshot.session.status === 'live') return { ...request, status: 'live' as const };
  return request;
}

export function applyGuideActiveRequestUpdate(current: MarketplaceRequest | undefined, requestId: string, next: MarketplaceRequest | undefined, cancellationLatch?: GuideCancellationLatch) {
  if (current?.id !== requestId) return current;
  if (isCancellationLatched(current, next?.sessionId ?? current.sessionId, cancellationLatch) || getRequestActionState(current).kind === 'cancelled') {
    return latchCancelledRequest(current, next?.sessionId ?? current.sessionId, cancellationLatch);
  }
  if (next && getRequestActionState(next).kind === 'cancelled') return latchCancelledRequest(next, next.sessionId, cancellationLatch);
  return next;
}

export function resolveGuideSessionPoll(activeRequest: MarketplaceRequest | undefined, snapshot: GuideSessionSnapshot, pollCurrent: boolean, cancellationLatch?: GuideCancellationLatch): GuideSessionPollResolution {
  const request = normalizeActiveRequestFromSession(activeRequest, snapshot, cancellationLatch);
  if (!request) return { kind: 'ignored' };
  if (getRequestActionState(request).kind === 'cancelled') return { kind: 'cancelled', request: latchCancelledRequest(request, snapshot.session.id, cancellationLatch) };
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

  remove(requestId?: string) {
    if (requestId) this.lastValidRequests = this.lastValidRequests.filter((request) => request.id !== requestId);
  }

  retain(snapshot: PollSnapshot) {
    if (!this.isCurrent(snapshot)) return { kind: 'stale' as const, requests: this.lastValidRequests };
    return { kind: 'retained' as const, requests: this.lastValidRequests };
  }
}
