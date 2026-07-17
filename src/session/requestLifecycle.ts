import type { MarketplaceRequest } from '../types';

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
