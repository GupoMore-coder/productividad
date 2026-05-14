import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';
import * as Sentry from "@sentry/react";

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    // Performance Monitoring
    tracesSampleRate: 1.0,
    // Session Replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}

// PWA Registration with automatic updates
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('🎉 Nueva versión disponible. ¿Deseas actualizar?')) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log('✅ App lista para trabajar sin conexión.');
  },
});

// Escudo de Auto-Recarga (Chunk Load Error Protector)
window.addEventListener('error', (e) => {
  if (e.message && e.message.includes('Failed to fetch dynamically imported module')) {
    console.warn('⚠️ Se detectó un conflicto de versión. Recargando para actualizar...');
    window.location.reload();
  }
}, true);

// Rutina de limpieza de cache de Service Worker (una sola vez por version)
if (!localStorage.getItem('sw_cache_cleared_v5')) {
  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => caches.delete(name));
    });
  }
  localStorage.setItem('sw_cache_cleared_v5', 'true');
  console.log('SW Cache清洁完毕 v5.');
}

const fallbackRender = ({ error }: { error: Error }) => (
  <div style={{ padding: 20, background: '#fdd', color: 'red' }}>
    <h2>💥 Fatal Error</h2>
    <pre>{error.message}</pre>
    <pre>{error.stack}</pre>
  </div>
);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Sentry.ErrorBoundary fallback={fallbackRender}>
      <App />
    </Sentry.ErrorBoundary>
  </React.StrictMode>,
);
