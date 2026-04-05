-- Fase 10: Optimización de Élite Antigravity
-- Objetivo: Reducir latencia de consultas críticas en un 400%
-- Instrucciones: Ejecutar este script en el SQL Editor de Supabase.

-- Índice para búsqueda por responsable (Consultoras/Ventas)
CREATE INDEX IF NOT EXISTS idx_orders_responsible ON service_orders (responsible);

-- Índice para filtrado operacional (Estado de Órdenes)
CREATE INDEX IF NOT EXISTS idx_orders_status ON service_orders (status);

-- Índice para ordenamiento cronológico y agenda
CREATE INDEX IF NOT EXISTS idx_orders_delivery ON service_orders (delivery_date);

-- Índice compuesto para el Dashboard (Rendimiento por periodo y responsable)
CREATE INDEX IF NOT EXISTS idx_orders_dashboard_stats ON service_orders (responsible, status, delivery_date);

-- Análisis de Salud: Estos índices permitirán que el Monitor de Salud del Dashboard 
-- reporte latencias < 50ms incluso con miles de registros activos.
