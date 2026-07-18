import { describe, expect, it } from 'vitest';
import { ApiError, isRequestCancelledError, readApiErrorCode } from '../src/apiErrors';
import {
  CANCELLED_WALK_DESCRIPTION,
  CANCELLED_WALK_TITLE,
  canFetchPendingRequests,
  canRunGuideWalkAction,
  filterActionableRequests,
  getRequestActionState,
  normalizeActiveRequestFromSession,
  RequestPollGate,
  resolveGuideSessionPoll,
  shouldPollGuideSession,
  shouldRefreshGuideState,
  shouldReloadDashboard,
} from '../src/session/requestLifecycle';
import type { LiveSession, MarketplaceRequest } from '../src/types';

const pendingRequest: MarketplaceRequest = {
  id: 'request-pending',
  travelerName: 'Alex Traveler',
  origin: { label: 'Start', lat: 35.1, lng: 139.1 },
  destination: { label: 'Finish', lat: 35.2, lng: 139.2 },
  route: 'Start → Finish',
  scheduledStart: '2026-07-17T10:00:00.000Z',
  durationMinutes: 45,
  language: 'English',
  interests: ['Architecture'],
  estimate: { currency: 'USD', distanceKm: 2.2, walkingMinutes: 45, platformFee: 2, guideFee: 18, total: 20 },
  status: 'pending',
  guide: null,
  sessionId: null,
  createdAt: '2026-07-17T09:55:00.000Z',
  updatedAt: '2026-07-17T09:55:00.000Z',
};

