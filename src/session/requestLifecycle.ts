import type { LiveSession, MarketplaceRequest } from '../types';

export const CANCELLED_WALK_TITLE = 'Traveler cancelled this walk';
export const CANCELLED_WALK_DESCRIPTION = 'No session can start. This walk is no longer available for guide actions.';

export type RequestActionState =
  | { kind: 'actionable' }
  | { kind: 'cancelled'; title: typeof CANCELLED_WALK_TITLE; description: typeof CANCELLED_WALK_DESCRIPTION };

export function isCancelledRequestStatus(status?: MarketplaceRequest['status'] | string | null) {
  return status === 'cancelled';
}

export function getRequestActionState(request?: Pick<MarketplaceRequest, 'status'>): RequestActionState {
  if (isCancelledRequestStatus(request?.status)) {
    return { kind: 'cancelled', title: CANCELLED_WALK_TITLE, description: CANCELLED_WALK_DESCRIPTION };
  }
  return { kind: 'actionable' };
}

export function filterActionableRequests(requests: MarketplaceRequest[]) {
  return requests.filter((request) => getRequestActionState(request).kind === 'actionable');
}

export function normalizeActiveRequestFromSession(activeRequest: MarketplaceRequest | undefined, snapshot: { session: Pick<LiveSession, 'status'>; request?: MarketplaceRequest }) {
  if (!activeRequest) return undefined;
  const responseRequest = snapshot.request?.id === activeRequest.id ? snapshot.request : undefined;
  const request = { ...activeRequest, ...responseRequest };
  if (request.status === 'cancelled' || snapshot.session.status === 'cancelled') return { ...request, status: 'cancelled' as const };
  if (snapshot.session.status === 'ended') return { ...request, status: 'completed' as const };
  if (snapshot.session.status === 'live') return { ...request, status: 'live' as const };
  return request;
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
