-- Migración para corregir el esquema de perfiles y añadir campos faltantes
-- Ejecuta este script en el SQL Editor de Supabase para corregir el error: 
-- "Could not find the 'emergency_name' column of 'profiles'"

DO $$ 
BEGIN
    -- Añadir campos de contacto secundario si no existen
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'secondary_phone') THEN
        ALTER TABLE public.profiles ADD COLUMN secondary_phone text;
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'secondary_email') THEN
        ALTER TABLE public.profiles ADD COLUMN secondary_email text;
    END IF;

    -- Añadir campos de contacto de emergencia si no existen
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'emergency_name') THEN
        ALTER TABLE public.profiles ADD COLUMN emergency_name text;
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'emergency_relationship') THEN
        ALTER TABLE public.profiles ADD COLUMN emergency_relationship text;
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'emergency_phone') THEN
        ALTER TABLE public.profiles ADD COLUMN emergency_phone text;
    END IF;

    -- Añadir campo para control de bypass administrativo
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'bypass_allowed') THEN
        ALTER TABLE public.profiles ADD COLUMN bypass_allowed boolean DEFAULT true;
    END IF;

    -- Añadir campo para expiración de sandbox (periodo de prueba)
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'sandbox_expiry') THEN
        ALTER TABLE public.profiles ADD COLUMN sandbox_expiry timestamptz;
    END IF;

END $$;

-- Asegurar que las políticas de RLS permiten leer/escribir estos campos
-- (Asumiendo que ya tienes una política descriptiva, aquí solo nos aseguramos de que sea pública)
-- DROP POLICY IF EXISTS "Acceso público" on public.profiles;
-- create policy "Acceso público" on public.profiles for all using (true) with check (true);
