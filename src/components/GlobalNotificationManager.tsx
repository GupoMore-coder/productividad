import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { triggerCriticalAlert } from '../services/NotificationsService';

/**
 * Headless component that listens for global alerts in Supabase (Real-time)
 * or localStorage fallback and triggers browser notifications.
 */
export default function GlobalNotificationManager() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const showNotification = async (title: string, body: string, id?: string, isCritical = false) => {
      // 1. Logic for Critical Alerts (New)
      if (isCritical) {
        await triggerCriticalAlert(title, body);
        
        // Dispatch event for UI Modal
        window.dispatchEvent(new CustomEvent('app:show-unified-alarm', {
          detail: {
            id: id || `global-crit-${Date.now()}`,
            type: 'critical',
            title,
            body
          }
        }));
        return;
      }

      // 2. Standard Native Push
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(title, {
          body,
          icon: '/pwa-192x192.png',
          tag: id,
          requireInteraction: true,
        });
      }
      
      // 3. In-App Fullscreen Modal (Standard)
      window.dispatchEvent(new CustomEvent('app:show-unified-alarm', {
        detail: {
          id: id || `global-${Date.now()}`,
          type: 'global',
          title,
          body
        }
      }));
    };

    // 1. REAL-TIME SUPABASE LOGIC
    if (isSupabaseConfigured) {
      const channel = supabase
        .channel('global-alerts')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'global_alerts' }, (payload) => {
          const alert = payload.new;
          // Don't notify the person who created the alert (unless explicitly marked critical for all)
          if (alert.user_id !== user.id) {
            const isCritical = alert.type === 'critical';
            showNotification(
              isCritical ? `🚨 ALERTA CRÍTICA` : `More Paper & Design - Nueva Alerta`, 
              alert.message, 
              alert.id,
              isCritical
            );
          }
        })
        .subscribe();

      // 1.1 BACKGROUND BROADCAST WORKER (Fase 3: Hitos Globales)
      const checkBroadcastQueue = async () => {
        try {
          const now = new Date().toISOString();
          // Find due items not yet broadcasted
          const { data: dueItems, error } = await supabase
            .from('global_broadcast_queue')
            .select('*')
            .eq('broadcasted', false)
            .lte('fire_at', now);
          
          if (error) throw error;

          for (const item of dueItems) {
            // Attempt to "Lock" the item by marking as broadcasted
            const { data: updated, error: updateError } = await supabase
              .from('global_broadcast_queue')
              .update({ broadcasted: true })
              .eq('id', item.id)
              .eq('broadcasted', false) // Double check for race conditions
              .select();

            if (updateError || !updated || updated.length === 0) continue;

            // This instance won the race! 
            
            if (item.type === 'breach_check') {
              // VERIFY ORDER STATUS
              const { data: order } = await supabase
                .from('service_orders')
                .select('id, status, created_by, customer_name')
                .eq('id', item.order_id)
                .single();

              if (order && order.status !== 'completada') {
                // IT'S A BREACH!
                // 1. Update order status to 'incumplida'
                await supabase.from('service_orders').update({ status: 'incumplida' }).eq('id', item.order_id);
                
                // 2. Broadcast CRITICAL ALERT
                await supabase.from('global_alerts').insert({
                  type: 'critical',
                  order_id: item.order_id,
                  user_id: 'SYSTEM',
                  user_name: 'Antigravity Monitor',
                  message: `🚨 ¡INCUMPLIMIENTO CRÍTICO! La Orden #${item.order_id} (Cliente: ${order.customer_name}) ha vencido sin ser completada. Responsable: ${order.created_by}. Se requiere justificación inmediata.`
                });
              }
            } else {
              // Standard Milestone Broadcast
              await supabase.from('global_alerts').insert({
                type: 'critical',
                order_id: item.order_id,
                user_id: 'SYSTEM',
                user_name: 'Antigravity Broadcast',
                message: `⏰ RECORDATORIO MASIVO: ${item.title}. ${item.message}`
              });
            }
          }
        } catch (e) {
          console.error('[BroadcastWorker] Error:', e);
        }
      };

      const broadcastInterval = setInterval(checkBroadcastQueue, 30000); // 30s (Auditoría: Sincronizado con alarmas locales)
      checkBroadcastQueue(); // Initial check

      return () => { 
        supabase.removeChannel(channel); 
        clearInterval(broadcastInterval);
      };
    } 

    // 2. LOCAL FALLBACK LOGIC
    const checkAlerts = () => {
      const alerts = JSON.parse(localStorage.getItem('mock_global_alerts') || '[]');
      let changed = false;

      alerts.forEach((alert: any) => {
        if (!alert.seenBy.includes(user.id)) {
          showNotification('More Paper & Design - Actualización', alert.message, alert.id);
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
