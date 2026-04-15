-- 20260415_enable_global_broadcast.sql
-- Asegura la existencia de la tabla global_alerts y configura el acceso masivo.

CREATE TABLE IF NOT EXISTS public.global_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL DEFAULT 'info', -- 'creation', 'status_change', 'critical', 'completion'
    order_id TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_name TEXT,
    message TEXT NOT NULL,
    seen_by UUID[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.global_alerts ENABLE ROW LEVEL SECURITY;

-- Política: Todos los usuarios autenticados pueden LEER todas las alertas globales (Broadcast)
DROP POLICY IF EXISTS "Public authenticated read for global alerts" ON public.global_alerts;
CREATE POLICY "Public authenticated read for global alerts" 
ON public.global_alerts FOR SELECT 
TO authenticated 
USING (true);

-- Política: Los usuarios autenticados pueden INSERTAR alertas
DROP POLICY IF EXISTS "Authenticated users can insert global alerts" ON public.global_alerts;
CREATE POLICY "Authenticated users can insert global alerts" 
ON public.global_alerts FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Política: Los usuarios pueden actualizar el campo 'seen_by'
DROP POLICY IF EXISTS "Users can mark alert as seen" ON public.global_alerts;
CREATE POLICY "Users can mark alert as seen" 
ON public.global_alerts FOR UPDATE 
TO authenticated 
USING (true)
WITH CHECK (true);
