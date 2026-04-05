import { createClient } from '@supabase/supabase-js';
import imageCompression from 'browser-image-compression';

// --- CONFIGURACIÓN DINÁMICA DE SUPABASE ---
// Para funcionar con tu base de datos real, crea un archivo '.env' en la raíz del proyecto.
// Copia '.env.example' y rellena tus valores desde: https://supabase.com/dashboard
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// isSupabaseConfigured: true SOLO cuando ambas variables de entorno son reales
export const isSupabaseConfigured = 
  !!supabaseUrl && 
  !!supabaseAnonKey && 
  !supabaseUrl.includes('your-project') &&
  !supabaseAnonKey.includes('demo-key');

if (!isSupabaseConfigured) {
  console.warn('⚠️ [Antigravity] Ejecutando en MODO DEMO/LOCAL. Las tareas se guardan en localStorage. Para conectar a la base de datos real, crea un archivo .env con tus credenciales de Supabase.');
}

// Cliente Supabase: usa valores reales si están configurados, si no usa placeholders seguros
export const supabase = createClient(
  supabaseUrl || 'https://grsaehpmaihrztusehkb.supabase.co',
  supabaseAnonKey || 'local-demo-mode-no-network-calls'
);

/**
 * Uploads a file to a specific Supabase storage bucket and returns its public URL.
 */
export const uploadFile = async (bucket: string, path: string, file: File | Blob) => {
  if (!isSupabaseConfigured) {
    // Mock URL for demo
    return `https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&q=80`;
  }

  let finalFile = file;
  
  // v11: Vanguard Image Optimization (WebP compression)
  if (file.type && file.type.startsWith('image/') && !file.type.includes('svg')) {
    try {
      const options = {
        maxSizeMB: 0.5, // Target < 500KB for elite performance
        maxWidthOrHeight: 1600,
        useWebWorker: true,
        fileType: 'image/webp' as any // Elite format
      };
      
      const compressedFile = await imageCompression(file as File, options);
      finalFile = compressedFile;
      
      // Update path extension to .webp if it was different
      if (!path.endsWith('.webp')) {
        path = path.substring(0, path.lastIndexOf('.')) + '.webp';
      }
    } catch (err) {
      console.warn('⚠️ [Vanguard] Error en compresión de imagen, cargando original.', err);
    }
  }

  const { data, error } = await supabase.storage.from(bucket).upload(path, finalFile, {
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


