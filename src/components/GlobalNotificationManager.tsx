import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

/**
 * Headless component that listens for global alerts in Supabase (Real-time)
 * or localStorage fallback and triggers browser notifications.
 */
export default function GlobalNotificationManager() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const showNotification = (title: string, body: string, id?: string) => {
      if (!("Notification" in window)) return;
      if (Notification.permission === "granted") {
        new Notification(title, {
          body,
          icon: '/pwa-192x192.png',
          tag: id,
          requireInteraction: true,
        });
      }
    };

    // 1. REAL-TIME SUPABASE LOGIC
    if (isSupabaseConfigured) {
      const channel = supabase
        .channel('global-alerts')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'global_alerts' }, (payload) => {
          const alert = payload.new;
          // Don't notify the person who created the alert
          if (alert.user_id !== user.id) {
            showNotification(`Grupo More - Nueva Alerta`, alert.message, alert.id);
          }
        })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    } 

    // 2. LOCAL FALLBACK LOGIC
    const checkAlerts = () => {
      const alerts = JSON.parse(localStorage.getItem('mock_global_alerts') || '[]');
      let changed = false;

      alerts.forEach((alert: any) => {
        if (!alert.seenBy.includes(user.id)) {
          showNotification('Grupo More - Actualización', alert.message, alert.id);
          alert.seenBy.push(user.id);
          changed = true;
        }
      });

      if (changed) {
        localStorage.setItem('mock_global_alerts', JSON.stringify(alerts));
      }
    };

    checkAlerts();
    const handleLocalAlert = () => checkAlerts();
    window.addEventListener('app:global-alert-added', handleLocalAlert);
    const interval = setInterval(checkAlerts, 10000); 
    window.addEventListener('storage', (e) => {
      if (e.key === 'mock_global_alerts') checkAlerts();
    });

    return () => {
      window.removeEventListener('app:global-alert-added', handleLocalAlert);
      window.removeEventListener('storage', handleLocalAlert);
      clearInterval(interval);
    };
  }, [user]);

  return null;
}
