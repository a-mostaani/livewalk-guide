import React, { createContext, ReactNode, useContext, useMemo, useState } from 'react';
import { clearAuthToken, loginAccount, registerAccount, setAuthToken } from '../api';
import type { AuthPayload, AuthUser } from '../types';

type AuthContextValue = {
  user?: AuthUser;
  token: string;
  busy: boolean;
  error: string;
  login: (payload: AuthPayload) => Promise<void>;
  register: (payload: AuthPayload) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | undefined>();
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const authenticate = async (mode: 'register' | 'login', payload: AuthPayload) => {
    setBusy(true);
    setError('');
    try {
      const data = mode === 'register' ? await registerAccount(payload) : await loginAccount(payload);
      setAuthToken(data.token);
      setToken(data.token);
      setUser(data.user);
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : 'Authentication failed');
    } finally {
      setBusy(false);
    }
  };

  const value = useMemo<AuthContextValue>(() => ({
    user,
    token,
    busy,
    error,
    login: (payload) => authenticate('login', payload),
    register: (payload) => authenticate('register', payload),
    logout: () => {
      clearAuthToken();
      setToken('');
      setUser(undefined);
      setError('');
    },
  }), [user, token, busy, error]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
