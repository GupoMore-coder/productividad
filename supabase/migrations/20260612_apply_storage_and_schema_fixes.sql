-- 1. Agregar columnas para la gestión de facturas/PDFs estáticos en service_orders
ALTER TABLE public.service_orders 
ADD COLUMN IF NOT EXISTS pdf_url TEXT,
ADD COLUMN IF NOT EXISTS pdf_expires_at TIMESTAMPTZ;

-- 2. Asegurar la creación del bucket de PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('order-pdfs', 'order-pdfs', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Políticas RLS para 'order-pdfs'
CREATE POLICY "Acceso público a PDFs"
ON storage.objects FOR SELECT
USING ( bucket_id = 'order-pdfs' );

CREATE POLICY "Usuarios pueden subir PDFs"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'order-pdfs' AND auth.role() = 'authenticated' );

CREATE POLICY "Usuarios pueden actualizar PDFs"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'order-pdfs' AND auth.role() = 'authenticated' );

-- 4. Habilitar SELECT y UPDATE para 'order-photos' (Cura el error de RLS en subida de evidencias con upsert)
CREATE POLICY "Permitir lectura de fotos a usuarios autenticados"
ON storage.objects FOR SELECT
TO authenticated
USING ( bucket_id = 'order-photos' );

CREATE POLICY "Permitir actualización de fotos a dueños autenticados"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'order-photos' )
WITH CHECK ( bucket_id = 'order-photos' );

-- 5. Habilitar SELECT y UPDATE para 'task-photos' (Previene el mismo error de RLS en tareas)
CREATE POLICY "Permitir lectura de fotos de tareas a autenticados"
ON storage.objects FOR SELECT
TO authenticated
USING ( bucket_id = 'task-photos' );

CREATE POLICY "Permitir actualización de fotos de tareas a autenticados"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'task-photos' )
WITH CHECK ( bucket_id = 'task-photos' );
