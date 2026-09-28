import { createContext, useContext, useState, useEffect } from 'react';
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('platform_token');
    if (token) {
      setIsAuthenticated(true);
      setUser({ name: 'Admin User', role: 'DEVOPS_ADMIN' });
    }
  }, []);

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
