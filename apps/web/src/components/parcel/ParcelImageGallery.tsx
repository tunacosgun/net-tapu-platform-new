'use client';

import { useEffect, useCallback, useState } from 'react';
import { ChevronLeft, ChevronRight, X, Maximize2, ImageIcon } from 'lucide-react';
import type { ParcelImage } from '@/types';
import { resolveImageUrl } from '@/lib/format';

interface ParcelImageGalleryProps {
  images: ParcelImage[];
  /** Pre-processed watermarked data-URLs keyed by index */
  wmImages: Record<number, string>;
  /** The display title of the parcel */
  title: string;
  /** Listing ID label (e.g. "NT-XXXX") shown as overlay */
  listingId?: string;
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
export function ParcelImageGallery({ images, wmImages, title, listingId }: ParcelImageGalleryProps) {
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

          {/* Listing ID overlay — top left, scales with container */}
          {listingId && (
            <div className="absolute top-3 left-3 z-10 flex items-center rounded-md bg-black/60 backdrop-blur-sm px-2.5 py-1 text-[11px] font-mono font-semibold text-white/90 select-none">
              {listingId}
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

      {/* ── Lightbox ── */}
      {lightboxOpen && (
        <div
          id="parcel-lightbox"
          className="fixed inset-0 z-[100] flex flex-col bg-black/95 print:hidden select-none"
          onContextMenu={(e) => e.preventDefault()}
        >
          {/* Header */}
          <div className="relative flex items-center justify-between px-5 py-3 shrink-0 border-b border-white/10">
            <div className="flex items-center gap-3">
              {listingId && (
                <span className="rounded-md bg-white/10 px-2.5 py-1 text-xs font-mono font-semibold text-white/80">
                  {listingId}
                </span>
              )}
              <span className="text-sm font-medium text-white/80 truncate max-w-[50vw]">{title}</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  const el = document.getElementById('parcel-lightbox');
                  if (!el) return;
                  if (document.fullscreenElement) document.exitFullscreen();
                  else el.requestFullscreen().catch(() => {});
                }}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white/60 hover:text-white hover:bg-white/10 transition-all"
              >
                <Maximize2 className="h-4 w-4" />
                <span className="hidden sm:inline">Tam Ekran</span>
              </button>
              <button
                onClick={() => setLightboxOpen(false)}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white/60 hover:text-white hover:bg-white/10 transition-all"
              >
                <X className="h-4 w-4" />
                <span className="hidden sm:inline">Kapat</span>
              </button>
            </div>
          </div>

          {/* Image area — object-contain so full image visible, dark bg, no crop */}
          <div className="relative flex flex-1 min-h-0 items-center justify-center px-16 py-4">
            {images.length > 1 && (
              <button
                onClick={goPrev}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-all"
              >
                <ChevronLeft className="h-7 w-7" />
              </button>
            )}

            <div className="relative flex h-full w-full items-center justify-center">
              <img
                src={currentSrc}
                alt={title}
                className="max-h-full max-w-full object-contain"
                draggable={false}
                style={{ userSelect: 'none' }}
              />
              {/* Listing ID overlay — always visible in lightbox too */}
              {listingId && (
                <div className="absolute top-3 left-3 flex items-center rounded-md bg-black/60 backdrop-blur-sm px-2.5 py-1 text-[11px] font-mono font-semibold text-white/90">
                  {listingId}
                </div>
              )}
            </div>

            {images.length > 1 && (
              <button
                onClick={goNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-all"
              >
                <ChevronRight className="h-7 w-7" />
              </button>
            )}
          </div>

          {/* Footer: counter + thumbnails strip */}
          <div className="shrink-0 border-t border-white/10 px-4 py-3 space-y-2">
            <p className="text-center text-sm text-white/50">
              <span className="font-bold text-white">{selectedIdx + 1}</span> / {images.length}
            </p>
            {images.length > 1 && (
              <div className="flex justify-center gap-1.5 overflow-x-auto">
                {images.map((img, idx) => {
                  const thumbSrc = wmImages[idx] || resolveImageUrl(img);
                  return (
                    <button
                      key={img.id}
                      onClick={() => setSelectedIdx(idx)}
                      className={`shrink-0 h-12 w-16 rounded overflow-hidden border-2 transition-all ${
                        idx === selectedIdx ? 'border-white opacity-100' : 'border-white/20 opacity-40 hover:opacity-80'
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
