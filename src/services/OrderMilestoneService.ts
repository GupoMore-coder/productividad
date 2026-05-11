import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { parseISO, subHours } from 'date-fns';

const MILESTONE_HOURS = [24, 12, 6] as const;

export class OrderMilestoneService {
  static async scheduleDeliveryMilestones(orderId: string, deliveryDate: string, isTest?: boolean) {
    if (!isSupabaseConfigured || isTest) return;

    const delivery = parseISO(deliveryDate);
    if (delivery <= new Date()) return;

    for (const h of MILESTONE_HOURS) {
      const fireAt = subHours(delivery, h);
      if (fireAt > new Date()) {
        await supabase.from('global_broadcast_queue').insert({
          fire_at: fireAt.toISOString(),
          title: `Recordatorio de Entrega - ${h} HORAS`,
          message: `La Orden #${orderId} vence en ${h} horas. Favor verificar el estado del servicio.`,
          order_id: orderId,
          type: 'milestone'
        });
      }
    }

    await supabase.from('global_broadcast_queue').insert({
      fire_at: delivery.toISOString(),
      title: 'VERIFICACIÓN DE INCUMPLIMIENTO',
      message: `Verificando estado final de Orden #${orderId}`,
      order_id: orderId,
      type: 'breach_check'
    });
  }

  static async scheduleQuoteExpiration(orderId: string, quoteExpiresAt: string, isTest?: boolean) {
    if (!isSupabaseConfigured || isTest) return;

    const expiration = parseISO(quoteExpiresAt);
    await supabase.from('global_broadcast_queue').insert({
      fire_at: expiration.toISOString(),
      title: 'Vencimiento de Cotización',
      message: `Hoy vence la Cotización #${orderId}. Accede al documento para renovar o contactar al cliente.`,
      order_id: orderId,
      type: 'expiration'
    });
  }

  static async rescheduleOnDateChange(orderId: string, newDeliveryDate: string) {
    if (!isSupabaseConfigured) return;

    await supabase.from('global_broadcast_queue').delete().eq('order_id', orderId);
    await this.scheduleDeliveryMilestones(orderId, newDeliveryDate, false);
  }

  static async insertHistoryEntry(orderId: string, type: string, userName: string, description: string) {
    if (!isSupabaseConfigured) return;
    await supabase.from('order_history').insert({
      order_id: orderId,
      type,
      user_name: userName,
      description
    });
  }

  static async insertGlobalAlert(
    type: string,
    orderId: string,
    userId: string | undefined,
    userName: string,
    message: string
  ) {
    if (!isSupabaseConfigured) return;
    await supabase.from('global_alerts').insert({
      type,
      order_id: orderId,
      user_id: userId || 'SYSTEM',
      user_name: userName,
      message
    });
  }
}
