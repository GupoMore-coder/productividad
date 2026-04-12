-- ########################################################
-- AUTOMATIZACIÓN DE WHATSAPP BUSINESS API (TRIGGER)
-- ########################################################

-- 1. Función para invocar la Edge Function de WhatsApp
CREATE OR REPLACE FUNCTION public.handle_new_order_whatsapp()
RETURNS TRIGGER AS $$
BEGIN
  -- Invocar la Edge Function 'whatsapp-automation'
  -- Reemplaza 'URL_DE_TU_PROYECTO' por la URL real si haces el deploy manual, 
  -- pero Supabase permite usar net.http_post dentro de la red.
  
  PERFORM
    net.http_post(
      url := 'https://grsaehpmaihrztusehkb.functions.supabase.co/whatsapp-automation',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (SELECT value FROM secrets WHERE name = 'SERVICE_ROLE_KEY') -- Opcional según config
      ),
      body := jsonb_build_object(
        'record', row_to_json(NEW),
        'type', 'INSERT'
      )
    );
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Trigger para disparo automático en INSERT
DROP TRIGGER IF EXISTS on_order_created_whatsapp ON public.service_orders;
CREATE TRIGGER on_order_created_whatsapp
  AFTER INSERT ON public.service_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_order_whatsapp();

-- 💡 NOTA: Asegúrate de tener habilitada la extensión 'pg_net' en Supabase:
-- CREATE EXTENSION IF NOT EXISTS pg_net;
