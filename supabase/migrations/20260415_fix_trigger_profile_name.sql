-- Corrección: El campo correcto en public.profiles es "full_name" o "username", no "name"

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
        -- Obtener nombre del creador real si es posible, o dejar generico. Se arregla columna a full_name
        SELECT full_name INTO v_responsible_name FROM public.profiles WHERE id = NEW.created_by;
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
        ELSIF (TG_OP = 'UPDATE' AND OLD.status != NEW.status) THEN
            target_user_id := NEW.user_id::text;
            IF (NEW.status = 'approved') THEN
                v_title := '¡Solicitud Aprobada!';
                v_body := 'Ahora eres miembro del equipo.';
                v_url := '/family-group';
            ELSIF (NEW.status = 'rejected') THEN
                v_title := 'Solicitud Rechazada';
                v_body := 'Tu solicitud para unirte al equipo fue rechazada.';
                v_url := '/family-group';
            END IF;
        END IF;

    ELSIF (TG_TABLE_NAME = 'tasks') THEN
        IF (TG_OP = 'INSERT') THEN
            target_user_id := NEW.user_id::text;
            v_title := '📋 Nueva Tarea Asignada';
            v_body := left(NEW.title, 50) || '...';
            v_url := '/tasks';
        END IF;
    END IF;

    -- Si tenemos un evento valido, enviar la notificacion push (insert en push_notifications)
    IF target_user_id IS NOT NULL THEN
        -- Ensure 'body' length limit
        IF length(v_body) > 150 THEN
            v_body := left(v_body, 147) || '...';
        END IF;

        v_payload := jsonb_build_object(
            'title', v_title,
            'body', v_body,
            'url', v_url
        );

        INSERT INTO public.push_notifications (
            user_id,
            request_type,
            payload,
            status
        ) VALUES (
            target_user_id,
            'SEND_MESSAGE',
            v_payload,
            'pending'
        );
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
