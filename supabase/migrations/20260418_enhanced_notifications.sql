-- 20260418_enhanced_notifications.sql
-- Actualiza y expande la automatización de WhatsApp y Notificaciones Push

-- 1. Actualizar la función de manejo de WhatsApp para soportar UPDATES y corregir URL
CREATE OR REPLACE FUNCTION public.handle_order_notification_whatsapp()
RETURNS TRIGGER AS $$
DECLARE
  payload jsonb;
  supabase_url text;
  service_role_key text;
BEGIN
  -- Obtener secretos de la tabla (si existe) o usar placeholders si se manejan vía Supabase Dashboard
  -- NOTA: El SERVICE_ROLE_KEY es necesario para que la Edge Function pueda consultar la tabla 'profiles'
  SELECT value INTO supabase_url FROM secrets WHERE name = 'SUPABASE_URL';
  SELECT value INTO service_role_key FROM secrets WHERE name = 'SERVICE_ROLE_KEY';

  payload := jsonb_build_object(
    'record', row_to_json(NEW),
    'old_record', CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE NULL END,
    'type', TG_OP
  );

  -- Realizar la llamada a la Edge Function
  -- Usamos el formato de URL estándar /functions/v1/
  PERFORM
    net.http_post(
      url := supabase_url || '/functions/v1/whatsapp-automation',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_role_key
      ),
      body := payload
    );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Re-configurar el Trigger para WhatsApp (Fuego en INSERT y UPDATE)
DROP TRIGGER IF EXISTS on_order_created_whatsapp ON public.service_orders;

CREATE TRIGGER tr_order_notification_whatsapp
  AFTER INSERT OR UPDATE ON public.service_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_order_notification_whatsapp();

-- 3. Asegurar que el trigger de PWA Push también sea robusto
-- El trigger tr_push_service_orders ya existe en 20260414_broadcast_cron_engine.sql
-- pero nos aseguraremos de que apunte a la nueva estructura si es necesario.
-- Por ahora lo dejamos igual ya que ese trigger maneja su propia lógica de broadcast.

COMMENT ON FUNCTION public.handle_order_notification_whatsapp IS 'Dispara la Edge Function de WhatsApp para notificaciones automáticas a clientes y equipo administrativo.';
