import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { GroupProvider } from './context/GroupContext';
import { OrderProvider } from './context/OrderContext';
import { TaskProvider } from './context/TaskContext';
import { ApprovalProvider } from './context/ApprovalContext';
import { InventoryProvider } from './context/InventoryContext';
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
const InventoryPage = lazy(() => import('./pages/InventoryModule'));
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
import PWAInstallBanner from './components/PWAInstallBanner';
import ErrorBoundary from './components/ErrorBoundary';
import NetworkStatus from './components/NetworkStatus';
import RealtimeNotificationListener from './components/RealtimeNotificationListener';
import { useSyncManager } from './hooks/useSyncManager';

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

  const isSandboxExpired = user.role === 'Colaborador' && user.sandboxExpiry && new Date(user.sandboxExpiry).getTime() < Date.now();

  if (isSandboxExpired) {
    return (
      <div className="min-h-screen bg-[#0f0a15] flex flex-col items-center justify-center p-8 text-center">
        <div className="w-24 h-24 bg-amber-500/10 rounded-[40px] flex items-center justify-center text-amber-500 mb-10 animate-pulse border border-amber-500/20">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </div>
        <h2 className="text-3xl font-black text-white mb-4 uppercase tracking-tighter">Periodo de Prueba Finalizado</h2>
        <p className="text-amber-500 font-bold text-[0.65rem] uppercase tracking-[0.3em] mb-12 opacity-80">72 Horas de Sandbox Agotadas</p>
        <div className="max-w-xs text-slate-400 text-sm font-medium leading-relaxed mb-12 space-y-6">
          <p>Tu acceso temporal ha caducado según la política de seguridad corporativa.</p>
          <div className="p-5 bg-white/[0.03] rounded-3xl border border-white/5 italic text-xs leading-relaxed text-slate-500">
            "Contacta al Administrador Maestro para solicitar una extensión o la asignación de un rol permanente."
          </div>
        </div>
        <button 
          onClick={async () => {
             window.location.href = '/login';
          }}
          className="px-12 py-5 rounded-[24px] bg-white text-slate-950 font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-white/5"
        >
          Cerrar Sesión Corporativa
        </button>
      </div>
    );
  }

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
  const { user } = useAuth();
  const { isSyncing, pendingCount } = useSyncManager();

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
      
      {/* v11: Vanguard Sync Progress Indicator */}
      {pendingCount > 0 && (
        <div className="fixed top-20 right-4 z-[99] flex items-center gap-3 px-4 py-2 rounded-2xl bg-purple-500/10 border border-purple-500/20 backdrop-blur-xl shadow-2xl animate-in slide-in-from-right duration-500">
           <div className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-purple-500 animate-pulse' : 'bg-slate-500'} shadow-[0_0_10px_rgba(168,85,247,0.5)]`} />
           <span className="text-[0.65rem] font-black text-purple-400 uppercase tracking-widest">
              {isSyncing ? 'Sincronizando' : 'Pendiente de Red'} ({pendingCount})
           </span>
        </div>
      )}

      <GlobalNotificationManager />
      <PWAInstallBanner />
      {user && <RealtimeNotificationListener />}
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
          <Route path="/inventory" element={<PrivateRoute><InventoryPage /></PrivateRoute>} />
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
          <ApprovalProvider>
            <InventoryProvider>
              <GroupProvider>
                <OrderProvider>
                  <TaskProvider>
                    <AppRoutes />
                  </TaskProvider>
                </OrderProvider>
              </GroupProvider>
            </InventoryProvider>
          </ApprovalProvider>
        </AuthProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}
