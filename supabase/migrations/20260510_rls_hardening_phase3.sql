-- MIGRACION 1 DE 3 - RLS HARDENING (simplificada, sin JOINs de tipos incompatibles)
-- Fecha: 10/05/2026

-- 1. whatsapp_messages - lectura general para usuarios autenticados
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "WhatsApp read" ON public.whatsapp_messages;
CREATE POLICY "WhatsApp read" ON public.whatsapp_messages FOR SELECT TO authenticated USING (true);

-- 2. push_notifications
ALTER TABLE public.push_notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Push read own" ON public.push_notifications;
CREATE POLICY "Push read own" ON public.push_notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Push insert" ON public.push_notifications;
CREATE POLICY "Push insert" ON public.push_notifications FOR INSERT TO authenticated WITH CHECK (true);

-- 3. global_broadcast_queue - solo admins
DROP POLICY IF EXISTS "Broadcast admins" ON public.global_broadcast_queue;
CREATE POLICY "Broadcast admins" ON public.global_broadcast_queue FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('Administrador maestro', 'Director General (CEO)', 'Gestor Administrativo'))
);

-- 4. config_service_types
ALTER TABLE public.config_service_types ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ServiceTypes read" ON public.config_service_types;
CREATE POLICY "ServiceTypes read" ON public.config_service_types FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "ServiceTypes admin write" ON public.config_service_types;
CREATE POLICY "ServiceTypes admin write" ON public.config_service_types FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'Administrador maestro')
);

-- 5. missing_items
ALTER TABLE public.missing_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "MissingItems policy" ON public.missing_items;
CREATE POLICY "MissingItems policy" ON public.missing_items FOR ALL TO authenticated USING (
  reported_by_id = auth.uid() 
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('Administrador maestro', 'Director General (CEO)', 'Gestor Administrativo', 'Supervisora Puntos de Venta'))
);

-- 6. order_history - lectura general (aplicacion filtra)
ALTER TABLE public.order_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "OrderHistory read" ON public.order_history;
CREATE POLICY "OrderHistory read" ON public.order_history FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "OrderHistory insert" ON public.order_history;
CREATE POLICY "OrderHistory insert" ON public.order_history FOR INSERT TO authenticated WITH CHECK (true);

-- 7. Indexes
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_order_id ON public.whatsapp_messages (order_id);
CREATE INDEX IF NOT EXISTS idx_service_orders_created_by_status ON public.service_orders (created_by, status);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id_date ON public.tasks (user_id, date);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON public.tasks (created_by);

-- 8. secrets - DENEGAR todo acceso
ALTER TABLE public.secrets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Secrets deny" ON public.secrets;
CREATE POLICY "Secrets deny" ON public.secrets FOR ALL TO authenticated USING (false);

-- 9. global_alerts
DROP POLICY IF EXISTS "GlobalAlerts read" ON public.global_alerts;
CREATE POLICY "GlobalAlerts read" ON public.global_alerts FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "GlobalAlerts admin insert" ON public.global_alerts;
CREATE POLICY "GlobalAlerts admin insert" ON public.global_alerts FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('Administrador maestro', 'Director General (CEO)', 'Gestor Administrativo'))
);

-- 10. approval_requests
ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Approvals read own" ON public.approval_requests;
CREATE POLICY "Approvals read own" ON public.approval_requests FOR SELECT TO authenticated USING (requested_by = auth.uid());
DROP POLICY IF EXISTS "Approvals admin" ON public.approval_requests;
CREATE POLICY "Approvals admin" ON public.approval_requests FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('Administrador maestro', 'Director General (CEO)', 'Gestor Administrativo'))
);