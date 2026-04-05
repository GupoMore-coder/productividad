-- ============================================================
-- CONFIGURACIÓN DE POLÍTICAS DE ALMACENAMIENTO (STORAGE)
-- Para Antigravity PWA - Grupo More
-- ============================================================

-- 1. Asegurar que los buckets existen (ya creados manualmente, pero activamos RLS)
-- Nota: Supabase Storage usa sus propias tablas internas

-- 2. POLÍTICAS PARA EL BUCKET 'order-photos'
-- Permitir que usuarios autenticados puedan ver todas las fotos de las órdenes
DROP POLICY IF EXISTS "Permitir lectura pública a usuarios autenticados" ON storage.objects;
CREATE POLICY "Permitir lectura pública a usuarios autenticados"
ON storage.objects FOR SELECT
TO authenticated
USING ( bucket_id = 'order-photos' );

-- Permitir que usuarios autenticados puedan subir fotos a 'order-photos'
DROP POLICY IF EXISTS "Permitir subida a usuarios autenticados" ON storage.objects;
CREATE POLICY "Permitir subida a usuarios autenticados"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'order-photos' );

-- Permitir que el dueño de la foto pueda borrarla
DROP POLICY IF EXISTS "Permitir borrado al dueño" ON storage.objects;
CREATE POLICY "Permitir borrado al dueño"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'order-photos' AND owner = auth.uid() );


-- 3. POLÍTICAS PARA EL BUCKET 'avatars'
-- Permitir lectura pública de avatares
DROP POLICY IF EXISTS "Lectura pública de avatares" ON storage.objects;
CREATE POLICY "Lectura pública de avatares"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'avatars' );

-- Permitir subida y actualización de avatares propios
DROP POLICY IF EXISTS "Subida de avatares propios" ON storage.objects;
CREATE POLICY "Subida de avatares propios"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'avatars' );

DROP POLICY IF EXISTS "Actualización de avatares propios" ON storage.objects;
CREATE POLICY "Actualización de avatares propios"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'avatars' )
WITH CHECK ( bucket_id = 'avatars' );

-- 4. POLÍTICAS PARA EL BUCKET 'task-photos'
-- Permitir lectura a usuarios autenticados
DROP POLICY IF EXISTS "Lectura de fotos de tareas" ON storage.objects;
CREATE POLICY "Lectura de fotos de tareas"
ON storage.objects FOR SELECT
TO authenticated
USING ( bucket_id = 'task-photos' );

-- Permitir subida a usuarios autenticados
DROP POLICY IF EXISTS "Subida de fotos de tareas" ON storage.objects;
CREATE POLICY "Subida de fotos de tareas"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'task-photos' );

-- Permitir borrado al dueño
DROP POLICY IF EXISTS "Borrado de fotos de tareas al dueño" ON storage.objects;
CREATE POLICY "Borrado de fotos de tareas al dueño"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'task-photos' AND owner = auth.uid() );

-- ============================================================
-- COPIA ESTO Y PÉGALO EN EL SQL EDITOR DE SUPABASE
-- ============================================================
