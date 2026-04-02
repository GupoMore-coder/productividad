import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { GroupProvider } from './context/GroupContext';
import { OrderProvider } from './context/OrderContext';
import { TaskProvider } from './context/TaskContext';
import {
  requestNotificationPermission,
  initAlarmChecker,
} from './services/NotificationsService';

import Login from './pages/Login';
import Register from './pages/Register';
import Tasks from './pages/Tasks';
import FamilyGroup from './pages/FamilyGroup';
import Orders from './pages/Orders';
import SetupProfile from './pages/SetupProfile';
import AdminUsers from './pages/AdminUsers';
import PublicOrderStatus from './pages/PublicOrderStatus';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Navigation from './components/Navigation';
import GlobalNotificationManager from './components/GlobalNotificationManager';

// ── Route guards ─────────────────────────────────────────────

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--accent-color)' }}>
        Cargando sesión…
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  
  // Imposición de Setup para Usuarios Default
  if (user.needsSetup) return <Navigate to="/setup" replace />;

  return (
    <>
      {children}
      <Navigation />
    </>
  );
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--accent-color)' }}>Cargando…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.isSuperAdmin) return <Navigate to="/" replace />;
  return (
    <>
      {children}
      <Navigation />
    </>
  );
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Cargando…</div>;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
};

// ── Notification bootstrap ────────────────────────────────────

function NotificationBootstrap() {
  useEffect(() => {
    // Ask for notification permission after a short delay (better UX)
    const timer = setTimeout(() => {
      requestNotificationPermission();
    }, 2000);

    // Start the periodic alarm checker (runs every 90s while app is open)
    const stopChecker = initAlarmChecker();

    return () => {
      clearTimeout(timer);
      stopChecker();
    };
  }, []);

  return null;
}

// ── Routes ────────────────────────────────────────────────────

function AppRoutes() {
  return (
    <Router>
      <NotificationBootstrap />
      <GlobalNotificationManager />
      <Routes>
        <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/setup"    element={<SetupProfile />} />
        <Route path="/"         element={<PrivateRoute><Tasks /></PrivateRoute>} />
        <Route path="/group"    element={<PrivateRoute><FamilyGroup /></PrivateRoute>} />
        <Route path="/orders"   element={<PrivateRoute><Orders /></PrivateRoute>} />
        <Route path="/profile"  element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/admin"    element={<AdminRoute><AdminUsers /></AdminRoute>} />
        <Route path="/dashboard" element={<AdminRoute><Dashboard /></AdminRoute>} />
        <Route path="/status/:orderId" element={<PublicOrderStatus />} />
      </Routes>
    </Router>
  );
}

// ── App root ─────────────────────────────────────────────────

export default function App() {
  return (
    <AuthProvider>
      <GroupProvider>
        <OrderProvider>
          <TaskProvider>
            <AppRoutes />
          </TaskProvider>
        </OrderProvider>
      </GroupProvider>
    </AuthProvider>
  );
}
