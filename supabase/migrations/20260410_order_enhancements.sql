-- Actualización de esquema para Soporte de Pruebas y PDFs en la Nube

-- 1. Agregar columnas a service_orders
ALTER TABLE service_orders 
ADD COLUMN IF NOT EXISTS is_test BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS pdf_url TEXT,
ADD COLUMN IF NOT EXISTS pdf_expires_at TIMESTAMPTZ;

-- 2. Crear bucket para PDFs si no existe (via polizas de storage)
-- Nota: La creación del bucket físico usualmente se hace via API o CLI, 
-- pero configuramos las políticas de seguridad aquí.

INSERT INTO storage.buckets (id, name, public)
VALUES ('order-pdfs', 'order-pdfs', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Políticas de Acceso para el bucket 'order-pdfs'
-- Permitir lectura pública de los PDFs para que los clientes puedan descargarlos
CREATE POLICY "Acceso público a PDFs"
ON storage.objects FOR SELECT
USING ( bucket_id = 'order-pdfs' );

-- Permitir a los usuarios autenticados subir PDFs
CREATE POLICY "Usuarios pueden subir PDFs"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'order-pdfs' AND auth.role() = 'authenticated' );

-- Permitir a los usuarios autenticados actualizar sus PDFs
CREATE POLICY "Usuarios pueden actualizar PDFs"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'order-pdfs' AND auth.role() = 'authenticated' );
