import { WHATSAPP_CONFIG } from '../config/whatsapp';

export interface WhatsAppMessageData {
  customerName: string;
  documentNumber: string;
  total: number;
  type: 'cotizacion' | 'orden';
  deliveryDate?: string;
}

export class WhatsAppService {
  /**
   * Genera un enlace de WhatsApp Directo (wa.me) con un mensaje pre-formateado.
   * Útil como respaldo mientras se aprueban las plantillas oficiales de Meta.
   */
  static getDirectLink(phone: string, data: WhatsAppMessageData): string {
    const cleanPhone = phone.replace(/\D/g, '');
    const message = data.type === 'cotizacion' 
      ? `Hola *${data.customerName}*, un gusto saludarte de *More Paper & Design* ✨.\n\nAdjunto tu *Cotización ${data.documentNumber}* por un valor total de *$${data.total.toLocaleString()}*.\n\n¿Deseas confirmar este pedido para iniciar producción?`
      : `Hola *${data.customerName}*, te saluda *More Paper & Design* ✨.\n\nTe confirmo que tu pedido *${data.documentNumber}* ha sido registrado exitosamente 👌.\n\n💰 *Total:* $${data.total.toLocaleString()}\n📅 *Entrega:* ${data.deliveryDate || 'Pronto'}\n\n¡Gracias por confiar en nosotros!`;

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  }

  /**
   * Envía una notificación oficial utilizando la API de Meta Graph.
   * Requiere que el número del cliente esté registrado para recibir mensajes de prueba en Meta Developers
   * o que la App esté en modo Producción.
   */
  static async sendOfficialNotification(phone: string, templateName: string, components: any[]) {
    const cleanPhone = phone.replace(/\D/g, '');
    const url = `https://graph.facebook.com/${WHATSAPP_CONFIG.VERSION}/${WHATSAPP_CONFIG.PHONE_NUMBER_ID}/messages`;

    const body = {
      messaging_product: 'whatsapp',
      to: cleanPhone,
      type: 'template',
      template: {
        name: templateName,
        language: {
          code: 'es'
        },
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
      return result;
    } catch (error) {
      console.error('WhatsApp API Error:', error);
      throw error;
    }
  }

  /**
   * Envía el mensaje de prueba "hello_world" de Meta.
   */
  static async sendTestMessage(phone: string) {
    return this.sendOfficialNotification(phone, 'hello_world', []);
  }
}
