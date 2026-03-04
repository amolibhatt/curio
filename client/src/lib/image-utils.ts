export function compressImage(file: File, maxWidth = 800, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width;
        let h = img.height;

        if (w > maxWidth) {
          h = (h * maxWidth) / w;
          w = maxWidth;
        }

        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('Canvas not supported')); return; }

        ctx.drawImage(img, 0, 0, w, h);

        let result = canvas.toDataURL('image/jpeg', quality);

        if (result.length > 750000 && quality > 0.3) {
          result = canvas.toDataURL('image/jpeg', 0.4);
        }

        if (result.length > 750000 && w > 400) {
          const smallCanvas = document.createElement('canvas');
          const sw = 400;
          const sh = (h * 400) / w;
          smallCanvas.width = sw;
          smallCanvas.height = sh;
          const sctx = smallCanvas.getContext('2d');
          if (sctx) {
            sctx.drawImage(img, 0, 0, sw, sh);
            result = smallCanvas.toDataURL('image/jpeg', 0.5);
          }
        }

        resolve(result);
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}
