import { describe, expect, it } from 'vitest';
import { ApiError, isRequestCancelledError, readApiErrorCode } from '../src/apiErrors';
import {
  CANCELLED_WALK_DESCRIPTION,
  CANCELLED_WALK_TITLE,
  canFetchPendingRequests,
  filterActionableRequests,
  getRequestActionState,
  RequestPollGate,
  shouldReloadDashboard,
} from '../src/session/requestLifecycle';
import type { MarketplaceRequest } from '../src/types';

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
});
