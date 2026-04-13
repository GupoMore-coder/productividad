import { WHATSAPP_CONFIG } from '../config/whatsapp';
import { supabase } from '../lib/supabase';

export interface WhatsAppMessageData {
  customerName: string;
  documentNumber: string;
  total: number;
  type: 'cotizacion' | 'orden';
  deliveryDate?: string;
}

export class WhatsAppService {
  /**
   * Genera un enlace de WhatsApp Directo (wa.me) como respaldo.
   */
  static getDirectLink(phone: string, data: WhatsAppMessageData): string {
    const cleanPhone = phone.replace(/\D/g, '');
    const message = data.type === 'cotizacion' 
      ? `Hola *${data.customerName}*, un gusto saludarte de *More Paper & Design* ✨.\n\nAdjunto tu *Cotización ${data.documentNumber}* por un valor total de *$${data.total.toLocaleString()}*.\n\n¿Deseas confirmar este pedido para iniciar producción?`
      : `Hola *${data.customerName}*, te saluda *More Paper & Design* ✨.\n\nTe confirmo que tu pedido *${data.documentNumber}* ha sido registrado exitosamente 👌.\n\n💰 *Total:* $${data.total.toLocaleString()}\n📅 *Entrega:* ${data.deliveryDate || 'Pronto'}\n\n¡Gracias por confiar en nosotros!`;

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  }

  /**
   * Envía una notificación oficial utilizando la API de Meta Graph con parámetros dinámicos.
   */
  static async sendOfficialNotification(
    phone: string, 
    templateName: string, 
    parameters: string[] = [],
    orderId?: string
  ) {
    const cleanPhone = phone.replace(/\D/g, '');
    const url = `https://graph.facebook.com/${WHATSAPP_CONFIG.VERSION}/${WHATSAPP_CONFIG.PHONE_NUMBER_ID}/messages`;

    const components = [
      {
        type: 'body',
        parameters: parameters.map(value => ({
          type: 'text',
          text: value
        }))
      }
    ];

    const body = {
      messaging_product: 'whatsapp',
      to: cleanPhone,
      type: 'template',
      template: {
        name: templateName,
        language: { code: 'es' },
        components
      }
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WHATSAPP_CONFIG.ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message || 'Error al enviar mensaje');

      // Registro automático en el historial de Supabase para visibilidad de chat
      if (orderId) {
        try {
          await supabase.from('whatsapp_messages').insert({
            order_id: orderId,
            customer_phone: cleanPhone,
            message_text: `🔔 Plantilla Envida: ${templateName}\n📄 Params: ${parameters.join(' | ')}`,
            direction: 'outbound',
            metadata: { 
              meta_message_id: result.messages?.[0]?.id,
              template: templateName,
              params: parameters
            }
          });
        } catch (dbError) {
          console.error('Error al guardar en historial WhatsApp:', dbError);
        }
      }

      return result;
    } catch (error) {
      console.error('WhatsApp API Error:', error);
      throw error;
    }
  }

  /**
   * Envía la notificación de Nueva Orden (Plantilla: nueva_orden_servicio)
   */
  static async sendOrderNotification(phone: string, name: string, orderId: string, total: string) {
    return this.sendOfficialNotification(phone, 'nueva_orden_servicio', [name, orderId, total], orderId);
  }

  /**
   * Envía la notificación de Cotización (Plantilla: cotizacion_generada)
   */
  static async sendQuoteNotification(phone: string, name: string, quoteId: string, total: string) {
    return this.sendOfficialNotification(phone, 'cotizacion_generada', [name, quoteId, total], quoteId);
  }

  /**
   * Envía el mensaje de prueba "hello_world" de Meta.
   */
  static async sendTestMessage(phone: string) {
    return this.sendOfficialNotification(phone, 'hello_world');
  }
}

