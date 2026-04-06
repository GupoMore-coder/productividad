// ============================================================
// imageCompressor.ts
// Reduces any photo to a max of 800×800px at 60% JPEG quality
// before it reaches localStorage or Supabase.
// Typical result: 5MB photo → ~80–150KB
// ============================================================

const MAX_DIMENSION = 800;   // px
const JPEG_QUALITY  = 0.60;  // 0–1

/**
 * Compress a File (JPEG/PNG/WebP) using the Canvas API.
 * Returns a base64 data URL string (image/webp).
 */
export function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (evt) => {
      if (!evt.target?.result) return reject(new Error('No file data'));

      const img = new Image();
      img.onload = () => {
        // ── Scale keeping aspect ratio ───────────────────
        let { width, height } = img;
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          if (width >= height) {
            height = Math.round((height * MAX_DIMENSION) / width);
            width = MAX_DIMENSION;
          } else {
            width = Math.round((width * MAX_DIMENSION) / height);
            height = MAX_DIMENSION;
          }
        }

        // ── Draw to canvas and export ──────────────────
        const canvas = document.createElement('canvas');
        canvas.width  = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, width, height);

        const compressed = canvas.toDataURL('image/webp', JPEG_QUALITY);
        resolve(compressed);
      };
      img.onerror = () => reject(new Error('Could not load image'));
      img.src = evt.target.result as string;
    };

    reader.onerror = () => reject(new Error('FileReader error'));
    reader.readAsDataURL(file);
  });
}
