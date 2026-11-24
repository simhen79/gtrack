import type { MeData } from '@gtrack/types';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';
import { api, clearToken, getToken, setToken, SignedOut } from './api';

type Session = {
  /** undefined while the stored token is being checked */
  me: MeData | null | undefined;
  /** Calls the API as the signed-in golfer, returning to sign-in on a 401. */
  call: typeof api;
  /** Checks the token is still accepted and refreshes who is signed in. */
  refresh: () => Promise<void>;
  sendCode: (email: string) => Promise<void>;
  signIn: (email: string, code: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<Session | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<MeData | null | undefined>(undefined);

  const loadMe = useCallback(async () => {
    try {
      setMe(await api<MeData>('/me'));
    } catch (error) {
      if (!(error instanceof SignedOut)) throw error;
      setMe(null);
    }
  }, []);

  useEffect(() => {
    getToken().then((token) => (token ? loadMe() : setMe(null)));
  }, [loadMe]);

  const call = useCallback(async <T,>(path: string, init?: Parameters<typeof api>[1]) => {
    try {
      return await api<T>(path, init);
    } catch (error) {
      if (error instanceof SignedOut) setMe(null);
      throw error;
    }
  }, []) as typeof api;

  const sendCode = useCallback(async (email: string) => {
    await api('/login/code', { method: 'POST', body: { email } });
  }, []);

  const signIn = useCallback(
    async (email: string, code: string) => {
      const { token } = await api<{ token: string }>('/login', {
        method: 'POST',
        body: { email, code, device_name: `${Platform.OS} phone` },
      });
      await setToken(token);
      await loadMe();
    },
    [loadMe],
  );

  const signOut = useCallback(async () => {
    try {
      await api('/logout', { method: 'POST' });
    } catch (error) {
      if (!(error instanceof SignedOut)) throw error;
    }
    await clearToken();
    setMe(null);
  }, []);

  return (
    <SessionContext.Provider value={{ me, call, refresh: loadMe, sendCode, signIn, signOut }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): Session {
  const session = useContext(SessionContext);
  if (!session) throw new Error('useSession needs a SessionProvider');
  return session;
}
