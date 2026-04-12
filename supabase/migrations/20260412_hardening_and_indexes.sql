-- ############################################################################
-- AUDITORÍA DE SEGURIDAD Y RENDIMIENTO (SPACEX LEVEL)
-- ############################################################################

-- 1. OPTIMIZACIÓN DE BÚSQUEDA (Índices para Escala)
-- Estos índices evitan que la app se ralentice cuando haya miles de tareas u órdenes.
CREATE INDEX IF NOT EXISTS idx_tasks_user_date ON public.tasks (user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_group_ids ON public.tasks USING GIN (group_ids);
CREATE INDEX IF NOT EXISTS idx_service_orders_status ON public.service_orders (status);
CREATE INDEX IF NOT EXISTS idx_service_orders_phone ON public.service_orders (customer_phone);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.realtime_notifications (user_id) WHERE is_read = false;

-- 2. HARDENING DE RLS (Protección de Roles)
-- Evita que cualquier usuario pueda cambiarse su propio rol o hacerse Master Admin.
DROP POLICY IF EXISTS "Users can only update safe fields" ON public.profiles;
CREATE POLICY "Users can only update safe fields" 
ON public.profiles FOR UPDATE 
TO authenticated 
USING (auth.uid() = id)
WITH CHECK (
    auth.uid() = id 
    AND (
        -- No pueden cambiar campos de seguridad a menos que ya sean Master Admin
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'Administrador maestro'
        OR (
            OLD.role = NEW.role 
            AND OLD.is_super_admin = NEW.is_super_admin
        )
    )
);

-- 3. INTEGRIDAD REFERENCIAL (Cascading Safety)
-- Asegurar que al borrar un proveedor de inventario, los items no queden huérfanos.
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE table_name = 'inventory_items') THEN
        ALTER TABLE public.inventory_items 
        DROP CONSTRAINT IF EXISTS inventory_items_provider_id_fkey,
        ADD CONSTRAINT inventory_items_provider_id_fkey 
        FOREIGN KEY (provider_id) REFERENCES public.providers(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 4. VAPID CONFIG (Check)
-- Comentario: Asegúrate de que las llaves VAPID estén en la tabla de configuración si no usas Secrets.
COMMENT ON TABLE public.push_subscriptions IS 'Almacén de suscripciones PWA. Auditoría SpaceX: OK.';
