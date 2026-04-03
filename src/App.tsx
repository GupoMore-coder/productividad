import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { GroupProvider } from './context/GroupContext';
import { OrderProvider } from './context/OrderContext';
import { TaskProvider } from './context/TaskContext';
import {
  requestNotificationPermission,
  initAlarmChecker,
} from './services/NotificationsService';

import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';

const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Tasks = lazy(() => import('./pages/Tasks'));
const FamilyGroup = lazy(() => import('./pages/FamilyGroup'));
const Orders = lazy(() => import('./pages/Orders'));
const SetupProfile = lazy(() => import('./pages/SetupProfile'));
const AdminUsers = lazy(() => import('./pages/AdminUsers'));
const PublicOrderStatus = lazy(() => import('./pages/PublicOrderStatus'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Profile = lazy(() => import('./pages/Profile'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));

import Navigation from './components/Navigation';
import Footer from './components/Footer';
import GlobalNotificationManager from './components/GlobalNotificationManager';
import ErrorBoundary from './components/ErrorBoundary';
import NetworkStatus from './components/NetworkStatus';

// ── Route guards ─────────────────────────────────────────────

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mb-4 shadow-xl shadow-purple-500/20"></div>
        <p className="text-slate-400 font-medium animate-pulse">Sincronizando con la nube...</p>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  
  // Imposición de Setup para Usuarios Default
  if (user.needsSetup) return <Navigate to="/setup" replace />;

  return (
    <>
      <div className="flex flex-col min-h-screen">
        <main className="flex-grow">
          {children}
        </main>
        <Footer />
      </div>
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
      <div className="flex flex-col min-h-screen">
        <main className="flex-grow">
          {children}
        </main>
        <Footer />
      </div>
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
  const GlobalLoader = (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mb-4 shadow-xl shadow-purple-500/20"></div>
      <p className="text-slate-400 font-medium animate-pulse">Cargando módulo...</p>
    </div>
  );

  return (
    <Router>
      <NotificationBootstrap />
      <NetworkStatus />
      <GlobalNotificationManager />
      <Suspense fallback={GlobalLoader}>
        <Routes>
          <Route path="/login"    element={<PublicRoute><div className="flex flex-col min-h-screen"><main className="flex-grow"><Login /></main><Footer /></div></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><div className="flex flex-col min-h-screen"><main className="flex-grow"><Register /></main><Footer /></div></PublicRoute>} />
          <Route path="/setup"    element={<SetupProfile />} />
          <Route path="/privacy"  element={<PrivacyPolicy />} />
          <Route path="/terms"    element={<TermsOfService />} />
          <Route path="/"         element={<PrivateRoute><Tasks /></PrivateRoute>} />
          <Route path="/group"    element={<PrivateRoute><FamilyGroup /></PrivateRoute>} />
          <Route path="/orders"   element={<PrivateRoute><Orders /></PrivateRoute>} />
          <Route path="/profile"  element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/admin"    element={<AdminRoute><AdminUsers /></AdminRoute>} />
          <Route path="/dashboard" element={<AdminRoute><Dashboard /></AdminRoute>} />
          <Route path="/status/:orderId" element={<PublicOrderStatus />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

// ── App root ─────────────────────────────────────────────────

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <AuthProvider>
          <GroupProvider>
            <OrderProvider>
              <TaskProvider>
                <AppRoutes />
              </TaskProvider>
            </OrderProvider>
          </GroupProvider>
        </AuthProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}
