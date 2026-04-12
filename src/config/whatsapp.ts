export const WHATSAPP_CONFIG = {
  // SE SEGURIDAD: Las claves se han movido a Supabase Secrets para la automatización.
  // Para uso en el frontend (manual), asegúrate de configurarlas en tu .env o Vercel.
  ACCESS_TOKEN: import.meta.env.VITE_WHATSAPP_ACCESS_TOKEN || '',
  PHONE_NUMBER_ID: import.meta.env.VITE_WHATSAPP_PHONE_NUMBER_ID || '',
  WABA_ID: import.meta.env.VITE_WHATSAPP_WABA_ID || '',
  VERSION: 'v21.0'
};
