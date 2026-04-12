-- Migration: Notification Triggers for PWA Push
-- Description: Automates sending push notifications via Edge Function upon database events.

-- 1. Enable HTTP Extension (using pg_net as identified in the project)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Create the Trigger Function
CREATE OR REPLACE FUNCTION public.fn_trigger_push_notification()
RETURNS TRIGGER AS $$
DECLARE
    target_user_id UUID;
    v_title TEXT;
    v_body TEXT;
    v_url TEXT;
    v_payload JSONB;
BEGIN
    -- Determine common values based on table
    IF (TG_TABLE_NAME = 'group_memberships') THEN
        IF (TG_OP = 'INSERT') THEN
            target_user_id := NEW.user_id;
            IF (NEW.status = 'invited') THEN
                v_title := '¡Has sido invitado!';
                v_body := 'Te han invitado a un nuevo equipo en Antigravity.';
                v_url := '/family-group';
            ELSIF (NEW.status = 'pending') THEN
                -- Notify the creator of the group
                SELECT creator_id INTO target_user_id FROM public.groups WHERE id = NEW.group_id;
                v_title := 'Nueva Solicitud';
                v_body := 'Alguien quiere unirse a tu equipo.';
                v_url := '/family-group';
            END IF;
        ELSIF (TG_OP = 'UPDATE' AND OLD.status != NEW.status AND NEW.status = 'approved') THEN
            target_user_id := NEW.user_id;
            v_title := 'Acceso Concedido';
            v_body := 'Tu solicitud para unirte al equipo ha sido aprobada.';
            v_url := '/family-group';
        END IF;

    ELSIF (TG_TABLE_NAME = 'service_orders') THEN
        IF (TG_OP = 'INSERT') THEN
            -- Notify the assigned responsible person (if we have their ID)
            target_user_id := NEW.created_by; 
            v_title := 'Nueva Orden Creada';
            v_body := 'Se ha registrado la orden para ' || NEW.customer_name;
            v_url := '/orders';
        ELSIF (TG_OP = 'UPDATE' AND OLD.status != NEW.status) THEN
            target_user_id := NEW.created_by;
            v_title := 'Actualización de Orden';
            v_body := 'La orden ' || NEW.id || ' ahora está en estado ' || NEW.status;
            v_url := '/orders';
        END IF;

    ELSIF (TG_TABLE_NAME = 'tasks') THEN
        IF (TG_OP = 'INSERT') THEN
            target_user_id := NEW.user_id; 
            v_title := 'Nueva Tarea Asignada';
            v_body := NEW.title;
            v_url := '/tasks';
        END IF;
    END IF;

    -- Send request to Edge Function if target user and content exists
    IF (target_user_id IS NOT NULL AND v_title IS NOT NULL) THEN
        v_payload := jsonb_build_object(
            'user_id', target_user_id,
            'title', v_title,
            'body', v_body,
            'url', v_url
        );

        -- Use pg_net to call the edge function (Asynchronous)
        -- Project Ref: grsaehpmaihrztusehkb
        PERFORM net.http_post(
            url := 'https://grsaehpmaihrztusehkb.supabase.co/functions/v1/send-push-notification',
            headers := jsonb_build_object(
                'Content-Type', 'application/json'
                -- The Edge Function should use its own Auth or verify the request
            ),
            body := v_payload
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create Triggers
DROP TRIGGER IF EXISTS tr_push_group_memberships ON public.group_memberships;
CREATE TRIGGER tr_push_group_memberships
    AFTER INSERT OR UPDATE ON public.group_memberships
    FOR EACH ROW EXECUTE FUNCTION public.fn_trigger_push_notification();

DROP TRIGGER IF EXISTS tr_push_service_orders ON public.service_orders;
CREATE TRIGGER tr_push_service_orders
    AFTER INSERT OR UPDATE ON public.service_orders
    FOR EACH ROW EXECUTE FUNCTION public.fn_trigger_push_notification();
