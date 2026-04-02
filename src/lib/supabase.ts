import { createClient } from '@supabase/supabase-js';

// --- MOCK MODE CONFIGURATION ---
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://demo-antigravity.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'demo-key-1234567890';

export const isSupabaseConfigured = !!import.meta.env.VITE_SUPABASE_URL && 
                                    !import.meta.env.VITE_SUPABASE_URL.includes('your-project');

if (!isSupabaseConfigured) {
  console.warn('⚠️ [Antigravity] Ejecutando en MODO DEMO/MOCK. Las funciones de Supabase usarán valores de prueba.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Uploads a file to a specific Supabase storage bucket and returns its public URL.
 */
export const uploadFile = async (bucket: string, path: string, file: File | Blob) => {
  if (!isSupabaseConfigured) {
    // Mock URL for demo
    return `https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&q=80`;
  }

  const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: true
  });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(data.path);
  return publicUrl;
};

/**
 * Converts a dataURL/base64 string to a Blob object for Supabase Storage.
 */
export const base64ToBlob = (base64: string): Blob => {
  const parts = base64.split(';base64,');
  const contentType = parts[0].split(':')[1];
  const raw = window.atob(parts[1]);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);
  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }
  return new Blob([uInt8Array], { type: contentType });
};


