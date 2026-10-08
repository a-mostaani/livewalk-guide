// TICKET-7: the mobile apps had no way to sign out. A logout function existed
// in the auth context but no control called it, and the server token was
// never invalidated.
import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { signOutEverywhere, signOutPrompt } from '../src/auth/signOut';

async function loadApi() {
  vi.resetModules();
  vi.doMock('expo-constants', () => ({ default: { expoConfig: { extra: { apiBaseUrl: 'https://api.example', mapboxTokenMobile: 'pk.test', mapboxTokenWeb: 'pk.test' } } } }));
  vi.doMock('react-native', () => ({ Platform: { OS: 'android' } }));
  return import('../src/api');
}

afterEach(() => {
  vi.doUnmock('expo-constants');
  vi.doUnmock('react-native');
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe('TICKET-7: sign out on mobile', () => {
  it('TICKET-7: the API client invalidates the token on the server', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true, loggedOut: true }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const api = await loadApi();
    api.setAuthToken('token-123');
    await api.logoutAccount();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.example/api/auth/logout');
    expect(init.method).toBe('POST');
    expect(init.headers.authorization).toBe('Bearer token-123');
  });

  it('TICKET-7: signing out clears the phone even when the server cannot be reached', async () => {
    const order: string[] = [];
    await signOutEverywhere({
      logoutRemote: async () => { order.push('remote'); throw new Error('offline'); },
      clearLocal: async () => { order.push('local'); },
    });
    expect(order).toEqual(['remote', 'local']);
  });

  it('TICKET-7: the server is told before the local token is dropped', async () => {
    const order: string[] = [];
    await signOutEverywhere({
      logoutRemote: async () => { order.push('remote'); },
      clearLocal: async () => { order.push('local'); },
    });
    expect(order).toEqual(['remote', 'local']);
  });

  it('TICKET-7: signing out during a live walk warns that the walk continues', () => {
    expect(signOutPrompt(false).title).toBe('Sign out?');
    expect(signOutPrompt(true).title).toMatch(/live walk/i);
    expect(signOutPrompt(true).message).not.toBe(signOutPrompt(false).message);
  });

  it('TICKET-7: the app header has a Sign out control wired to the auth context', () => {
    const app = readFileSync('App.tsx', 'utf8');
    expect(app).toMatch(/accessibilityLabel="Sign out"/);
    expect(app).toMatch(/signOutPrompt\(/);
    expect(app).toMatch(/\blogout\b/);
    const auth = readFileSync('src/auth/AuthContext.tsx', 'utf8');
    expect(auth).toMatch(/signOutEverywhere\(/);
    expect(auth).toMatch(/logoutAccount/);
  });
});
