import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { scheduleLocalNotification } from '../services/NotificationsService';

export default function RealtimeNotificationListener() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;

    // Listen for NEW Service Orders
    const ordersChannel = supabase
      .channel('public:service_orders')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'service_orders' },
        (payload) => {
          if (payload.new.created_by !== user.id) {
            handleNewEvent({
              type: 'order',
              title: 'Nueva Orden de Servicio',
              body: `Cliente: ${payload.new.customer_name} · Orden No. ${payload.new.id}`,
              id: payload.new.id,
              navigateUrl: '/orders'
            });
          }
        }
      )
      .subscribe();

    // Listen for NEW Tasks (Shared)
    const tasksChannel = supabase
      .channel('public:tasks')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'tasks' },
        (payload) => {
          // Notify if it's a shared task and I didn't create it
          if (payload.new.is_shared && payload.new.created_by !== user.id) {
            handleNewEvent({
              type: 'task',
              title: 'Nueva Tarea de Equipo',
              body: payload.new.title,
              id: payload.new.id,
              navigateUrl: '/'
            });
          }
        }
      )
      .subscribe();

    // Listen for SYSTEM ALERTS (Expulsions, etc)
    const alertsChannel = supabase
      .channel('public:realtime_notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'realtime_notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          handleNewEvent({
            type: payload.new.type || 'alert',
            title: payload.new.title || 'Notificación del Sistema',
            body: payload.new.message,
            id: payload.new.id,
            navigateUrl: payload.new.type === 'group_expulsion' ? '/group' : '/'
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(tasksChannel);
      supabase.removeChannel(alertsChannel);
    };
  }, [user?.id]);

  const handleNewEvent = (event: any) => {
    // Push Native OS Notification
    scheduleLocalNotification(event.title, {
       body: event.body,
       tag: event.id
    });

    // Fire Full-Screen In-App Unified Modal Alarm
    window.dispatchEvent(new CustomEvent('app:show-unified-alarm', { detail: event }));
  };

  // No longer returns UI popup since UnifiedAlarmModal handles all in-app visual queues.
  return null;
}
