-- ############################################################################
-- SCRIPT DE SINCRONIZACIÓN TOTAL - ANTIGRAVITY PWA 2026
-- ############################################################################
-- Este script sincroniza la base de datos con las Fases 1, 2, 3 y 4:
-- 1. Agenda Inteligente (Recurrencia y Tipos)
-- 2. Sistema de Notificaciones en Tiempo Real (Expulsiones y Cierres)
-- 3. Seguridad para Borrado en Cascada (Admin Master)
-- 4. Integridad Histórica de Órdenes
-- ############################################################################

-- 1. EVOLUCIÓN DE LA TABLA DE TAREAS (Agenda v2)
DO $$ 
BEGIN
    -- Añadir columna 'type' (Tarea vs Recordatorio)
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name = 'tasks' AND column_name = 'type') THEN
        ALTER TABLE public.tasks ADD COLUMN type TEXT DEFAULT 'task';
    END IF;

    -- Añadir columnas de Recurrencia
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name = 'tasks' AND column_name = 'recurrence') THEN
        ALTER TABLE public.tasks ADD COLUMN recurrence TEXT DEFAULT 'none';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name = 'tasks' AND column_name = 'recurrence_interval') THEN
        ALTER TABLE public.tasks ADD COLUMN recurrence_interval INTEGER DEFAULT 1;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name = 'tasks' AND column_name = 'recurrence_end_date') THEN
        ALTER TABLE public.tasks ADD COLUMN recurrence_end_date TIMESTAMP WITH TIME ZONE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name = 'tasks' AND column_name = 'original_task_id') THEN
        ALTER TABLE public.tasks ADD COLUMN original_task_id UUID;
    END IF;

    -- Añadir columnas de Notificaciones / Silenciamiento
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name = 'tasks' AND column_name = 'is_muted') THEN
        ALTER TABLE public.tasks ADD COLUMN is_muted BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name = 'tasks' AND column_name = 'muted_alarms') THEN
        ALTER TABLE public.tasks ADD COLUMN muted_alarms INTEGER[] DEFAULT '{}';
    END IF;
END $$;

-- 2. CREACIÓN DEL SISTEMA DE NOTIFICACIONES EN TIEMPO REAL
CREATE TABLE IF NOT EXISTS public.realtime_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    type TEXT DEFAULT 'info', -- 'info', 'alert', 'group_closure', 'expulsion'
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS en notificaciones
ALTER TABLE public.realtime_notifications ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo ven sus propias notificaciones
DROP POLICY IF EXISTS "Users can view own notifications" ON public.realtime_notifications;
CREATE POLICY "Users can view own notifications" 
ON public.realtime_notifications FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Política: Sistema puede insertar notificaciones
DROP POLICY IF EXISTS "System can insert notifications" ON public.realtime_notifications;
CREATE POLICY "System can insert notifications" 
ON public.realtime_notifications FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- 3. AJUSTES DE INTEGRIDAD PARA BAJA DE PERSONAL (Fase 3)
-- Asegurar que las órdenes NO se borren si el creador es eliminado
DO $$ 
BEGIN
    -- Cambiar restricción de 'created_by' en service_orders
    -- Primero eliminamos la existente si es necesario (asumiendo nombre estándar)
    ALTER TABLE public.service_orders 
    DROP CONSTRAINT IF EXISTS service_orders_created_by_fkey;
    
    ALTER TABLE public.service_orders 
    ADD CONSTRAINT service_orders_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

    -- Lo mismo para el historial de órdenes
    ALTER TABLE public.order_history 
    DROP CONSTRAINT IF EXISTS order_history_user_id_fkey;
    
    ALTER TABLE public.order_history 
    ADD CONSTRAINT order_history_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
END $$;

-- 4. PERMISOS MAESTROS DE ADMINISTRACIÓN (RLS)
-- Permitir que el Master Admin borre tareas y grupos de otros usuarios
DO $$ 
BEGIN
    -- Permitir que el Administrador Maestro borre tareas de otros
    DROP POLICY IF EXISTS "Master admin can delete any task" ON public.tasks;
    CREATE POLICY "Master admin can delete any task" ON public.tasks FOR DELETE TO authenticated 
    USING ( 
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'Administrador maestro'
        OR auth.uid() = user_id 
    );

    -- Permitir que el Administrador Maestro gestione grupos
    DROP POLICY IF EXISTS "Master admin can manage any group" ON public.groups;
    CREATE POLICY "Master admin can manage any group" ON public.groups FOR ALL TO authenticated 
    USING ( 
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'Administrador maestro'
        OR auth.uid() = creator_id 
    );

    -- Política de borrado universal para Master Admin en MEMBERSHIPS
    DROP POLICY IF EXISTS "Master admin can manage any membership" ON public.group_memberships;
    CREATE POLICY "Master admin can manage any membership" 
    ON public.group_memberships FOR ALL 
    TO authenticated 
    USING (
        (SELECT is_master FROM public.profiles WHERE id = auth.uid()) = true
        OR auth.uid() = user_id
    );
END $$;

-- ############################################################################
-- FIN DEL SCRIPT
-- ############################################################################
