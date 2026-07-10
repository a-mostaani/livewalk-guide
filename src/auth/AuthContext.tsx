import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { clearAuthToken, getCurrentUser, loginAccount, registerAccount, setAuthFailureHandler, setAuthToken } from '../api';
import type { AuthPayload, AuthUser } from '../types';
import { clearStoredAuthToken, readStoredAuthToken, saveStoredAuthToken } from './tokenStorage';

type AuthContextValue = {
  user?: AuthUser;
  token: string;
  busy: boolean;
  error: string;
  login: (payload: AuthPayload) => Promise<void>;
  register: (payload: AuthPayload) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | undefined>();
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');

  const resetAuth = useCallback(async () => {
    clearAuthToken();
    await clearStoredAuthToken();
    setToken('');
    setUser(undefined);
  }, []);

  useEffect(() => {
    setAuthFailureHandler(resetAuth);
    return () => setAuthFailureHandler(undefined);
  }, [resetAuth]);

  useEffect(() => {
    let mounted = true;

    const hydrate = async () => {
      try {
        const storedToken = await readStoredAuthToken();
        if (!mounted) return;
        if (!storedToken) return;

        setAuthToken(storedToken);
        setToken(storedToken);
        const data = await getCurrentUser();
        if (!mounted) return;
        setUser(data.user);
      } catch {
        await resetAuth();
      } finally {
        if (mounted) setBusy(false);
      }
    };

    hydrate();
    return () => { mounted = false; };
  }, [resetAuth]);

  const authenticate = useCallback(async (mode: 'register' | 'login', payload: AuthPayload) => {
    setBusy(true);
    setError('');
    try {
      const data = mode === 'register' ? await registerAccount(payload) : await loginAccount(payload);
      setAuthToken(data.token);
      await saveStoredAuthToken(data.token);
      setToken(data.token);
      setUser(data.user);
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : 'Authentication failed');
    } finally {
      setBusy(false);
    }
  }, []);

  const login = useCallback((payload: AuthPayload) => authenticate('login', payload), [authenticate]);
  const register = useCallback((payload: AuthPayload) => authenticate('register', payload), [authenticate]);

  const logout = useCallback(async () => {
    await resetAuth();
    setError('');
  }, [resetAuth]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    token,
    busy,
    error,
    login,
    register,
    logout,
  }), [user, token, busy, error, login, register, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
