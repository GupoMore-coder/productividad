-- Phase 11: Infraestructura de Vanguardia Antigravity
-- Objetivo: Habilitar seguridad biométrica de nivel bancario (Passkeys / WebAuthn)
-- Instrucciones: Ejecutar este script en el SQL Editor de Supabase.

-- Tabla de credenciales de autenticación biométrica
CREATE TABLE IF NOT EXISTS user_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  credential_id TEXT NOT NULL UNIQUE,
  public_key TEXT NOT NULL,
  counter BIGINT DEFAULT 0,
  device_type TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE user_credentials ENABLE ROW LEVEL SECURITY;

-- Poliza: Solo el dueño de la cuenta puede ver sus propias llaves biométricas
CREATE POLICY "Users can view their own credentials"
  ON user_credentials FOR SELECT
  USING (auth.uid() = user_id);

-- Poliza: Solo el sistema o el usuario puede crear sus llaves
CREATE POLICY "Users can create their own credentials"
  ON user_credentials FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Poliza: Solo el usuario puede borrar sus llaves (ej. desvincular dispositivo)
CREATE POLICY "Users can delete their own credentials"
  ON user_credentials FOR DELETE
  USING (auth.uid() = user_id);

-- Índice para búsquedas rápidas por credential_id durante el login
CREATE INDEX IF NOT EXISTS idx_user_credentials_cid ON user_credentials (credential_id);

-- Nota: Este esquema permite que cada usuario vincule múltiples dispositivos (Móvil, PC, Tablet) 
-- para un acceso redundante y seguro al 1000%.
