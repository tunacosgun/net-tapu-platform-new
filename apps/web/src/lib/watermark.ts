/**
 * Burns a single diagonal watermark + listing ID into an image using canvas.
 * One clean centered text, rotated -30°. No tiling.
 */
export function burnWatermark(
  imageUrl: string,
  watermarkText: string,
  options?: { opacity?: number; listingNumber?: string },
): Promise<string> {
  const { opacity = 0.18 } = options || {};
  const listingNumber = options?.listingNumber;

  return new Promise((resolve) => {
    fetch(imageUrl)
      .then((res) => res.blob())
      .then((blob) => {
        const blobUrl = URL.createObjectURL(blob);
        const img = new window.Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const W = img.naturalWidth;
          const H = img.naturalHeight;
          const canvas = document.createElement('canvas');
          canvas.width = W;
          canvas.height = H;
          const ctx = canvas.getContext('2d');
          if (!ctx) { URL.revokeObjectURL(blobUrl); resolve(imageUrl); return; }

          // 1. Draw original image
          ctx.drawImage(img, 0, 0);

          // 2. Single centered diagonal watermark
          const fontSize = Math.max(18, Math.min(W, H) * 0.055);
          ctx.save();
          ctx.translate(W / 2, H / 2);
          ctx.rotate((-30 * Math.PI) / 180);
          ctx.globalAlpha = opacity;
          ctx.font = `600 ${fontSize}px Arial, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          // Subtle shadow for depth
          ctx.shadowColor = 'rgba(0,0,0,0.25)';
          ctx.shadowBlur = 6;
          ctx.fillStyle = 'rgba(255,255,255,0.9)';
          ctx.fillText(watermarkText, 0, 0);
          ctx.restore();

          // 3. Listing ID — top-left, clearly readable at any display size
          if (listingNumber) {
            const pad = Math.max(12, W * 0.018);
            const idSize = Math.max(16, W * 0.032); // bigger so visible when scaled down
            ctx.save();
            ctx.globalAlpha = 0.88;
            ctx.font = `700 ${idSize}px Arial, sans-serif`;
            ctx.textBaseline = 'top';
            ctx.textAlign = 'left';
            // Strong shadow for contrast on any background
            ctx.shadowColor = 'rgba(0,0,0,0.85)';
            ctx.shadowBlur = idSize * 0.8;
            ctx.shadowOffsetX = 1;
            ctx.shadowOffsetY = 1;
            ctx.fillStyle = '#ffffff';
            ctx.fillText(`#${listingNumber}`, pad, pad);
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

/** Cache to avoid re-processing the same image. */
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
