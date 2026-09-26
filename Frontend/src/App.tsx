import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Applications from './pages/Applications';
import { AuditLogs, Deployments, Environments, Incidents, Infrastructure, Monitoring, UsersPage } from './pages/PlatformPages';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
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
        <Route path="infrastructure" element={<Infrastructure />} />
        <Route path="monitoring" element={<Monitoring />} />
        <Route path="incidents" element={<Incidents />} />
        <Route path="audit-logs" element={<AuditLogs />} />
        <Route path="users" element={<UsersPage />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
