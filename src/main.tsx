import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

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

// Rutina secreta de limpieza global (una sola vez por versión)
if (!localStorage.getItem('app_reset_v4')) {
  localStorage.clear();
  sessionStorage.clear();
  localStorage.setItem('app_reset_v4', 'true');
  console.log('App Factory Reset V4 Completo.');
  window.location.reload();
}

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: any}> {
  constructor(props: any) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error: any) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, background: '#fdd', color: 'red' }}>
          <h2>💥 Fatal React Error</h2>
          <pre>{this.state.error?.message}</pre>
          <pre>{this.state.error?.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
