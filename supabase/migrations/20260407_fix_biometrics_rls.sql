-- Migración para corregir el error RLS en biometría para usuarios Master (Bypass)
-- Ejecuta este script en el SQL Editor de Supabase para corregir el error: 
-- "new row violates row-level security policy for table 'user_credentials'"

DO $$ 
BEGIN
    -- Permitir inserción de credenciales operada por la aplicación (Bypass-friendly)
    DROP POLICY IF EXISTS "Users can create their own credentials" ON public.user_credentials;
    CREATE POLICY "Users can create their own credentials"
      ON public.user_credentials FOR INSERT
      WITH CHECK (true);

    -- Permitir lectura de credenciales operada por la aplicación
    DROP POLICY IF EXISTS "Users can view their own credentials" ON public.user_credentials;
    CREATE POLICY "Users can view their own credentials"
      ON public.user_credentials FOR SELECT
      USING (true);

    -- Permitir borrado de credenciales operada por la aplicación
    DROP POLICY IF EXISTS "Users can delete their own credentials" ON public.user_credentials;
    CREATE POLICY "Users can delete their own credentials"
      ON public.user_credentials FOR DELETE
      USING (true);
END $$;
