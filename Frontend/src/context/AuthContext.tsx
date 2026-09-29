import { createContext, useContext, useState, type ReactNode } from 'react';

interface User {
  name: string;
  role: string;
  email?: string;
}

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
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(localStorage.getItem('platform_token')));
  const [user, setUser] = useState<User | null>(() => localStorage.getItem('platform_token') ? { name: 'Admin User', role: 'DEVOPS_ADMIN' } : null);

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
