'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import apiClient from '@/lib/api-client';
import { formatPrice, resolveImageUrl } from '@/lib/format';
import { Pagination, Alert, EmptyState, LoadingState } from '@/components/ui';
import { Gavel, Clock, TrendingUp, Users, Eye, Timer, Zap, ArrowRight, CheckCircle2, MapPin } from 'lucide-react';
import type { Auction, PaginatedResponse } from '@/types';

const statusConfig: Record<string, { label: string; classes: string; dotClasses: string; textClasses: string }> = {
  live:         { label: 'Canlı',          classes: 'bg-red-50 text-red-700 border-red-200',         dotClasses: 'bg-red-500',   textClasses: 'text-red-600' },
  ending:       { label: 'Bitiyor',        classes: 'bg-amber-50 text-amber-700 border-amber-200',   dotClasses: 'bg-amber-500', textClasses: 'text-amber-600' },
  scheduled:    { label: 'Planlandı',      classes: 'bg-brand-50 text-brand-700 border-brand-200',   dotClasses: 'bg-brand-500', textClasses: 'text-brand-600' },
  deposit_open: { label: 'Depozito Açık',  classes: 'bg-gold-50 text-gold-700 border-gold-200',      dotClasses: 'bg-gold-500',  textClasses: 'text-gold-700' },
  ended:        { label: 'Bitti',          classes: 'bg-slate-100 text-slate-600 border-slate-200',  dotClasses: 'bg-slate-400', textClasses: 'text-slate-500' },
  settling:     { label: 'Sonuçlanıyor',   classes: 'bg-slate-100 text-slate-600 border-slate-200',  dotClasses: 'bg-slate-400', textClasses: 'text-slate-500' },
  settled:      { label: 'Sonuçlandı',     classes: 'bg-slate-100 text-slate-600 border-slate-200',  dotClasses: 'bg-slate-400', textClasses: 'text-slate-500' },
};

function timeUntil(dateStr: string): string {
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff <= 0) return 'Süre doldu';
  const hours = Math.floor(diff / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  if (hours > 24) return `${Math.floor(hours / 24)} gün ${hours % 24} saat`;
  if (hours > 0) return `${hours}s ${minutes}dk`;
  return `${minutes} dk`;
}

export default function AuctionsPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <AuctionsContent />
    </Suspense>
  );
}

const filterTabs = [
  { key: 'all',          label: 'Tümü',          icon: Gavel },
  { key: 'live',         label: 'Canlı',         icon: Zap,        highlight: true },
  { key: 'scheduled',    label: 'Planlandı',     icon: Timer },
  { key: 'deposit_open', label: 'Depozito Açık', icon: CheckCircle2 },
  { key: 'ended',        label: 'Sona Erdi',     icon: Clock },
];

function AuctionsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const rawPage = searchParams.get('page');
  const page = rawPage && /^\d+$/.test(rawPage) ? Number(rawPage) : 1;
  const statusFilter = searchParams.get('status') || 'all';

  const [data, setData] = useState<PaginatedResponse<Auction> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAuctions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, any> = { page, limit: 12 };
      if (statusFilter !== 'all') params.status = statusFilter;
      const { data: res } = await apiClient.get<PaginatedResponse<Auction>>('/auctions', { params });
      setData(res);
    } catch {
      setError('Açık artırmalar yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { fetchAuctions(); }, [fetchAuctions]);

  function setFilter(key: string) {
    const params = new URLSearchParams();
    if (key !== 'all') params.set('status', key);
    params.set('page', '1');
    router.push(`/auctions?${params.toString()}`);
  }

  function goToPage(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(p));
    router.push(`/auctions?${params.toString()}`);
  }

  const liveCount = data?.data.filter(a => a.status === 'live' || a.status === 'ending').length || 0;

  return (
    <div className="min-h-screen bg-white -mx-4 -my-6">
      {/* Page header banner */}
      <div className="relative overflow-hidden bg-gradient-olive">
        <div className="absolute inset-0 opacity-[0.08]" style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.9) 1.2px, transparent 1.2px)',
          backgroundSize: '24px 24px',
        }} />
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-brand-400/20 blur-3xl" />
        <div className="relative mx-auto max-w-[1280px] px-4 sm:px-6 py-12">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm">
                  <Gavel className="h-3 w-3 text-gold-300" />
                  <span className="text-[10px] font-bold text-white/90 uppercase tracking-widest">Canlı Açık Artırma</span>
                </span>
                {liveCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600 shadow-sm">
                    <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                    <span className="text-[10px] font-bold text-white uppercase tracking-widest">{liveCount} Canlı</span>
                  </span>
                )}
              </div>
              <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-white tracking-[-0.02em] leading-tight">
                Açık Artırmalar
              </h1>
              <p className="mt-2 text-brand-100/95 max-w-xl text-[15px]">
                Canlı ve yaklaşan açık artırmaları inceleyin, gerçek zamanlı teklif vererek arsalara sahip olun.
              </p>
            </div>
            <Link
              href="/how-it-works"
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2.5 rounded-md bg-white/10 border border-white/20 text-white text-sm font-bold hover:bg-white/20 transition-colors backdrop-blur-sm"
            >
              İhale Kuralları
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 py-8">
        {/* Filter tabs */}
        <div className="flex gap-2 mb-7 overflow-x-auto pb-1 -mx-1 px-1">
          {filterTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`shrink-0 inline-flex items-center gap-1.5 rounded-md px-4 py-2.5 text-sm font-bold transition-all ${
                  isActive
                    ? 'bg-brand-700 text-white shadow-brand'
                    : 'bg-white border border-slate-200 text-ink-700 hover:border-brand-300 hover:text-brand-700'
                }`}
                data-testid={`filter-${tab.key}`}
              >
                <Icon className={`h-3.5 w-3.5 ${tab.highlight && !isActive ? 'text-red-500' : ''}`} />
                {tab.label}
                {tab.highlight && !isActive && liveCount > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold tabular-nums">
                    {liveCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {loading && <LoadingState />}
        {error && <Alert className="mt-4">{error}</Alert>}

        {!loading && data && (
          <>
            {data.data.length === 0 ? (
              <EmptyState message="Aktif açık artırma bulunamadı." />
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {data.data.map((auction) => {
                  const sc = statusConfig[auction.status] || statusConfig.ended;
                  const isLive = auction.status === 'live' || auction.status === 'ending';

                  return (
                    <Link
                      key={auction.id}
                      href={`/auctions/${auction.id}`}
                      className={`group flex flex-col rounded-md border overflow-hidden bg-white transition-all hover:shadow-lg ${
                        isLive ? 'border-red-200 hover:border-red-400' : 'border-slate-200 hover:border-brand-400'
                      }`}
                      data-testid={`auction-card-${auction.id}`}
                    >
                      {/* Cover */}
                      {(() => {
                        const coverImg = (auction as any).parcel?.images?.[0];
                        const imgUrl = coverImg ? resolveImageUrl(coverImg) : null;
                        return (
                          <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                            {imgUrl ? (
                              <Image
                                src={imgUrl}
                                alt={auction.title}
                                fill
                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                                <Gavel className="h-12 w-12 text-slate-300" />
                              </div>
                            )}
                            {isLive && (
                              <span className="absolute top-3 right-3 inline-flex items-center gap-1.5 bg-red-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-sm shadow-md uppercase tracking-wider">
                                <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                                Canlı
                              </span>
                            )}
                            {(auction as any).parcel?.city && (
                              <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 bg-black/60 backdrop-blur-sm text-white text-[11px] font-semibold px-2.5 py-1 rounded-sm">
                                <MapPin className="h-3 w-3" />
                                {(auction as any).parcel.city}
                              </span>
                            )}
                          </div>
                        );
                      })()}

                      {/* Body */}
                      <div className="flex flex-col flex-1 p-5">
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className={`inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${sc.classes}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${sc.dotClasses} ${isLive ? 'animate-pulse' : ''}`} />
                            {sc.label}
                          </span>
                          {auction.status === 'live' && auction.scheduledEnd && (
                            <span className="text-xs font-bold text-red-600 tabular-nums flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {timeUntil(auction.extendedUntil || auction.scheduledEnd)}
                            </span>
                          )}
                          {auction.status === 'scheduled' && (
                            <span className="text-xs font-bold text-brand-700 tabular-nums flex items-center gap-1">
                              <Timer className="h-3 w-3" />
                              {timeUntil(auction.scheduledStart)}
                            </span>
                          )}
                        </div>

                        <h2 className="font-heading font-bold text-ink-900 text-[15px] line-clamp-2 leading-snug group-hover:text-brand-700 transition-colors mb-4 min-h-[42px]">
                          {auction.title}
                        </h2>

                        {/* Price block */}
                        <div className="rounded-md bg-gradient-olive-soft border border-brand-100 p-3.5 mb-3">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-brand-700 mb-0.5">
                            {auction.currentPrice ? 'Güncel Fiyat' : 'Başlangıç Fiyatı'}
                          </p>
                          <p className="font-heading text-2xl font-extrabold text-brand-800 tabular-nums tracking-tight">
                            {formatPrice(auction.currentPrice || auction.startingPrice)}
                          </p>
                        </div>

                        {/* Meta row */}
                        <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Min. Artış</p>
                            <p className="font-bold text-ink-800 tabular-nums">{formatPrice(auction.minimumIncrement)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Depozito</p>
                            <p className="font-bold text-ink-800 tabular-nums">{formatPrice(auction.requiredDeposit)}</p>
                          </div>
                        </div>

                        {/* Stats strip */}
                        <div className="mt-auto flex items-center justify-between gap-2 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
                          <span className="flex items-center gap-1 font-semibold">
                            <Users className="h-3.5 w-3.5 text-brand-600" />
                            <span className="tabular-nums">{auction.participantCount}</span> kat.
                          </span>
                          <span className="flex items-center gap-1 font-semibold">
                            <TrendingUp className="h-3.5 w-3.5 text-brand-600" />
                            <span className="tabular-nums">{auction.bidCount}</span> teklif
                          </span>
                          <span className="flex items-center gap-1 font-semibold">
                            <Eye className="h-3.5 w-3.5 text-brand-600" />
                            <span className="tabular-nums">{auction.watcherCount}</span> izl.
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            <Pagination page={page} totalPages={data.meta.totalPages} onPageChange={goToPage} />
          </>
        )}
      </div>
    </div>
  );
}