describe('Guide request lifecycle', () => {
  it('waits for auth hydration before fetching requests created before Guide opens', () => {
    expect(canFetchPendingRequests({ enabled: false, authReady: false, online: true })).toBe(false);
    expect(canFetchPendingRequests({ enabled: true, authReady: false, online: true })).toBe(false);
    expect(canFetchPendingRequests({ enabled: true, authReady: true, online: true })).toBe(true);
  });

  it('does not let an unauthenticated or older poll overwrite an authenticated list', () => {
    const gate = new RequestPollGate();
    const unauthenticatedPoll = gate.beginPoll();

    gate.reset({ clearLastValid: true });
    const authenticatedPoll = gate.beginPoll();

    expect(gate.accept(unauthenticatedPoll, [pendingRequest]).kind).toBe('stale');
    expect(gate.accept(authenticatedPoll, [pendingRequest])).toEqual({ kind: 'accepted', requests: [pendingRequest] });
  });

  it('retains the last valid request list when a newer poll fails transiently', () => {
    const gate = new RequestPollGate();
    const successfulPoll = gate.beginPoll();
    gate.accept(successfulPoll, [pendingRequest]);

    const failedPoll = gate.beginPoll();
    expect(gate.retain(failedPoll)).toEqual({ kind: 'retained', requests: [pendingRequest] });
  });

  it('reloads when the online dashboard regains focus', () => {
    expect(shouldReloadDashboard({ dashboardFocused: true, appActive: true, enabled: true, authReady: true, online: true })).toBe(true);
    expect(shouldReloadDashboard({ dashboardFocused: false, appActive: true, enabled: true, authReady: true, online: true })).toBe(false);
    expect(shouldReloadDashboard({ dashboardFocused: true, appActive: false, enabled: true, authReady: true, online: true })).toBe(false);
  });

  it('refreshes an accepted walk when any guide workflow screen regains focus', () => {
    expect(shouldRefreshGuideState({ screenFocused: true, appActive: true, enabled: true, authReady: true })).toBe(true);
    expect(shouldRefreshGuideState({ screenFocused: false, appActive: true, enabled: true, authReady: true })).toBe(false);
  });

  it('renders cancelled requests as non-actionable cards and removes them from actionable lists', () => {
    const cancelledRequest = { ...pendingRequest, id: 'request-cancelled', status: 'cancelled' as const };

    expect(getRequestActionState(cancelledRequest)).toEqual({
      kind: 'cancelled',
      title: CANCELLED_WALK_TITLE,
      description: CANCELLED_WALK_DESCRIPTION,
    });
    expect(filterActionableRequests([pendingRequest, cancelledRequest])).toEqual([pendingRequest]);
  });

  it('recognizes a 409 request_cancelled API response', () => {
    const error = new ApiError('Traveler cancelled this walk. No session can start.', 409, 'request_cancelled');

    expect(readApiErrorCode({ error: 'request_cancelled' })).toBe('request_cancelled');
    expect(isRequestCancelledError(error)).toBe(true);
    expect(isRequestCancelledError(new ApiError('Conflict', 409, 'other_conflict'))).toBe(false);
  });

  it('replaces an accepted guide card when the traveler cancellation is returned by the session poll', () => {
    const acceptedRequest: MarketplaceRequest = {
      ...pendingRequest,
      id: 'request-accepted',
      status: 'accepted',
      guide: { id: 'guide-1', name: 'Guide' },
      sessionId: 'session-1',
    };
    const cancelledRequest = { ...acceptedRequest, status: 'cancelled' as const };
    const afterPoll = normalizeActiveRequestFromSession(acceptedRequest, {
      session: { id: 'session-1', requestId: acceptedRequest.id, status: 'cancelled' },
      request: cancelledRequest,
    });

    expect(afterPoll?.status).toBe('cancelled');
    expect(getRequestActionState(afterPoll).kind).toBe('cancelled');
  });

  it('cancels the guide card when the session poll only exposes a cancelled request', () => {
    const acceptedRequest = { ...pendingRequest, status: 'accepted' as const, sessionId: 'session-2' };
    const afterPoll = normalizeActiveRequestFromSession(acceptedRequest, {
      session: { id: 'session-2', requestId: acceptedRequest.id, status: 'ready' },
      request: { ...acceptedRequest, status: 'cancelled' },
    });

    expect(afterPoll?.status).toBe('cancelled');
  });

  it('models accepted → ready session → traveler cancel → Guide poll → cancelled UI state', () => {
    const acceptedRequest = {
      ...pendingRequest,
      id: 'request-pre-live-cancel',
      status: 'accepted' as const,
      guide: { id: 'guide-1', name: 'Guide' },
      sessionId: 'session-pre-live-cancel',
    };
    const readyPoll = resolveGuideSessionPoll(acceptedRequest, {
      session: { id: acceptedRequest.sessionId, requestId: acceptedRequest.id, status: 'ready' },
      request: acceptedRequest,
    }, true);
    expect(readyPoll).toMatchObject({ kind: 'updated', request: { status: 'accepted' } });

    const cancelledPoll = resolveGuideSessionPoll(acceptedRequest, {
      session: { id: acceptedRequest.sessionId, requestId: acceptedRequest.id, status: 'ready' },
      request: { ...acceptedRequest, status: 'cancelled' },
    }, false);

    expect(cancelledPoll).toMatchObject({ kind: 'cancelled', request: { status: 'cancelled' } });
    if (cancelledPoll.kind === 'cancelled') expect(getRequestActionState(cancelledPoll.request).kind).toBe('cancelled');
  });

  it('makes a cancelled pre-live walk terminal for Guide polling and actions', () => {
    const acceptedRequest = {
      ...pendingRequest,
      id: 'request-terminal-cancel',
      status: 'accepted' as const,
      guide: { id: 'guide-1', name: 'Guide' },
      sessionId: 'session-terminal-cancel',
    };
    const cancelledPoll = resolveGuideSessionPoll(acceptedRequest, {
      session: { id: acceptedRequest.sessionId, requestId: acceptedRequest.id, status: 'cancelled' },
      request: { ...acceptedRequest, status: 'cancelled' },
    }, true);

    expect(cancelledPoll).toMatchObject({ kind: 'cancelled', request: { status: 'cancelled' } });
    if (cancelledPoll.kind === 'cancelled') {
      expect(shouldPollGuideSession(cancelledPoll.request)).toBe(false);
      expect(canRunGuideWalkAction(cancelledPoll.request)).toBe(false);
    }
    expect(shouldPollGuideSession(acceptedRequest)).toBe(true);
    expect(canRunGuideWalkAction(acceptedRequest)).toBe(true);
  });

  type CancellationSignal = {
    request?: MarketplaceRequest;
    session?: Partial<LiveSession>;
    requestCancellation?: unknown;
    cancellation?: unknown;
    requestCancellationReason?: unknown;
    cancellationReason?: unknown;
  };
  const cancellationSignals: Array<[string, CancellationSignal]> = [
    ['request status', { request: { ...pendingRequest, status: 'cancelled' } }],
    ['session status', { session: { status: 'cancelled' } }],
    ['top-level requestCancellation', { requestCancellation: { reason: 'traveler_cancelled' } }],
    ['top-level cancellation reason', { cancellationReason: 'traveler_cancelled' }],
    ['request cancellation reason', { request: { ...pendingRequest, cancellationReason: 'traveler_cancelled' } }],
    ['session cancellation reason', { session: { cancellation: { reason: 'traveler_cancelled' } } }],
  ];

  it.each(cancellationSignals)('normalizes %s as a cancelled pre-live walk', (_name, signal) => {
    const acceptedRequest = { ...pendingRequest, status: 'accepted' as const, sessionId: 'session-cancellation-signal' };
    const afterPoll = normalizeActiveRequestFromSession(acceptedRequest, {
      session: { id: acceptedRequest.sessionId, requestId: acceptedRequest.id, status: 'ready', ...signal.session },
      request: signal.request ?? acceptedRequest,
      requestCancellation: signal.requestCancellation,
      cancellation: signal.cancellation,
      requestCancellationReason: signal.requestCancellationReason,
      cancellationReason: signal.cancellationReason,
    });

    expect(afterPoll?.status).toBe('cancelled');
    expect(getRequestActionState(afterPoll).kind).toBe('cancelled');
  });
});
