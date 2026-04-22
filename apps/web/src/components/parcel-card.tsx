'use client';

import Link from 'next/link';
import { useState, useCallback } from 'react';
import { Badge, parcelStatusConfig } from '@/components/ui/badge';
import { formatPrice, resolveImageUrl, timeAgo } from '@/lib/format';
import { useAuthStore } from '@/stores/auth-store';
import apiClient from '@/lib/api-client';
import { MapPin, Maximize2, Heart, Flame, Clock, ImageIcon, FileCheck } from 'lucide-react';
import type { Parcel } from '@/types';

interface ParcelCardProps {
  parcel: Parcel;
  showFavorite?: boolean;
  favoriteId?: string | null;
  onFavoriteChange?: (parcelId: string, isFavorited: boolean) => void;
  variant?: 'default' | 'compact' | 'horizontal';
}

/**
 * NetTapu Parcel Card — professional, information-dense design.
 * Inspired by sahibinden.com: clear hierarchy, sharp corners, tabular numbers.
 */
export function ParcelCard({
  parcel,
  showFavorite = true,
  favoriteId: initialFavoriteId = null,
  onFavoriteChange,
  variant = 'default',
}: ParcelCardProps) {
  const { isAuthenticated } = useAuthStore();
  const [favId, setFavId] = useState<string | null>(initialFavoriteId);
  const [toggling, setToggling] = useState(false);
  const isFavorited = !!favId;

  const status = parcelStatusConfig(parcel.status);

  const toggleFavorite = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isAuthenticated || toggling) return;

      setToggling(true);
      try {
        if (isFavorited && favId) {
          await apiClient.delete(`/favorites/${favId}`);
          setFavId(null);
          onFavoriteChange?.(parcel.id, false);
        } else {
          const { data } = await apiClient.post<{ id: string }>('/favorites', { parcelId: parcel.id });
          setFavId(data.id);
          onFavoriteChange?.(parcel.id, true);
        }
      } catch {
        // silently fail
      } finally {
        setToggling(false);
      }
    },
    [isAuthenticated, toggling, isFavorited, favId, parcel.id, onFavoriteChange],
  );

  const firstImg = parcel.images?.[0];
  const imageUrl = firstImg ? resolveImageUrl(firstImg) : null;

  // ═══ Horizontal variant ═══
  if (variant === 'horizontal') {
    return (
      <Link
        href={`/parcels/${parcel.id}`}
        className="group flex gap-4 rounded-md border border-slate-200 bg-white p-3 hover:border-brand-300 hover:shadow-md transition-all"
        data-testid={`parcel-card-horizontal-${parcel.id}`}
      >
        <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-sm bg-slate-100">
          {imageUrl ? (
            <img src={imageUrl} alt={parcel.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-slate-100">
              <ImageIcon className="h-6 w-6 text-slate-300" />
            </div>
          )}
          <span className={`absolute top-1.5 left-1.5 badge badge-${status.variant} text-[9px]`}>
            {status.label}
          </span>
        </div>
        <div className="flex flex-1 flex-col justify-between min-w-0">
          <div>
            <h3 className="font-heading text-[15px] font-bold text-ink-900 truncate group-hover:text-brand-700 transition-colors">
              {parcel.title}
            </h3>
            <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
              <MapPin className="h-3 w-3 text-brand-600" />
              {parcel.city}, {parcel.district}
            </p>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-heading text-lg font-extrabold text-brand-700 tracking-tight tabular-nums">
              {formatPrice(parcel.price)}
            </span>
            {parcel.areaM2 && (
              <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-sm tabular-nums">
                {Number(parcel.areaM2).toLocaleString('tr-TR')} m²
              </span>
            )}
          </div>
        </div>
      </Link>
    );
  }

  // ═══ Compact variant ═══
  if (variant === 'compact') {
    return (
      <Link
        href={`/parcels/${parcel.id}`}
        className="group rounded-md border border-slate-200 bg-white p-4 hover:border-brand-300 hover:shadow-md transition-all"
        data-testid={`parcel-card-compact-${parcel.id}`}
      >
        <div className="flex items-center justify-between gap-2">
          <h3 className="truncate text-sm font-bold text-ink-900 group-hover:text-brand-700 transition-colors">
            {parcel.title}
          </h3>
          <Badge variant={status.variant} className="shrink-0 text-[9px]">
            {status.label}
          </Badge>
        </div>
        <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
          <MapPin className="h-3 w-3 text-brand-600" />
          {parcel.city}, {parcel.district}
        </p>
        <div className="mt-3 flex items-center justify-between">
          <span className="font-heading text-base font-extrabold text-brand-700 tracking-tight tabular-nums">
            {formatPrice(parcel.price)}
          </span>
          {parcel.areaM2 && (
            <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-sm tabular-nums">
              {Number(parcel.areaM2).toLocaleString('tr-TR')} m²
            </span>
          )}
        </div>
      </Link>
    );
  }

  // ═══ Default — dense sahibinden-style card ═══
  return (
    <Link
      href={`/parcels/${parcel.id}`}
      className="group relative flex flex-col overflow-hidden rounded-md border border-slate-200 bg-white hover:border-brand-400 hover:shadow-lg transition-all"
      data-testid={`parcel-card-${parcel.id}`}
    >
      {/* Image */}
      <div className="relative aspect-[5/3] overflow-hidden bg-slate-100">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={parcel.title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-100">
            <ImageIcon className="h-10 w-10 text-slate-300" />
          </div>
        )}

        {/* Top-left status badge */}
        <Badge variant={status.variant} className="absolute top-3 left-3 shadow-sm">
          {status.label}
        </Badge>

        {/* Auction/featured flag */}
        {parcel.isAuctionEligible && (
          <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-sm bg-red-600 text-white text-[10px] font-bold px-2 py-1 uppercase tracking-wider shadow-md">
            <Flame className="h-3 w-3" />
            Açık Artırma
          </span>
        )}
        {parcel.isFeatured && !parcel.isAuctionEligible && (
          <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-sm bg-gold-500 text-white text-[10px] font-bold px-2 py-1 uppercase tracking-wider shadow-md">
            <FileCheck className="h-3 w-3" />
            Öne Çıkan
          </span>
        )}

        {/* Bottom overlay with quick meta */}
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 px-3 py-2 bg-gradient-to-t from-black/60 via-black/30 to-transparent">
          {parcel.areaM2 && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-white tabular-nums">
              <Maximize2 className="h-3 w-3" />
              {Number(parcel.areaM2).toLocaleString('tr-TR')} m²
            </span>
          )}
          {parcel.createdAt && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-white/80">
              <Clock className="h-3 w-3" />
              {timeAgo(parcel.createdAt)}
            </span>
          )}
        </div>

        {/* Favorite */}
        {showFavorite && isAuthenticated && (
          <button
            onClick={toggleFavorite}
            disabled={toggling}
            className={`absolute top-3 right-3 group-hover:opacity-100 opacity-90 flex h-8 w-8 items-center justify-center rounded-full shadow-md transition-all active:scale-90 ${
              isFavorited
                ? 'bg-red-500 text-white'
                : 'bg-white/95 backdrop-blur-sm text-slate-500 hover:text-red-500'
            } ${parcel.isAuctionEligible || parcel.isFeatured ? 'mt-8' : ''}`}
            aria-label={isFavorited ? 'Favorilerden kaldır' : 'Favorilere ekle'}
            data-testid={`favorite-btn-${parcel.id}`}
          >
            <Heart className="h-4 w-4" fill={isFavorited ? 'currentColor' : 'none'} />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-heading text-[15px] font-bold leading-tight text-ink-900 group-hover:text-brand-700 transition-colors line-clamp-2 mb-2 min-h-[40px]">
          {parcel.title}
        </h3>

        <p className="flex items-center gap-1.5 text-xs text-slate-600 font-medium mb-3">
          <MapPin className="h-3.5 w-3.5 text-brand-600 shrink-0" />
          <span className="truncate">{parcel.city}{parcel.district ? `, ${parcel.district}` : ''}</span>
        </p>

        {/* Meta pills */}
        {(parcel.zoningStatus || parcel.ada) && (
          <div className="flex items-center gap-1.5 flex-wrap mb-3">
            {parcel.zoningStatus && (
              <span className="inline-flex items-center rounded-sm bg-brand-50 border border-brand-200 px-2 py-0.5 text-[10px] font-bold text-brand-700 uppercase tracking-wide truncate max-w-[140px]">
                {parcel.zoningStatus}
              </span>
            )}
            {parcel.ada && parcel.parsel && (
              <span className="inline-flex items-center rounded-sm bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 tabular-nums">
                Ada {parcel.ada} / Parsel {parcel.parsel}
              </span>
            )}
          </div>
        )}

        {/* Price footer */}
        <div className="mt-auto pt-3 border-t border-slate-100">
          <div className="flex items-end justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-tight mb-0.5">Fiyat</p>
              <span className="font-heading text-xl font-extrabold text-brand-700 tracking-tight tabular-nums leading-tight block">
                {formatPrice(parcel.price)}
              </span>
            </div>
            {(parcel.pricePerM2 || (parcel.areaM2 && parcel.price)) && (
              <span className="text-[10px] font-bold text-brand-700 bg-brand-50 border border-brand-200 px-2 py-1 rounded-sm tabular-nums whitespace-nowrap">
                {formatPrice(parcel.pricePerM2 ?? String(Math.round(parseFloat(parcel.price!) / parseFloat(parcel.areaM2!))))}
                /m²
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
