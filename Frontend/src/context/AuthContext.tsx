import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { api } from '../lib/api';
import { session, type Session } from '../lib/session';
import type { Role, TokenResponse, User } from '../lib/types';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  /** true if the signed-in user has one of the roles */
  can: (...roles: Role[]) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [s, setS] = useState<Session | null>(() => session.get());

  useEffect(() => session.subscribe(setS), []);

  // refresh the profile once per load (role/name changes, disabled accounts)
  useEffect(() => {
    if (!session.get()) return;
    api.get<User>('/auth/me').then((r) => session.updateUser(r.data)).catch(() => { /* interceptor handles 401 */ });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post<TokenResponse>('/auth/login', { email, password });
    session.set(data);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    const current = session.get();
    session.clear();
    if (current) {
      try { await api.post('/auth/logout', { refreshToken: current.refreshToken }); } catch { /* already signed out locally */ }
    }
  }, []);

  const can = useCallback((...roles: Role[]) => !!s && roles.includes(s.user.role), [s]);

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!s, user: s?.user ?? null, login, logout, can }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
