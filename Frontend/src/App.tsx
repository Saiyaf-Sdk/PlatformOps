import type { ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './components/Toaster';
import SmoothScroll from './components/SmoothScroll';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Applications from './pages/Applications';
import Deployments from './pages/Deployments';
import Environments from './pages/Environments';
import Incidents from './pages/Incidents';
import AuditLog from './pages/AuditLog';
import Users from './pages/Users';
import ComingSoon from './pages/ComingSoon';
import type { Role } from './lib/types';

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  return <>{children}</>;
};

const RoleRoute = ({ roles, children }: { roles: Role[]; children: ReactNode }) => {
  const { can } = useAuth();
  return can(...roles) ? <>{children}</> : <Navigate to="/dashboard" replace />;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="applications" element={<Applications />} />
        <Route path="environments" element={<Environments />} />
        <Route path="deployments" element={<Deployments />} />
        <Route path="infrastructure" element={<ComingSoon />} />
        <Route path="monitoring" element={<ComingSoon />} />
        <Route path="incidents" element={<Incidents />} />
        <Route path="audit-logs" element={<RoleRoute roles={['ADMIN', 'DEVOPS']}><AuditLog /></RoleRoute>} />
        <Route path="users" element={<RoleRoute roles={['ADMIN']}><Users /></RoleRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <SmoothScroll />
      <ToastProvider>
        <AuthProvider>
          <Router>
            <AppRoutes />
          </Router>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
