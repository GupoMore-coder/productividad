import { createClient } from '@supabase/supabase-js';

// --- MOCK MODE CONFIGURATION ---
// These are test values for functional validation. 
// A full migration to real credentials will follow the technical tests.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://demo-antigravity.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'demo-key-1234567890';

export const isSupabaseConfigured = !!import.meta.env.VITE_SUPABASE_URL && 
                                    !import.meta.env.VITE_SUPABASE_URL.includes('your-project');

if (!isSupabaseConfigured) {
  console.warn('⚠️ [Antigravity] Ejecutando en MODO DEMO/MOCK. Las funciones de Supabase usarán valores de prueba.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
