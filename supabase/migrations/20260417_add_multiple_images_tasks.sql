-- ############################################################################
-- MIGRACIÓN: SOPORTE PARA MÚLTIPLES IMÁGENES EN AGENDA (TASKS)
-- FECHA: 17/04/2026
-- ############################################################################

-- 1. Agregar la columna de array de imágenes
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT ARRAY[]::TEXT[];

-- 2. Migrar los datos existentes de la columna única image_url al nuevo array
-- Nota: Solo migramos si image_url tiene contenido y image_urls está vacío
UPDATE public.tasks 
SET image_urls = ARRAY[image_url] 
WHERE image_url IS NOT NULL 
  AND (image_urls IS NULL OR ARRAY_LENGTH(image_urls, 1) IS NULL);

-- 3. Asegurar que las políticas de RLS permitan la lectura/escritura (usualmente cubierto por políticas generales)
-- No se requieren cambios en RLS si la tabla ya tiene políticas permissivas basadas en roles o user_id.

-- ############################################################################
-- FIN DE LA MIGRACIÓN
-- ############################################################################
