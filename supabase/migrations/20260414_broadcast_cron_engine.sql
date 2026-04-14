-- Migration: Broadcast Notifications & pg_cron Task Scheduler
-- Description: Overhauls the push notification engine to broadcast order events across all devices 
--              and sets up an automated every-minute checking service for Task alarms.

-- 1. Enable CRON
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Modify existing fn_trigger_push_notification to perform Broadcast with rich text
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
    -- Determinar zona horaria
    v_date := to_char(NOW() AT TIME ZONE 'America/Bogota', 'DD/MM/YYYY HH12:MI AM');

    IF (TG_TABLE_NAME = 'service_orders') THEN
        -- Obtener nombre del creador real si es posible, o dejar generico
        SELECT name INTO v_responsible_name FROM public.users WHERE id = NEW.created_by;
        IF v_responsible_name IS NULL THEN
            v_responsible_name := 'Agente';
        END IF;

        IF (TG_OP = 'INSERT') THEN
            target_user_id := 'broadcast'; 
            v_title := '📝 Nueva Orden | ' || NEW.customer_name;
            v_body := 'ID: ' || left(NEW.id::text, 6) || ' | Por: ' || v_responsible_name || E'\n' || v_date;
            v_url := '/orders';
        ELSIF (TG_OP = 'UPDATE' AND OLD.status != NEW.status) THEN
            target_user_id := 'broadcast';
            
            IF (NEW.status = 'incumplida') THEN
                v_title := '⚠️ ALERTA DE INCUMPLIMIENTO ⚠️';
            ELSE
                v_title := '🔄 Cambio de Estado: ' || upper(NEW.status);
            END IF;
            
            v_body := 'Orden de ' || NEW.customer_name || ' | Por: ' || v_responsible_name || E'\n' || v_date;
            v_url := '/orders';
        END IF;

    ELSIF (TG_TABLE_NAME = 'group_memberships') THEN
        -- Leave original logic for Group memberships intact
        IF (TG_OP = 'INSERT') THEN
            target_user_id := NEW.user_id::text;
            IF (NEW.status = 'invited') THEN
                v_title := '¡Has sido invitado!';
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
            v_body := NEW.title;
            v_url := '/tasks';
        END IF;
    END IF;

    -- HTTP Request via pg_net
    IF (target_user_id IS NOT NULL AND v_title IS NOT NULL) THEN
        v_payload := jsonb_build_object(
            'user_id', target_user_id,
            'title', v_title,
            'body', v_body,
            'url', v_url,
            -- Add silent/isMuted flags logic based on breach vs standard so SW catches it
            'silent', CASE WHEN v_title LIKE '%ALERTA%' THEN false ELSE true END
        );

        PERFORM net.http_post(
            url := 'https://grsaehpmaihrztusehkb.supabase.co/functions/v1/send-push-notification',
            headers := jsonb_build_object(
                'Content-Type', 'application/json'
            ),
            body := v_payload
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger logically to ensure schema safety
DROP TRIGGER IF EXISTS tr_push_service_orders ON public.service_orders;
CREATE TRIGGER tr_push_service_orders
    AFTER INSERT OR UPDATE ON public.service_orders
    FOR EACH ROW EXECUTE FUNCTION public.fn_trigger_push_notification();


-- 3. Setup CRON function for Task 1-hour alarms
-- Add column internally to track if notification was sent
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS push_1h_sent BOOLEAN DEFAULT FALSE;

CREATE OR REPLACE FUNCTION public.check_upcoming_tasks_and_push() RETURNS VOID AS $$
DECLARE
    r RECORD;
    v_payload JSONB;
BEGIN
    FOR r IN 
        SELECT id, title, user_id, schedule_datetime 
        FROM public.tasks 
        WHERE push_1h_sent = FALSE 
          AND schedule_datetime IS NOT NULL 
          AND schedule_datetime <= (NOW() + INTERVAL '60 minutes')
          AND schedule_datetime > (NOW() - INTERVAL '10 minutes') -- dont fire for very old missed tasks
          AND user_id IS NOT NULL
    LOOP
        v_payload := jsonb_build_object(
            'user_id', r.user_id::text,
            'title', '⏰ Recordatorio de Agenda -1H',
            'body', 'Tu compromiso está programado: ' || r.title,
            'url', '/tasks',
            'silent', false -- Wake device, vibrate
        );

        PERFORM net.http_post(
            url := 'https://grsaehpmaihrztusehkb.supabase.co/functions/v1/send-push-notification',
            headers := jsonb_build_object('Content-Type', 'application/json'),
            body := v_payload
        );

        UPDATE public.tasks SET push_1h_sent = TRUE WHERE id = r.id;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create the CRON Job (runs every 1 minute)
-- Note: You may need to run this under `postgres` role directly if pg_cron blocks
DO $$
BEGIN
    PERFORM cron.schedule('push-alarms-1h', '* * * * *', 'SELECT public.check_upcoming_tasks_and_push()');
EXCEPTION WHEN OTHERS THEN
    -- If pg_cron isn't loaded properly, ignore failure gracefully
    RAISE NOTICE 'pg_cron check failed %', SQLERRM;
END $$;
