/**
 * Utility to optimize images for web storage and performance.
 * Converts any image to WebP format with optional resizing and high compression.
 */
export async function optimizeImage(
  fileOrDataUrl: File | string,
  maxWidth: number = 800,
  maxHeight: number = 800,
  quality: number = 0.7
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Calculate new dimensions while maintaining aspect ratio
      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Draw the image on the canvas
      ctx.drawImage(img, 0, 0, width, height);

      // Convert the canvas content to a WebP data URL
      // Fallback to jpeg if webp is not supported (though rare in modern PWAs)
      const dataUrl = canvas.toDataURL('image/webp', quality);
      resolve(dataUrl);
    };

    img.onerror = (err) => {
      reject(new Error('Error loading image for optimization: ' + err));
    };

    if (typeof fileOrDataUrl === 'string') {
      img.src = fileOrDataUrl;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Error reading file'));
      reader.readAsDataURL(fileOrDataUrl);
    }
  });
}
