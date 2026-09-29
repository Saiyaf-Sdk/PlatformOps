import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { api } from '../lib/api';
import { session } from '../lib/session';
import type { Role, TokenResponse, User } from '../lib/types';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<User>;
  signup: (fullName: string, email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  /** true if the signed-in user has one of the roles */
  can: (...roles: Role[]) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [s, setS] = useState(() => session.get());

  useEffect(() => session.subscribe(setS), []);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post<TokenResponse>('/auth/login', { email, password });
    session.set(data);
    return data.user;
  }, []);

  const signup = useCallback(async (fullName: string, email: string, password: string) => {
    const { data } = await api.post<TokenResponse>('/auth/signup', { fullName, email, password });
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
    <AuthContext.Provider value={{ isAuthenticated: !!s, user: s?.user ?? null, login, signup, logout, can }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
