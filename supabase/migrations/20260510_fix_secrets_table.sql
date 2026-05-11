-- ############################################################################
-- FIX CRÍTICO: Crear tabla secrets y corregir funciones dependientes
-- FECHA: 10/05/2026
-- ############################################################################

-- 1. Crear la tabla secrets (la tabla faltante que causa el error crítico)
CREATE TABLE IF NOT EXISTS public.secrets (
  name TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Insertar valores por defecto (el service_role se configura desde Supabase Dashboard)
INSERT INTO public.secrets (name, value) VALUES
  ('SERVICE_ROLE_KEY', 'pending-setup-in-dashboard'),
  ('SUPABASE_URL', 'https://grsaehpmaihrztusehkb.supabase.co')
ON CONFLICT (name) DO NOTHING;

-- 2. Corregir la función handle_new_order_whatsapp para usar variables de entorno primero
CREATE OR REPLACE FUNCTION public.handle_new_order_whatsapp()
RETURNS TRIGGER AS $$
DECLARE
  service_role_key text;
BEGIN
  BEGIN
    SELECT value INTO service_role_key FROM public.secrets WHERE name = 'SERVICE_ROLE_KEY';
  EXCEPTION WHEN OTHERS THEN
    RETURN NEW;
  END;

  IF service_role_key IS NULL OR service_role_key = 'pending-setup-in-dashboard' THEN
    RETURN NEW;
  END IF;

  PERFORM
    net.http_post(
      url := 'https://grsaehpmaihrztusehkb.functions.supabase.co/whatsapp-automation',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_role_key
      ),
      body := jsonb_build_object(
        'record', row_to_json(NEW),
        'type', 'INSERT'
      )
    );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Corregir la función handle_order_notification_whatsapp
CREATE OR REPLACE FUNCTION public.handle_order_notification_whatsapp()
RETURNS TRIGGER AS $$
DECLARE
  payload jsonb;
  supabase_url text;
  service_role_key text;
BEGIN
  BEGIN
    SELECT value INTO supabase_url FROM public.secrets WHERE name = 'SUPABASE_URL';
    SELECT value INTO service_role_key FROM public.secrets WHERE name = 'SERVICE_ROLE_KEY';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'No se pudo obtener credenciales de la tabla secrets. El envío de WhatsApp se omitirá.';
    RETURN NEW;
  END;

  IF supabase_url IS NULL OR service_role_key IS NULL OR service_role_key = 'pending-setup-in-dashboard' THEN
    RETURN NEW;
  END IF;

  payload := jsonb_build_object(
    'record', row_to_json(NEW),
    'old_record', CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE NULL END,
    'type', TG_OP
  );

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

-- 4. Asegurar que SOLO el trigger correcto esté activo
DROP TRIGGER IF EXISTS on_order_created_whatsapp ON public.service_orders;
DROP TRIGGER IF EXISTS tr_order_notification_whatsapp ON public.service_orders;

CREATE TRIGGER tr_order_notification_whatsapp
  AFTER INSERT OR UPDATE ON public.service_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_order_notification_whatsapp();

COMMENT ON TABLE public.secrets IS 'Almacén seguro de claves para Edge Functions y automatizaciones.';
COMMENT ON FUNCTION public.handle_order_notification_whatsapp IS 'Dispara la Edge Function de WhatsApp para notificaciones automáticas a clientes y equipo administrativo.';

-- 5. Crear tablas faltantes referenciadas en el código

-- 5.1 Tabla whatsapp_messages
CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id TEXT,
  customer_phone TEXT NOT NULL,
  message_text TEXT,
  direction TEXT NOT NULL DEFAULT 'inbound',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5.2 Tabla approval_requests
CREATE TABLE IF NOT EXISTS public.approval_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL,
  source_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  requested_by UUID,
  requested_by_name TEXT,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5.3 Tabla push_notifications
CREATE TABLE IF NOT EXISTS public.push_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT,
  request_type TEXT NOT NULL DEFAULT 'SEND_MESSAGE',
  payload JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5.4 Tabla global_broadcast_queue
CREATE TABLE IF NOT EXISTS public.global_broadcast_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fire_at TIMESTAMP WITH TIME ZONE NOT NULL,
  title TEXT,
  message TEXT,
  order_id TEXT,
  type TEXT DEFAULT 'milestone',
  broadcasted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5.5 Tabla config_service_types
CREATE TABLE IF NOT EXISTS public.config_service_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5.6 Tabla config_team_members
CREATE TABLE IF NOT EXISTS public.config_team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. RLS básico para tablas nuevas
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_broadcast_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated full access whatsapp_messages"
  ON public.whatsapp_messages FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated full access approval_requests"
  ON public.approval_requests FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated full access push_notifications"
  ON public.push_notifications FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated full access global_broadcast_queue"
  ON public.global_broadcast_queue FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 7. Garantizar extensión uuid-ossp
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
