/**
 * Burns a diagonal centered watermark + listing ID overlay into an image using canvas.
 * Returns a data URL with everything permanently rendered (visible in fullscreen/new tab).
 */
export function burnWatermark(
  imageUrl: string,
  watermarkText: string,
  options?: { opacity?: number; fontSize?: number; listingNumber?: string },
): Promise<string> {
  const { opacity = 0.12 } = options || {};
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

          // 1. Draw original image at full resolution
          ctx.drawImage(img, 0, 0);

          // 2. Diagonal centered watermark — rotated ~-30deg, centered
          ctx.save();
          ctx.globalAlpha = opacity;
          const scaledFontSize = Math.max(20, Math.min(W, H) * 0.07);
          ctx.font = `bold ${scaledFontSize}px Arial, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = 'rgba(255,255,255,0.9)';
          ctx.strokeStyle = 'rgba(0,0,0,0.35)';
          ctx.lineWidth = Math.max(1, scaledFontSize * 0.04);
          ctx.translate(W / 2, H / 2);
          ctx.rotate((-30 * Math.PI) / 180);
          ctx.strokeText(watermarkText, 0, 0);
          ctx.fillText(watermarkText, 0, 0);
          ctx.restore();

          // 3. Listing ID — subtle text-only label at top-left (no box, scales with image)
          if (listingNumber) {
            const pad = Math.max(8, W * 0.014);
            const idFontSize = Math.max(10, W * 0.018);
            ctx.save();
            ctx.globalAlpha = 0.72;
            ctx.font = `500 ${idFontSize}px Arial, sans-serif`;
            ctx.textBaseline = 'top';
            ctx.textAlign = 'left';
            // Soft shadow for readability on any background
            ctx.shadowColor = 'rgba(0,0,0,0.65)';
            ctx.shadowBlur = idFontSize * 0.5;
            ctx.shadowOffsetX = 0;
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
