import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface User {
  name: string;
  role: string;
  email?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string, password: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Read the stored token synchronously so a page refresh doesn't bounce to /login
  const hasToken = () => {
    try { return Boolean(localStorage.getItem('platform_token')); } catch { return false; }
  };
  const [isAuthenticated, setIsAuthenticated] = useState(hasToken);
  const [user, setUser] = useState<User | null>(() =>
    hasToken() ? { name: 'Admin User', role: 'DEVOPS_ADMIN' } : null,
  );

  const login = (email: string, _password: string) => {
    localStorage.setItem('platform_token', 'mock-jwt-token');
    setIsAuthenticated(true);
    setUser({ name: 'Admin User', role: 'DEVOPS_ADMIN', email });
  };

  const logout = () => {
    localStorage.removeItem('platform_token');
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
