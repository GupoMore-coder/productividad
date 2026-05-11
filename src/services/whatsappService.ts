const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export interface WhatsAppMessageData {
  customerName: string;
  documentNumber: string;
  total: number;
  type: 'cotizacion' | 'orden';
  deliveryDate?: string;
}

export class WhatsAppService {
  private static async callEdgeFunction(functionName: string, body: object) {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ANON_KEY}`,
      },
      body: JSON.stringify(body),
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error?.message || 'Error en Edge Function');
    return result;
  }

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
   * Envía una notificación oficial vía Edge Function (no expone tokens al cliente).
   */
  static async sendOfficialNotification(
    phone: string, 
    templateName: string, 
    parameters: string[] = [],
    orderId?: string
  ) {
    const cleanPhone = phone.replace(/\D/g, '');

    try {
      const result = await this.callEdgeFunction('whatsapp-send-message', {
        phone: cleanPhone,
        templateName,
        parameters,
        orderId,
      });

      return result;
    } catch (error) {
      console.error('WhatsApp Service Error:', error);
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

