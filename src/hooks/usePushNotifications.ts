import { useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

/**
 * Hook to automate PWA native push notification subscriptions.
 * It checks for permissions, prompts the user, and upserts the
 * subscription to the Supabase push_subscriptions table.
 */
export function usePushNotifications() {
  const { user } = useAuth();

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const subscribeUser = useCallback(async () => {
    console.log('🔄 [Push] Iniciando proceso de suscripción... User:', user?.id);
    
    if (!('serviceWorker' in navigator)) {
      console.warn('❌ [Push] ServiceWorker no está soportado en este navegador.');
      return;
    }
    if (!('PushManager' in window)) {
      console.warn('❌ [Push] PushManager no está soportado en este navegador.');
      return;
    }
    if (!isSupabaseConfigured || !user?.id || user?.isBypass) {
      console.warn('❌ [Push] Faltan credenciales, no hay usuario, o es modo Bypass (sin Auth real).');
      return;
    }

    const syncSubscriptionToDb = async (subscription: PushSubscription) => {
      if (!user?.id) return;
      console.log('🔄 [Push] Sincronizando con base de datos...');
      
      const subscriptionData = subscription.toJSON();
      
      try {
        const deviceId = navigator.userAgent.substring(0, 100);

        const { data: existing } = await supabase
          .from('push_subscriptions')
          .select('id')
          .eq('user_id', user.id)
          .eq('device_id', deviceId)
          .maybeSingle();

        if (existing) {
          const { error } = await supabase
            .from('push_subscriptions')
            .update({
              subscription: subscriptionData,
              updated_at: new Date().toISOString()
            })
            .eq('id', existing.id);
          if (error) throw error;
          console.log('✅ [Push] DB: Suscripción actualizada correctamente (Update).');
        } else {
          const { error: insertError } = await supabase
            .from('push_subscriptions')
            .insert({
              user_id: user.id,
              subscription: subscriptionData,
              device_id: deviceId
            });
          if (insertError) throw insertError;
          console.log('✅ [Push] DB: Suscripción nueva guardada correctamente (Insert).');
        }
      } catch (dbErr: any) {
        console.error('❌ [Push] Error al sincronizar con BD:', dbErr.message);
      }
    };

    try {
      console.log('⏳ [Push] Verificando Service Worker...');
      // Use getRegistration to avoid hanging infinitely if SW is not ready
      const registration = await navigator.serviceWorker.getRegistration();
      
      if (!registration) {
        console.warn('❌ [Push] No se encontró Service Worker registrado.');
        return;
      }
      
      console.log('✅ [Push] Service Worker encontrado.');

      const existingSub = await registration.pushManager.getSubscription();
      if (existingSub) {
        console.log('✅ [Push] Ya existe una suscripción previa en el navegador.');
        await syncSubscriptionToDb(existingSub);
        return;
      }

      console.log('⏳ [Push] Solicitando nueva suscripción al navegador...');
      const publicVapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || 'BEEJYZHe9vtvzXj6Jl1+/FC5gC/X6zlh8vz7bmIoWyW8/zfBEY2tDOIQTv4auPLyYSjwoKSnoa4XgzKRFqXMPjjA==';
      const convertedKey = urlBase64ToUint8Array(publicVapidKey);
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedKey,
      });

      console.log('✅ [Push] Permiso concedido. Dispositivo suscrito con éxito.');
      await syncSubscriptionToDb(subscription);

    } catch (err) {
      console.error('❌ [Push] Error general registrando suscripción:', err);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      if (typeof Notification !== 'undefined' && (Notification.permission === 'default' || Notification.permission === 'granted')) {
        subscribeUser();
      } else {
        console.warn('⚠️ [Push] Permiso de notificaciones fue denegado por el usuario.');
      }
    }
  }, [user?.id, subscribeUser]);

  return { subscribeUser };
}
