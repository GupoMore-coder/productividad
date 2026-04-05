-- Migración: Redes Sociales y Estructura de Proveedores
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS social_links text[] DEFAULT '{}';
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS secondary_contact text;

