import type { ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './components/Toaster';
import SmoothScroll from './components/SmoothScroll';
import Layout from './components/Layout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Applications from './pages/Applications';
import { AuditLogs, Deployments, Environments, Incidents, Infrastructure, Monitoring, UsersPage } from './pages/PlatformPages';
import { ApplicationDetails, DeploymentDetails, EnvironmentDetails, InfrastructureRequests } from './pages/DetailPages';

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  return <>{children}</>;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="applications" element={<Applications />} />
        <Route path="applications/:applicationId" element={<ApplicationDetails />} />
        <Route path="environments" element={<Environments />} />
        <Route path="environments/:environmentId" element={<EnvironmentDetails />} />
        <Route path="deployments" element={<Deployments />} />
        <Route path="deployments/:deploymentId" element={<DeploymentDetails />} />
        <Route path="infrastructure" element={<Infrastructure />} />
        <Route path="infrastructure-requests" element={<InfrastructureRequests />} />
        <Route path="monitoring" element={<Monitoring />} />
        <Route path="incidents" element={<Incidents />} />
        <Route path="audit-logs" element={<AuditLogs />} />
        <Route path="users" element={<UsersPage />} />
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
