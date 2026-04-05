/**
 * Burns a TILED diagonal watermark (sahibinden.com style) + listing ID into an image.
 * Dense repeating pattern across the entire image, rotated -30°.
 */
export function burnWatermark(
  imageUrl: string,
  watermarkText: string,
  options?: { opacity?: number; listingNumber?: string },
): Promise<string> {
  const { opacity = 0.22 } = options || {};
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

          // 2. Tiled diagonal watermark (sahibinden style)
          const fontSize = Math.max(12, Math.min(W, H) * 0.038);
          ctx.save();
          ctx.globalAlpha = opacity;
          ctx.font = `600 ${fontSize}px Arial, sans-serif`;
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.shadowColor = 'rgba(0,0,0,0.35)';
          ctx.shadowBlur = 4;

          const metrics = ctx.measureText(watermarkText);
          const textW = metrics.width;
          const colGap = textW + fontSize * 2.5;
          const rowGap = fontSize * 4;

          const diagLen = Math.ceil(Math.sqrt(W * W + H * H));
          const cols = Math.ceil(diagLen / colGap) + 2;
          const rows = Math.ceil(diagLen / rowGap) + 2;

          ctx.translate(W / 2, H / 2);
          ctx.rotate((-30 * Math.PI) / 180);

          for (let row = -rows; row <= rows; row++) {
            for (let col = -cols; col <= cols; col++) {
              const offsetX = (row % 2 === 0) ? 0 : colGap / 2;
              const x = col * colGap + offsetX - diagLen / 2;
              const y = row * rowGap;
              ctx.fillText(watermarkText, x, y);
            }
          }
          ctx.restore();

          // 3. Listing ID — sahibinden style: small, plain, no heavy shadow
          if (listingNumber) {
            const pad = Math.max(8, W * 0.012);
            const idSize = Math.max(11, W * 0.018);
            ctx.save();
            ctx.globalAlpha = 0.65;
            ctx.font = `400 ${idSize}px Arial, sans-serif`;
            ctx.textBaseline = 'top';
            ctx.textAlign = 'left';
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.shadowBlur = 3;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
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