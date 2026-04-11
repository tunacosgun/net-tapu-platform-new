'use client';

import { useEffect, useCallback, useState } from 'react';
import { ChevronLeft, ChevronRight, X, Maximize2, ImageIcon } from 'lucide-react';
import type { ParcelImage } from '@/types';
import { resolveImageUrl } from '@/lib/format';

interface ParcelImageGalleryProps {
  images: ParcelImage[];
  wmImages: Record<number, string>;
  title: string;
  listingNumber?: string;
}

/**
 * ParcelImageGallery
 *
 * Main view  → fixed 4:3 aspect-ratio container, object-cover (no white gaps).
 *              Small images are upscaled to fill, large images are cropped minimally.
 *              Listing-ID overlay is rendered via CSS (top-left, scales with container).
 *
 * Lightbox   → full-screen dark backdrop, object-contain so the whole image is visible.
 *              Listing-ID overlay is also rendered here (part of the image layer).
 *
 * Thumbnails → fixed size, object-cover, selected = brand border.
 */
export function ParcelImageGallery({ images, wmImages, title, listingNumber }: ParcelImageGalleryProps) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const currentSrc = wmImages[selectedIdx] || resolveImageUrl(images[selectedIdx]);

  // Keyboard navigation
  const goNext = useCallback(() => setSelectedIdx((i) => (i + 1) % images.length), [images.length]);
  const goPrev = useCallback(() => setSelectedIdx((i) => (i - 1 + images.length) % images.length), [images.length]);

  useEffect(() => {
    if (!lightboxOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'Escape') setLightboxOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxOpen, goNext, goPrev]);

  if (images.length === 0) {
    return (
      <div className="relative w-full overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--background-subtle)]" style={{ aspectRatio: '4/3' }}>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <ImageIcon className="h-14 w-14 text-[var(--muted-foreground)] opacity-30" />
          <p className="text-sm text-[var(--muted-foreground)]">Henüz fotoğraf eklenmemiş</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ── Main image container ── */}
      <div className="space-y-2">
        {/* Fixed 4:3 aspect ratio — image always fills, never white gaps */}
        <div
          className="group relative w-full overflow-hidden rounded-xl border border-[var(--border)] bg-gray-900 cursor-pointer"
          style={{ aspectRatio: '4/3' }}
          onClick={() => setLightboxOpen(true)}
        >
          <img
            src={currentSrc}
            alt={title}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            draggable={false}
          />

          {/* Listing ID — CSS pill, always visible regardless of wmImages load state */}
          {listingNumber && (
            <div className="absolute top-3 left-3 z-10 rounded-full bg-black/55 px-3 py-1 select-none"
              style={{ backdropFilter: 'blur(4px)' }}>
              <span className="text-white font-semibold text-xs tracking-wide">#{listingNumber}</span>
            </div>
          )}

          {/* Image counter — bottom left */}
          <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 rounded-lg bg-black/60 backdrop-blur-sm px-3 py-1.5 text-white text-xs font-medium select-none">
            <ImageIcon className="h-3.5 w-3.5" />
            {selectedIdx + 1} / {images.length}
          </div>

          {/* Expand hint — bottom right */}
          <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5 rounded-lg bg-black/60 backdrop-blur-sm px-3 py-1.5 text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity select-none">
            <Maximize2 className="h-3.5 w-3.5" />
            Büyük Fotoğraf
          </div>

          {/* Prev/Next arrow buttons on hover */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); goPrev(); }}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 hover:bg-black/70 transition-all"
                aria-label="Önceki fotoğraf"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); goNext(); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 hover:bg-black/70 transition-all"
                aria-label="Sonraki fotoğraf"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {images.map((img, idx) => {
              const thumbSrc = wmImages[idx] || resolveImageUrl(img);
              const isSelected = idx === selectedIdx;
              return (
                <button
                  key={img.id}
                  onClick={() => setSelectedIdx(idx)}
                  className={`relative shrink-0 h-16 w-24 rounded-lg overflow-hidden border-2 transition-all duration-150 ${
                    isSelected
                      ? 'border-[var(--brand)] shadow-md ring-2 ring-[var(--brand)]/20'
                      : 'border-[var(--border)] opacity-60 hover:opacity-100 hover:border-[var(--brand)]/40'
                  }`}
                  aria-label={`Fotoğraf ${idx + 1}`}
                >
                  <img
                    src={thumbSrc}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                    draggable={false}
                  />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Lightbox — bokeh background ── */}
      {lightboxOpen && (
        <div
          id="parcel-lightbox"
          className="fixed inset-0 z-[100] flex flex-col print:hidden select-none overflow-hidden"
          onContextMenu={(e) => e.preventDefault()}
        >
          {/* Bokeh background: same image, heavily blurred + dark overlay */}
          <div className="absolute inset-0 z-0">
            <img
              src={currentSrc}
              alt=""
              className="h-full w-full object-cover scale-110"
              style={{ filter: 'blur(24px)', transform: 'scale(1.15)' }}
              draggable={false}
            />
            <div className="absolute inset-0 bg-black/40" />
          </div>

          {/* Header */}
          <div className="relative z-10 flex items-center justify-between px-5 py-3 shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-white/80 truncate max-w-[50vw]" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>{title}</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  const el = document.getElementById('parcel-lightbox');
                  if (!el) return;
                  if (document.fullscreenElement) document.exitFullscreen();
                  else el.requestFullscreen().catch(() => {});
                }}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all backdrop-blur-sm"
              >
                <Maximize2 className="h-4 w-4" />
                <span className="hidden sm:inline">Tam Ekran</span>
              </button>
              <button
                onClick={() => setLightboxOpen(false)}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all backdrop-blur-sm"
              >
                <X className="h-4 w-4" />
                <span className="hidden sm:inline">Kapat</span>
              </button>
            </div>
          </div>

          {/* Main image — fills available space */}
          <div className="relative z-10 flex flex-1 min-h-0 items-center justify-center px-14 py-3">
            {images.length > 1 && (
              <button
                onClick={goPrev}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 transition-all"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            )}

            <img
              src={currentSrc}
              alt={title}
              className="rounded-xl object-contain"
              draggable={false}
              style={{
                userSelect: 'none',
                maxWidth: '100%',
                maxHeight: 'calc(100vh - 140px)',
                width: 'auto',
                height: 'auto',
                boxShadow: '0 12px 48px rgba(0,0,0,0.6)',
              }}
            />

            {images.length > 1 && (
              <button
                onClick={goNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 transition-all"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            )}
          </div>

          {/* Footer: counter + thumbnails */}
          <div className="relative z-10 shrink-0 px-4 py-3 space-y-2">
            <p className="text-center text-xs text-white/50">
              <span className="font-semibold text-white/80">{selectedIdx + 1}</span>
              <span className="mx-1">/</span>
              {images.length}
            </p>
            {images.length > 1 && (
              <div className="flex justify-center gap-1.5 overflow-x-auto">
                {images.map((img, idx) => {
                  const thumbSrc = wmImages[idx] || resolveImageUrl(img);
                  return (
                    <button
                      key={img.id}
                      onClick={() => setSelectedIdx(idx)}
                      className={`shrink-0 h-11 w-16 rounded-md overflow-hidden border-2 transition-all ${
                        idx === selectedIdx
                          ? 'border-white/90 opacity-100 shadow-md'
                          : 'border-white/20 opacity-40 hover:opacity-75'
                      }`}
                    >
                      <img src={thumbSrc} alt="" className="h-full w-full object-cover" loading="lazy" draggable={false} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
