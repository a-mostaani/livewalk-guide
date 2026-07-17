import type { AuthPayload, AuthUser, LiveSession, MarketplaceRequest, SessionMessage } from './types';
import { ApiError, readApiErrorCode } from './apiErrors';
export type { AuthPayload, AuthUser, LiveSession, MarketplaceGuide, MarketplaceRequest, SessionMessage } from './types';
export { ApiError, isRequestCancelledError } from './apiErrors';

export type SessionLocationPayload = {
  label?: string;
  lat: number;
  lng: number;
  accuracy?: number | null;
  timestamp?: string;
  progress?: number;
};

import { API_BASE } from './config';
export { API_BASE } from './config';

let authToken = '';
let authFailureHandler: (() => void | Promise<void>) | undefined;

export function setAuthToken(token: string) { authToken = token; }
export function clearAuthToken() { authToken = ''; }
export function setAuthFailureHandler(handler?: () => void | Promise<void>) { authFailureHandler = handler; }

function friendlyApiError(status: number, raw: string, code?: string) {
  if (code === 'request_cancelled') return 'Traveler cancelled this walk. No session can start.';
  const message = String(raw || '').trim();
  const lower = message.toLowerCase();
  if (lower.includes('email already')) return 'That email already has an account. Switch to login, or use a fresh demo email.';
  if (lower.includes('invalid email or password')) return 'Email or password is not right. Check the demo credentials and try again.';
  if (lower.includes('valid email')) return 'Enter a valid email address.';
  if (lower.includes('password must')) return 'Use a password with at least 6 characters.';
  if (lower.includes('login required') || status === 401) return 'Session expired. Log in again, then retry.';
  if (lower.includes('only the guide can start')) return 'Only the Guide can start the live session after Ready is complete.';
  if (lower.includes('not started')) return 'The Guide has not started the live session yet.';
  if (status === 403) return message || 'This account is not allowed to do that step.';
  if (status >= 500) return 'LiveWalk is having a server problem. Retry in a moment.';
  return message || `LiveWalk request failed (${status}).`;
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        'content-type': 'application/json',
        ...(authToken ? { authorization: `Bearer ${authToken}` } : {}),
        ...(init?.headers || {}),
      },
    });
  } catch {
    throw new Error('Cannot reach LiveWalk right now. Check the phone connection and retry.');
  }

  let data: any = {};
  try { data = await response.json(); } catch { data = {}; }
  if (response.status === 401) await authFailureHandler?.();
  if (!response.ok || !data.ok) {
    const code = readApiErrorCode(data);
    const rawError = typeof data.error === 'string' ? data.error : code;
    throw new ApiError(friendlyApiError(response.status, rawError ?? '', code), response.status, code);
  }
  return data;
}

export async function registerAccount(payload: AuthPayload) {
  return api<{ ok: true; user: AuthUser; token: string }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ ...payload, role: 'guide' }),
  });
}

export async function loginAccount(payload: AuthPayload) {
  return api<{ ok: true; user: AuthUser; token: string }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getCurrentUser() {
  return api<{ ok: true; user: AuthUser }>('/api/auth/me');
}

export async function health() {
  return api<{ ok: true; backend: string; time: string }>('/api/health');
}

export async function listPendingRequests() {
  return api<{ ok: true; requests: MarketplaceRequest[] }>('/api/requests?status=pending');
}

export async function acceptRequest(id: string) {
  return api<{ ok: true; request: MarketplaceRequest; session: LiveSession }>(`/api/requests/${id}/accept`, { method: 'POST' });
}

export async function declineRequest(id: string) {
  return api<{ ok: true; request: MarketplaceRequest }>(`/api/requests/${id}/decline`, { method: 'POST' });
}

export type SessionStatusResponse = {
  ok: true;
  session: LiveSession;
  request?: MarketplaceRequest;
  messages: SessionMessage[];
  requestCancellation?: unknown;
  cancellation?: unknown;
  requestCancellationReason?: unknown;
  cancellationReason?: unknown;
};

export async function startSession(sessionId: string) {
  return api<SessionStatusResponse>(`/api/sessions/${sessionId}/start`, { method: 'POST' });
}

export async function endSession(sessionId: string) {
  return api<SessionStatusResponse>(`/api/sessions/${sessionId}/end`, { method: 'POST' });
}

export async function getSessionStatus(sessionId: string) {
  return api<SessionStatusResponse>(`/api/sessions/${sessionId}/status`);
}

export async function sendSessionMessage(sessionId: string, text: string) {
  return api<{ ok: true; message: SessionMessage }>(`/api/sessions/${sessionId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
}


export async function updateSessionLocation(sessionId: string, payload: SessionLocationPayload) {
  return api<{ ok: true; session: LiveSession }>(`/api/sessions/${sessionId}/location`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
