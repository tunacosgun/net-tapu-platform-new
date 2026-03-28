/**
 * Burns a single centered watermark text into an image using canvas.
 * Also adds the listing number in the top-left corner.
 * Returns a data URL with the watermark permanently rendered on the image.
 */
export function burnWatermark(
  imageUrl: string,
  watermarkText: string,
  options?: { opacity?: number; fontSize?: number; listingNumber?: string },
): Promise<string> {
  const { opacity = 0.15, fontSize = 48 } = options || {};
  const listingNumber = options?.listingNumber;

  return new Promise((resolve) => {
    fetch(imageUrl)
      .then((res) => res.blob())
      .then((blob) => {
        const blobUrl = URL.createObjectURL(blob);
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext('2d');
          if (!ctx) { URL.revokeObjectURL(blobUrl); resolve(imageUrl); return; }

          // Draw original image
          ctx.drawImage(img, 0, 0);

          // Draw single centered watermark
          ctx.save();
          ctx.globalAlpha = opacity;
          const scaledFontSize = Math.max(fontSize, Math.min(canvas.width, canvas.height) * 0.06);
          ctx.font = `bold ${scaledFontSize}px Arial, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = 'rgba(255,255,255,0.8)';
          ctx.strokeStyle = 'rgba(0,0,0,0.3)';
          ctx.lineWidth = 2;
          const cx = canvas.width / 2;
          const cy = canvas.height / 2;
          ctx.strokeText(watermarkText, cx, cy);
          ctx.fillText(watermarkText, cx, cy);
          ctx.restore();

          // Draw listing number in top-left corner
          if (listingNumber) {
            ctx.save();
            const lnFontSize = Math.max(16, Math.min(canvas.width, canvas.height) * 0.025);
            ctx.font = `bold ${lnFontSize}px Arial, sans-serif`;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            const text = `#${listingNumber}`;
            const metrics = ctx.measureText(text);
            const padX = 10;
            const padY = 6;
            // Semi-transparent background
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(8, 8, metrics.width + padX * 2, lnFontSize + padY * 2);
            // White text
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = 0.9;
            ctx.fillText(text, 8 + padX, 8 + padY);
            ctx.restore();
          }

          URL.revokeObjectURL(blobUrl);
          try {
            resolve(canvas.toDataURL('image/jpeg', 0.92));
          } catch {
            resolve(imageUrl);
          }
        };
        img.onerror = () => { URL.revokeObjectURL(blobUrl); resolve(imageUrl); };
        img.src = blobUrl;
      })
      .catch(() => resolve(imageUrl));
  });
}

/**
 * Cache for already-watermarked images to avoid re-processing.
 */
const wmCache = new Map<string, string>();

export async function getWatermarkedUrl(
  imageUrl: string,
  watermarkText: string,
  listingNumber?: string,
): Promise<string> {
  const key = `${imageUrl}::${watermarkText}::${listingNumber || ''}`;
  if (wmCache.has(key)) return wmCache.get(key)!;
  const result = await burnWatermark(imageUrl, watermarkText, { listingNumber });
  wmCache.set(key, result);
  return result;
}
