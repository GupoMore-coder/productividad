-- ############################################################################
-- MIGRACIÓN DE LIMPIEZA DE BACKEND PARA WHATSAPP CLOUD API / META WEBHOOKS
-- FECHA: 01/08/2026
-- OBJETIVO: Dar de baja tokens y caché de Phone Number ID en base de datos
-- ############################################################################

-- 1. Función para limpiar tokens y caché de WhatsApp en public.secrets
CREATE OR REPLACE FUNCTION public.deregister_whatsapp_backend()
RETURNS void AS $$
BEGIN
  DELETE FROM public.secrets
  WHERE name IN (
    'WHATSAPP_ACCESS_TOKEN',
    'WHATSAPP_PERMANENT_TOKEN',
    'SYSTEM_USER_TOKEN',
    'META_SYSTEM_USER_TOKEN',
    'WHATSAPP_PHONE_NUMBER_ID',
    'WHATSAPP_WABA_ID'
  );
  
  RAISE NOTICE 'Limpieza de tokens y Phone Number ID de WhatsApp completada en public.secrets';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.deregister_whatsapp_backend IS 'Elimina los tokens de usuario de sistema y el Phone Number ID de Meta WhatsApp para evitar peticiones HTTP 400/401 fallidas.';

-- 2. Ejecutar la función para asegurar la limpieza en la base de datos
SELECT public.deregister_whatsapp_backend();
