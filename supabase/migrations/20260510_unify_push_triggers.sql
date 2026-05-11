-- ############################################################################
-- UNIFICAR VERSIONES DUPLICADAS DE fn_trigger_push_notification
-- ############################################################################
-- Había 3 versiones diferentes de esta función:
--   1. 20260408_notification_triggers.sql (versión original con net.http_post)
--   2. 20260414_broadcast_cron_engine.sql (versión broadcast con net.http_post)
--   3. 20260415_fix_trigger_profile_name.sql (versión con INSERT a push_notifications)
-- 
-- Esta migración las unifica en UNA sola función y elimina las redundancias.

-- 1. Eliminar triggers existentes que apuntan a cualquiera de las versiones
DROP TRIGGER IF EXISTS tr_push_service_orders ON public.service_orders;
DROP TRIGGER IF EXISTS tr_push_group_memberships ON public.group_memberships;
DROP TRIGGER IF EXISTS tr_push_tasks ON public.tasks;

-- 2. Crear la función unificada
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

-- 3. Crear triggers unificados
CREATE TRIGGER tr_push_service_orders
    AFTER INSERT OR UPDATE ON public.service_orders
    FOR EACH ROW EXECUTE FUNCTION public.fn_trigger_push_notification();

CREATE TRIGGER tr_push_group_memberships
    AFTER INSERT OR UPDATE ON public.group_memberships
    FOR EACH ROW EXECUTE FUNCTION public.fn_trigger_push_notification();

CREATE TRIGGER tr_push_tasks
    AFTER INSERT OR UPDATE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION public.fn_trigger_push_notification();

COMMENT ON FUNCTION public.fn_trigger_push_notification IS 'Unificada: Dispara notificaciones push para service_orders, group_memberships y tasks vía Edge Function.';
