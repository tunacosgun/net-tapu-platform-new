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

          // 3. Listing ID — elegant pill badge, top-left
          if (listingNumber) {
            const pad = Math.max(16, W * 0.024);
            const idSize = Math.max(26, W * 0.042);
            const label = `#${listingNumber}`;
            ctx.save();
            ctx.font = `600 ${idSize}px -apple-system, Arial, sans-serif`;
            ctx.textBaseline = 'top';
            ctx.textAlign = 'left';

            // Measure text for pill background
            const textMetrics = ctx.measureText(label);
            const pillPadX = idSize * 0.55;
            const pillPadY = idSize * 0.35;
            const pillW = textMetrics.width + pillPadX * 2;
            const pillH = idSize + pillPadY * 2;
            const pillR = pillH / 2; // fully rounded
            const pillX = pad;
            const pillY = pad;

            // Draw semi-transparent dark pill
            ctx.globalAlpha = 0.55;
            ctx.fillStyle = 'rgba(0,0,0,1)';
            ctx.beginPath();
            ctx.moveTo(pillX + pillR, pillY);
            ctx.arcTo(pillX + pillW, pillY, pillX + pillW, pillY + pillH, pillR);
            ctx.arcTo(pillX + pillW, pillY + pillH, pillX, pillY + pillH, pillR);
            ctx.arcTo(pillX, pillY + pillH, pillX, pillY, pillR);
            ctx.arcTo(pillX, pillY, pillX + pillW, pillY, pillR);
            ctx.closePath();
            ctx.fill();

            // Draw white text on top
            ctx.globalAlpha = 0.92;
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            ctx.fillText(label, pillX + pillPadX, pillY + pillPadY);
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

/** Cache to avoid re-processing the same image. Version bump forces re-render on deploy. */
const wmCache = new Map<string, string>();
const WM_VERSION = 'v7';

export async function getWatermarkedUrl(
  imageUrl: string,
  watermarkText: string,
  listingNumber?: string,
): Promise<string> {
  const key = `${WM_VERSION}::${imageUrl}::${watermarkText}::${listingNumber || ''}`;
  if (wmCache.has(key)) return wmCache.get(key)!;
  const result = await burnWatermark(imageUrl, watermarkText, { listingNumber });
  wmCache.set(key, result);
  return result;
}