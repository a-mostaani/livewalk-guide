export const API_BASE = 'https://rendezvous-livewalk-api.webpeter.com';

export type MarketplaceGuide = { id: string; name: string; avatar?: string };
export type MarketplaceRequest = {
  id: string;
  travelerName: string;
  origin: string;
  destination: string;
  route: string;
  scheduledTime: string;
  duration: string;
  language: string;
  interests: string[];
  status: 'pending' | 'accepted' | 'declined' | 'live';
  guide: MarketplaceGuide | null;
  sessionId: string | null;
  createdAt: string;
  updatedAt: string;
};
export type LiveSession = { id: string; requestId: string; status: 'ready' | 'live'; startedAt?: string | null; location?: { label?: string; progress?: number } | null };
export type SessionMessage = { id: string; sessionId: string; senderRole: string; senderName: string; text: string; createdAt: string };
export type AuthUser = { id: string; email: string; name: string; role: 'traveler' | 'guide'; createdAt: string };
export type AuthPayload = { name?: string; email: string; password: string };

let authToken = '';
export function setAuthToken(token: string) { authToken = token; }
export function clearAuthToken() { authToken = ''; }

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(authToken ? { authorization: `Bearer ${authToken}` } : {}),
      ...(init?.headers || {}),
    },
  });
  const data = await response.json();
  if (!response.ok || !data.ok) throw new Error(data.error || `API ${response.status}`);
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
  return api<{ ok: true; request: MarketplaceRequest; session: LiveSession }>(`/api/requests/${id}/accept`, {
    method: 'POST',
    body: JSON.stringify({ guideId: 'guide_yuki', guideName: 'Yuki Tanaka', guideAvatar: 'YT' }),
  });
}

export async function declineRequest(id: string) {
  return api<{ ok: true; request: MarketplaceRequest }>(`/api/requests/${id}/decline`, {
    method: 'POST',
    body: JSON.stringify({ guideId: 'guide_yuki', guideName: 'Yuki Tanaka' }),
  });
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
    body: JSON.stringify({ senderRole: 'guide', senderName: 'Yuki', text }),
  });
}
