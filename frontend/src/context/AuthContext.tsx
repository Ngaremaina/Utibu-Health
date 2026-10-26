import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { api, type AuthResponse, type User } from '@/api';
import { onSessionExpired } from '@/api/client';
import { tokenStorage } from '@/storage/tokenStorage';

type AuthStatus = 'loading' | 'signedOut' | 'signedIn';

interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (username: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let active = true;
    tokenStorage
      .load()
      .catch(() => null)
      .then((session) => {
        if (!active) return;
        setUser(session?.user ?? null);
        setStatus(session ? 'signedIn' : 'signedOut');
      });

    onSessionExpired(() => {
      setUser(null);
      setStatus('signedOut');
    });
    return () => {
      active = false;
      onSessionExpired(null);
    };
  }, []);

  const startSession = useCallback(async (response: AuthResponse) => {
    await tokenStorage.save({
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
      user: response.user,
    });
    setUser(response.user);
    setStatus('signedIn');
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      await startSession(await api.auth.login(email.trim(), password));
    },
    [startSession],
  );

  const signUp = useCallback(
    async (username: string, email: string, password: string) => {
      await startSession(await api.auth.register(username.trim(), email.trim(), password));
    },
    [startSession],
  );

  const signOut = useCallback(async () => {
    await tokenStorage.clear();
    setUser(null);
    setStatus('signedOut');
  }, []);

  const value = useMemo(
    () => ({ status, user, signIn, signUp, signOut }),
    [status, user, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
