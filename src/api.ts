import type { AuthPayload, AuthUser, LiveSession, MarketplaceRequest, SessionMessage } from './types';
export type { AuthPayload, AuthUser, LiveSession, MarketplaceGuide, MarketplaceRequest, SessionMessage } from './types';

export const API_BASE = 'https://rendezvous-livewalk-api.webpeter.com';

let authToken = '';
export function setAuthToken(token: string) { authToken = token; }
export function clearAuthToken() { authToken = ''; }

function friendlyApiError(status: number, raw: string) {
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
  if (!response.ok || !data.ok) throw new Error(friendlyApiError(response.status, data.error));
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

export async function startSession(sessionId: string) {
  return api<{ ok: true; session: LiveSession; messages: SessionMessage[] }>(`/api/sessions/${sessionId}/start`, { method: 'POST' });
}

export async function getSessionStatus(sessionId: string) {
  return api<{ ok: true; session: LiveSession; messages: SessionMessage[] }>(`/api/sessions/${sessionId}/status`);
}

export async function sendSessionMessage(sessionId: string, text: string) {
  return api<{ ok: true; message: SessionMessage }>(`/api/sessions/${sessionId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
}
