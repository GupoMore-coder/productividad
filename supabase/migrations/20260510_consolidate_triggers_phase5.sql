-- ############################################################################
-- PHASE 5: CODE QUALITY & ARCHITECTURE IMPROVEMENTS
-- Fecha: 10/05/2026
-- ############################################################################

-- 1. Create consolidated notification trigger function (replacing 3 duplicate versions)
CREATE OR REPLACE FUNCTION public.fn_trigger_push_notification()
RETURNS TRIGGER AS $$
DECLARE
    target_user_id TEXT;
    v_title TEXT;
    v_body TEXT;
    v_url TEXT;
    v_payload JSONB;
    v_responsible_name TEXT;
    v_date TEXT;
BEGIN
    v_date := to_char(NOW() AT TIME ZONE 'America/Bogota', 'DD/MM/YYYY HH12:MI AM');

    IF (TG_TABLE_NAME = 'service_orders') THEN
        SELECT full_name INTO v_responsible_name FROM public.profiles WHERE id = NEW.created_by;
        IF v_responsible_name IS NULL THEN
            v_responsible_name := 'Agente';
        END IF;

        IF (TG_OP = 'INSERT') THEN
            target_user_id := 'broadcast'; 
            v_title := 'Nueva Orden | ' || NEW.customer_name;
            v_body := 'ID: ' || left(NEW.id::text, 6) || ' | Por: ' || v_responsible_name || E'\n' || v_date;
            v_url := '/orders';
        ELSIF (TG_OP = 'UPDATE' AND OLD.status != NEW.status) THEN
            target_user_id := 'broadcast';
            
            IF (NEW.status = 'incumplida') THEN
                v_title := 'ALERTA DE INCUMPLIMIENTO';
            ELSE
                v_title := 'Cambio de Estado: ' || upper(NEW.status);
            END IF;
            
            v_body := 'Orden de ' || NEW.customer_name || ' | Por: ' || v_responsible_name || E'\n' || v_date;
            v_url := '/orders';
        END IF;

    ELSIF (TG_TABLE_NAME = 'group_memberships') THEN
        IF (TG_OP = 'INSERT') THEN
            target_user_id := NEW.user_id::text;
            IF (NEW.status = 'invited') THEN
                v_title := 'Has sido invitado!';
                v_body := 'Te han invitado a un nuevo equipo en Antigravity.';
                v_url := '/family-group';
            ELSIF (NEW.status = 'pending') THEN
                SELECT creator_id::text INTO target_user_id FROM public.groups WHERE id = NEW.group_id;
                v_title := 'Nueva Solicitud';
                v_body := 'Alguien quiere unirse a tu equipo.';
                v_url := '/family-group';
            END IF;
        ELSIF (TG_OP = 'UPDATE' AND OLD.status != NEW.status AND NEW.status = 'approved') THEN
            target_user_id := NEW.user_id::text;
            v_title := 'Acceso Concedido';
            v_body := 'Tu solicitud para unirte al equipo ha sido aprobada.';
            v_url := '/family-group';
        END IF;

    ELSIF (TG_TABLE_NAME = 'tasks') THEN
        IF (TG_OP = 'INSERT') THEN
            target_user_id := NEW.user_id::text; 
            v_title := 'Nueva Tarea Asignada';
            v_body := left(NEW.title, 50);
            v_url := '/tasks';
        END IF;
    END IF;

    IF (target_user_id IS NOT NULL AND v_title IS NOT NULL) THEN
        IF length(v_body) > 150 THEN
            v_body := left(v_body, 147) || '...';
        END IF;

        v_payload := jsonb_build_object(
            'user_id', target_user_id,
            'title', v_title,
            'body', v_body,
            'url', v_url,
            'silent', CASE WHEN v_title LIKE '%ALERTA%' THEN false ELSE true END
        );

        PERFORM net.http_post(
            url := 'https://grsaehpmaihrztusehkb.supabase.co/functions/v1/send-push-notification',
            headers := jsonb_build_object('Content-Type', 'application/json'),
            body := v_payload
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Re-create triggers to use consolidated function
DROP TRIGGER IF EXISTS tr_push_service_orders ON public.service_orders;
DROP TRIGGER IF EXISTS tr_push_group_memberships ON public.group_memberships;
DROP TRIGGER IF EXISTS tr_push_tasks ON public.tasks;

CREATE TRIGGER tr_push_service_orders
    AFTER INSERT OR UPDATE ON public.service_orders
    FOR EACH ROW EXECUTE FUNCTION public.fn_trigger_push_notification();

CREATE TRIGGER tr_push_group_memberships
    AFTER INSERT OR UPDATE ON public.group_memberships
    FOR EACH ROW EXECUTE FUNCTION public.fn_trigger_push_notification();

CREATE TRIGGER tr_push_tasks
    AFTER INSERT ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION public.fn_trigger_push_notification();

-- 3. WhatsApp automation trigger - consolidated
CREATE OR REPLACE FUNCTION public.handle_order_notification_whatsapp()
RETURNS TRIGGER AS $$
DECLARE
  payload jsonb;
  v_supabase_url text;
  v_service_role_key text;
BEGIN
  BEGIN
    SELECT value INTO v_supabase_url FROM public.secrets WHERE name = 'SUPABASE_URL';
    SELECT value INTO v_service_role_key FROM public.secrets WHERE name = 'SERVICE_ROLE_KEY';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Credenciales no disponibles. WhatsApp se omitira.';
    RETURN NEW;
  END;

  IF v_supabase_url IS NULL OR v_service_role_key IS NULL OR v_service_role_key = 'pending-setup-in-dashboard' THEN
    RETURN NEW;
  END IF;

  payload := jsonb_build_object(
    'record', row_to_json(NEW),
    'old_record', CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE NULL END,
    'type', TG_OP
  );

  PERFORM net.http_post(
    url := v_supabase_url || '/functions/v1/whatsapp-automation',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_service_role_key
    ),
    body := payload
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_order_notification_whatsapp ON public.service_orders;

CREATE TRIGGER tr_order_notification_whatsapp
  AFTER INSERT OR UPDATE ON public.service_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_order_notification_whatsapp();

-- 4. Cron job for task reminders
DO $$
BEGIN
    PERFORM cron.schedule('push-alarms-1h', '* * * * *', 'SELECT public.check_upcoming_tasks_and_push()');
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'pg_cron not available: %', SQLERRM;
END $$;

-- 5. Ensure pg_net extension is enabled
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 6. Ensure uuid-ossp extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";