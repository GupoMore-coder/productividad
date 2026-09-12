-- ############################################################################
-- MIGRACIÓN DE SEGURIDAD Y ENDURECIMIENTO DE RASTREO PÚBLICO (2026-09-12)
-- Antigravity PWA v.2026 - Grupo More Paper & Design
-- ############################################################################

-- 1. FUNCIÓN PÚBLICA PARA CONSULTA DE ESTADO DE ÓRDENES (QR Tracking)
-- Permite a clientes anónimos consultar el estado en vivo de su pedido
-- exponiendo ÚNICAMENTE campos públicos y seguros, sin abrir la tabla a SELECT público.

CREATE OR REPLACE FUNCTION public.get_public_order_status(target_order_id text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'id', so.id,
    'customer_name', so.customer_name,
    'status', so.status,
    'record_type', so.record_type,
    'delivery_date', so.delivery_date,
    'quote_expires_at', so.quote_expires_at,
    'services', so.services,
    'total_cost', so.total_cost,
    'deposit_amount', so.deposit_amount,
    'pending_balance', so.pending_balance,
    'payment_status', so.payment_status,
    'created_at', so.created_at,
    'history', COALESCE((
      SELECT json_agg(json_build_object(
        'timestamp', oh.timestamp,
        'type', oh.type,
        'description', oh.description
      ) ORDER BY oh.timestamp DESC)
      FROM public.order_history oh
      WHERE oh.order_id = so.id
    ), '[]'::json)
  ) INTO result
  FROM public.service_orders so
  WHERE so.id = target_order_id;

  RETURN result;
END;
$$;

-- Otorgar permiso de ejecución explícito a usuarios anónimos y autenticados
GRANT EXECUTE ON FUNCTION public.get_public_order_status(text) TO anon, authenticated;

-- 2. ENDURECIMIENTO DE POLÍTICAS RLS EN SERVICE_ORDERS
-- Evitar que cualquier usuario autenticado modifique o borre órdenes ajenas.

ALTER TABLE public.service_orders ENABLE ROW LEVEL SECURITY;

-- Limpieza de políticas laxas anteriores
DROP POLICY IF EXISTS "Acceso público" ON public.service_orders;
DROP POLICY IF EXISTS "Órdenes: Gestión total" ON public.service_orders;
DROP POLICY IF EXISTS "Órdenes: Lectura total" ON public.service_orders;
DROP POLICY IF EXISTS "Orders read" ON public.service_orders;
DROP POLICY IF EXISTS "Orders insert" ON public.service_orders;
DROP POLICY IF EXISTS "Orders update" ON public.service_orders;
DROP POLICY IF EXISTS "Orders delete" ON public.service_orders;

-- 2.1 Lectura: Todos los miembros del equipo autenticados pueden ver órdenes de trabajo
CREATE POLICY "Orders read authenticated" ON public.service_orders
FOR SELECT TO authenticated USING (true);

-- 2.2 Creación: Cualquier usuario del equipo puede generar órdenes
CREATE POLICY "Orders insert authenticated" ON public.service_orders
FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by OR created_by IS NULL);

-- 2.3 Modificación: Solo el creador o roles administrativos
CREATE POLICY "Orders update authorized" ON public.service_orders
FOR UPDATE TO authenticated USING (
  auth.uid() = created_by 
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND (role IN ('Administrador maestro', 'Director General (CEO)', 'Gestor Administrativo', 'Consultora de Ventas') OR is_super_admin = true)
  )
);

-- 2.4 Borrado: Exclusivo para el Administrador Maestro
CREATE POLICY "Orders delete master admin only" ON public.service_orders
FOR DELETE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND (role = 'Administrador maestro' OR is_super_admin = true)
  )
);

-- 3. CORRECCIÓN DE POLÍTICA EN GROUP_MEMBERSHIPS (Evitar error 'column is_master does not exist')
DROP POLICY IF EXISTS "Master admin can manage any membership" ON public.group_memberships;
CREATE POLICY "Master admin can manage any membership" 
ON public.group_memberships FOR ALL 
TO authenticated 
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND (role = 'Administrador maestro' OR is_super_admin = true)
  )
);
