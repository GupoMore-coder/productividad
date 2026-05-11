// ⚠️  SEGURIDAD: Los tokens de WhatsApp API se configuran como Secrets en Supabase Edge Functions.
// Este archivo contiene configuraciones para envío manual desde el frontend.
// El método PREFERIDO es vía Edge Function (whatsapp-automation) que no expone tokens al cliente.

export const WHATSAPP_CONFIG = {
  VERSION: 'v21.0',
  ACCESS_TOKEN: import.meta.env.VITE_WHATSAPP_ACCESS_TOKEN || '',
  PHONE_NUMBER_ID: import.meta.env.VITE_WHATSAPP_PHONE_NUMBER_ID || '',
};

// ⚠️  Los tokens en VITE_* se exponen al frontend.
//      Para producción, configurar como Secrets en Supabase Edge Functions.
