'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import apiClient from '@/lib/api-client';
import { formatPrice } from '@/lib/format';
import { useSiteSettings } from '@/hooks/use-site-settings';
import { usePageContent } from '@/hooks/use-page-content';
import { ParcelCard } from '@/components/parcel-card';
import { TurkeyParcelMap } from '@/components/turkey-parcel-map';
import { VideoPopup } from '@/components/video-popup';
import {
  Search, ArrowRight, MapPin, Shield, Lock, Headphones, Scale,
  Users, Gavel, Building2, TrendingUp,
  Timer, CheckCircle2, Award, X, History, Clock,
  Home as HomeIcon, Trees, Landmark, Factory, Star, Zap, FileCheck,
} from 'lucide-react';
import { useRecentSearches } from '@/hooks/use-recent-searches';
import type { Parcel, Auction, PaginatedResponse, Reference } from '@/types';

// Turkish cities + popular districts for autocomplete
const LOCATION_SUGGESTIONS = [
  'Adana', 'Adıyaman', 'Afyonkarahisar', 'Ağrı', 'Amasya', 'Ankara', 'Antalya', 'Artvin',
  'Aydın', 'Balıkesir', 'Bilecik', 'Bingöl', 'Bitlis', 'Bolu', 'Burdur', 'Bursa',
  'Çanakkale', 'Çankırı', 'Çorum', 'Denizli', 'Diyarbakır', 'Edirne', 'Elazığ',
  'Erzincan', 'Erzurum', 'Eskişehir', 'Gaziantep', 'Giresun', 'Gümüşhane', 'Hakkari',
  'Hatay', 'Isparta', 'İçel (Mersin)', 'İstanbul', 'İzmir', 'Kars', 'Kastamonu',
  'Kayseri', 'Kırklareli', 'Kırşehir', 'Kocaeli', 'Konya', 'Kütahya', 'Malatya',
  'Manisa', 'Kahramanmaraş', 'Mardin', 'Muğla', 'Muş', 'Nevşehir', 'Niğde',
  'Ordu', 'Rize', 'Sakarya', 'Samsun', 'Siirt', 'Sinop', 'Sivas', 'Tekirdağ',
  'Tokat', 'Trabzon', 'Tunceli', 'Şanlıurfa', 'Uşak', 'Van', 'Yozgat', 'Zonguldak',
  'Aksaray', 'Bayburt', 'Karaman', 'Kırıkkale', 'Batman', 'Şırnak', 'Bartın', 'Ardahan',
  'Iğdır', 'Yalova', 'Karabük', 'Kilis', 'Osmaniye', 'Düzce',
  'Belek', 'Kemer', 'Alanya', 'Side', 'Manavgat', 'Kuşadası', 'Bodrum', 'Marmaris',
  'Fethiye', 'Göcek', 'Dalaman', 'Didim', 'Çeşme', 'Alaçatı', 'Sapanca', 'Abant',
];

const ParcelMapLazy = dynamic(() => import('@/components/parcel-map-inner'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[400px] items-center justify-center bg-slate-50 rounded-md border border-slate-200">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-brand-600" />
        <span className="text-sm text-slate-500 font-semibold">Harita yükleniyor...</span>
      </div>
    </div>
  ),
});

// Category quick-access chips
const CATEGORIES = [
  { label: 'Tüm Arsalar',      href: '/parcels',                       icon: Trees,    desc: 'Tümünü gör' },
  { label: 'Konut İmarlı',     href: '/parcels?zoning=konut',          icon: HomeIcon, desc: 'Konut arsaları' },
  { label: 'Ticari İmarlı',    href: '/parcels?zoning=ticari',         icon: Landmark, desc: 'Ticari alanlar' },
  { label: 'Sanayi',           href: '/parcels?zoning=sanayi',         icon: Factory,  desc: 'Sanayi arsaları' },
  { label: 'Tarla',            href: '/parcels?zoning=tarla',          icon: Trees,    desc: 'Tarım arazileri' },
  { label: 'Canlı İhaleler',   href: '/auctions?status=live',          icon: Gavel,    desc: 'Şu an açık', live: true },
];

export default function HomePage() {
  const router = useRouter();
  const siteSettings = useSiteSettings();
  // Editable from admin → Settings → Sayfalar → "homepage" → hero_title / hero_subtitle / hero_description
  const homeContent = usePageContent('homepage_content', {
    hero_title: "Türkiye'nin dört bir yanında",
    hero_title_accent: 'güvenli arsa yatırımı.',
    hero_description:
      "Harita üzerinde doğrulanmış parseller, canlı açık artırmalar ve şeffaf ödeme süreciyle NetTapu — arsa ve gayrimenkul yatırımında Türkiye'nin güvenilir dijital adresidir.",
  });
  const [featuredParcels, setFeaturedParcels] = useState<Parcel[]>([]);
  const [latestParcels, setLatestParcels] = useState<Parcel[]>([]);
  const [activeAuctions, setActiveAuctions] = useState<Auction[]>([]);
  const [stats, setStats] = useState({ parcels: 0, auctions: 0, cities: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [showVideo, setShowVideo] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const searchBoxRef = useRef<HTMLDivElement>(null);
  const { searches: recentSearches, save: saveSearch, remove: removeSearchItem, clear: clearSearches } = useRecentSearches();

  const locationMatches = searchQuery.trim().length >= 1
    ? LOCATION_SUGGESTIONS.filter((s) =>
        s.toLocaleLowerCase('tr').includes(searchQuery.toLocaleLowerCase('tr'))
      ).slice(0, 5)
    : [];
  const filteredRecent = searchQuery.trim().length >= 1
    ? recentSearches.filter((s) => s.toLocaleLowerCase('tr').includes(searchQuery.toLocaleLowerCase('tr')))
    : recentSearches;
  const showDropdown = searchFocused && (filteredRecent.length > 0 || locationMatches.length > 0);
  const [testimonials, setTestimonials] = useState<Reference[]>([]);

  useEffect(() => {
    apiClient.get<PaginatedResponse<Parcel>>('/parcels', {
      params: { isFeatured: true, limit: 6, status: 'active' }
    }).then(({ data }) => setFeaturedParcels(data.data)).catch(() => {});

    apiClient.get<PaginatedResponse<Parcel>>('/parcels', {
      params: { limit: 8, sortBy: 'createdAt', sortOrder: 'DESC', status: 'active' }
    }).then(({ data }) => {
      setLatestParcels(data.data);
      setStats((s) => ({ ...s, parcels: data.meta.total }));
    }).catch(() => {});

    apiClient.get<PaginatedResponse<Parcel>>('/parcels', {
      params: { limit: 100, status: 'active' }
    }).then(({ data }) => {
      const cities = new Set(data.data.map((p) => p.city).filter(Boolean));
      setStats((s) => ({ ...s, cities: cities.size }));
    }).catch(() => {});

    apiClient.get<Reference[]>('/content/references')
      .then(({ data }) => setTestimonials(data.filter((r) => r.referenceType === 'testimonial').slice(0, 6)))
      .catch(() => {});

    Promise.all([
      apiClient.get<PaginatedResponse<Auction>>('/auctions', { params: { limit: 3, status: 'live' } }).catch(() => ({ data: { data: [], meta: { total: 0 } } })),
      apiClient.get<PaginatedResponse<Auction>>('/auctions', { params: { limit: 3, status: 'scheduled' } }).catch(() => ({ data: { data: [], meta: { total: 0 } } })),
      apiClient.get<PaginatedResponse<Auction>>('/auctions', { params: { limit: 1, status: 'deposit_open' } }).catch(() => ({ data: { data: [], meta: { total: 0 } } })),
    ]).then(([liveRes, schedRes, depositRes]) => {
      const combined = [...liveRes.data.data, ...schedRes.data.data].slice(0, 3);
      setActiveAuctions(combined);
      setStats((s) => ({ ...s, auctions: liveRes.data.meta.total + schedRes.data.meta.total + depositRes.data.meta.total }));
    });
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      saveSearch(q);
      setSearchFocused(false);
      router.push(`/parcels?search=${encodeURIComponent(q)}`);
    }
  }

  function handleRecentClick(q: string) {
    setSearchFocused(false);
    saveSearch(q);
    router.push(`/parcels?search=${encodeURIComponent(q)}`);
  }

  function removeRecent(q: string, e: React.MouseEvent) {
    e.stopPropagation();
    removeSearchItem(q);
  }

  return (
    <main className="bg-white">

      {/* ═══════════════════════════════════════════════════════════════
          HERO — Professional olive backdrop with strong search CTA
          ═══════════════════════════════════════════════════════════════ */}
      <section className="relative bg-gradient-olive overflow-hidden">
        {/* Subtle dotted texture */}
        <div className="absolute inset-0 opacity-[0.08]" style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.8) 1.2px, transparent 1.2px)',
          backgroundSize: '24px 24px',
        }} />
        {/* Soft top glow */}
        <div className="absolute -top-32 -right-32 w-[520px] h-[520px] rounded-full bg-brand-400/25 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[520px] h-[520px] rounded-full bg-brand-800/40 blur-3xl" />

        <div className="relative mx-auto max-w-[1280px] px-4 sm:px-6 pt-14 pb-20 lg:pt-20 lg:pb-28">
          <div className="max-w-3xl mx-auto text-center">
            {/* Trust badge */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm mb-8"
              data-testid="hero-badge"
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-gold-300" />
              <span className="text-[11px] font-bold text-white/95 uppercase tracking-widest">
                Tapu Güvenceli · KVKK Uyumlu · SSL
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="font-heading text-[36px] sm:text-[52px] lg:text-[64px] font-extrabold text-white tracking-[-0.03em] leading-[1.02] mb-5"
              data-testid="hero-headline"
            >
              {homeContent.hero_title}
              <br />
              <span className="text-gold-300">{homeContent.hero_title_accent}</span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-[15px] sm:text-[17px] text-brand-100/95 leading-relaxed max-w-2xl mx-auto mb-9"
              data-testid="hero-description"
            >
              {homeContent.hero_description}
            </motion.p>

            {/* Search card (sahibinden-style prominent) */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              ref={searchBoxRef}
              className="relative"
            >
              <form onSubmit={handleSearch} data-testid="hero-search-form">
                <div className="flex items-stretch bg-white rounded-md shadow-premium p-1.5">
                  <div className="flex items-center pl-3 pr-1 text-slate-400">
                    <Search className="h-5 w-5" />
                  </div>
                  <input
                    type="text"
                    placeholder="Örn: Antalya Belek, Muğla Bodrum, ilan no..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setTimeout(() => setSearchFocused(false), 180)}
                    className="flex-1 px-3 py-3.5 bg-transparent text-ink-900 placeholder:text-slate-400 text-[15px] font-medium focus:outline-none"
                    data-testid="hero-search-input"
                  />
                  <button
                    type="submit"
                    className="bg-brand-600 hover:bg-brand-700 text-white px-7 rounded-md font-bold text-sm flex items-center gap-2 transition-colors"
                    data-testid="hero-search-button"
                  >
                    <Search className="h-4 w-4" />
                    ARA
                  </button>
                </div>

                {/* Dropdown */}
                {showDropdown && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-md bg-white shadow-premium border border-slate-200 overflow-hidden animate-fade-in-up">
                    {filteredRecent.length > 0 && (
                      <div>
                        <div className="px-4 pt-3 pb-1.5 flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            <History className="h-3 w-3" /> Son Aramalar
                          </span>
                          {!searchQuery && (
                            <button type="button" onClick={clearSearches} className="text-[10px] text-slate-400 hover:text-red-500 transition-colors font-bold uppercase">
                              Temizle
                            </button>
                          )}
                        </div>
                        {filteredRecent.slice(0, 3).map((q) => (
                          <div key={q} className="flex items-center group hover:bg-brand-50 transition-colors">
                            <button
                              type="button"
                              onClick={() => handleRecentClick(q)}
                              className="flex-1 flex items-center gap-3 px-4 py-2.5 text-left"
                            >
                              <Clock className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                              <span className="text-sm text-ink-800 font-medium">{q}</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => removeRecent(q, e)}
                              className="pr-4 opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 hover:text-red-500 p-1"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {locationMatches.length > 0 && (
                      <div className={filteredRecent.length > 0 ? 'border-t border-slate-100' : ''}>
                        <div className="px-4 pt-3 pb-1.5">
                          <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            <MapPin className="h-3 w-3" /> Konumlar
                          </span>
                        </div>
                        {locationMatches.map((loc) => (
                          <button
                            key={loc}
                            type="button"
                            onClick={() => { saveSearch(loc); setSearchQuery(''); setSearchFocused(false); router.push(`/parcels?city=${encodeURIComponent(loc)}`); }}
                            className="flex items-center gap-3 w-full px-4 py-2.5 text-left hover:bg-brand-50 transition-colors"
                          >
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-brand-100 text-brand-700">
                              <MapPin className="h-3 w-3" />
                            </div>
                            <span className="text-sm text-ink-800 font-bold">{loc}</span>
                            <span className="ml-auto text-[10px] text-slate-400 uppercase tracking-wide font-bold">İl / İlçe</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {searchQuery.trim() && (
                      <div className="border-t border-slate-100 px-4 py-2.5">
                        <button
                          type="submit"
                          className="flex items-center gap-2 text-sm font-bold text-brand-700 hover:text-brand-800 transition-colors"
                        >
                          <Search className="h-3.5 w-3.5" />
                          "{searchQuery}" için tüm sonuçları gör
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </form>

              {/* Popular cities */}
              <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                <span className="text-xs text-white/70 font-bold uppercase tracking-wider mr-2">Popüler:</span>
                {['İstanbul', 'İzmir', 'Antalya', 'Muğla', 'Bodrum', 'Çeşme'].map((city) => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => router.push(`/parcels?city=${city}`)}
                    className="px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs text-white font-semibold hover:bg-white/20 hover:border-white/30 transition-all backdrop-blur-sm flex items-center gap-1.5"
                    data-testid={`quick-city-${city.toLowerCase()}`}
                  >
                    <MapPin className="h-3 w-3" />
                    {city}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Stats strip */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-14 grid grid-cols-3 gap-0 max-w-3xl mx-auto"
          >
            {[
              { value: stats.parcels, suffix: '+', label: 'Aktif İlan' },
              { value: stats.auctions, suffix: '', label: 'Canlı İhale' },
              { value: stats.cities, suffix: '', label: 'Farklı Şehir' },
            ].map((stat, i) => (
              <div
                key={stat.label}
                className={`py-3 ${i > 0 ? 'border-l border-white/15 pl-6' : ''} ${i < 2 ? 'pr-6' : ''}`}
                data-testid={`stat-${stat.label.toLowerCase().replace(' ', '-')}`}
              >
                <p className="font-heading text-3xl md:text-4xl font-extrabold text-white tabular-nums tracking-tight">
                  {stat.value.toLocaleString('tr-TR')}<span className="text-gold-300">{stat.suffix}</span>
                </p>
                <p className="text-[11px] font-bold text-white/70 uppercase tracking-widest mt-1">
                  {stat.label}
                </p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          CATEGORY QUICK ACCESS — sahibinden-style chips
          ═══════════════════════════════════════════════════════════════ */}
      <section className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 className="font-heading text-sm font-bold text-ink-900 uppercase tracking-widest">
                Hızlı Erişim
              </h2>
              <span className="hidden sm:block h-px w-12 bg-brand-500" />
            </div>
            <Link href="/parcels" className="text-xs font-bold text-brand-700 hover:text-brand-800 uppercase tracking-wider flex items-center gap-1">
              Tüm Kategoriler
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <Link
                  key={cat.label}
                  href={cat.href}
                  className="group relative flex flex-col items-center justify-center gap-2 rounded-md bg-slate-50 hover:bg-brand-50 border border-slate-200 hover:border-brand-300 px-3 py-5 transition-all"
                  data-testid={`category-${cat.label.toLowerCase().replace(/ /g, '-')}`}
                >
                  {cat.live && (
                    <span className="absolute top-2 right-2 flex items-center gap-1 rounded-sm bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 uppercase">
                      <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                      Canlı
                    </span>
                  )}
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white border border-slate-200 group-hover:bg-brand-600 group-hover:border-brand-600 transition-colors">
                    <Icon className="h-5 w-5 text-brand-700 group-hover:text-white transition-colors" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-ink-800 group-hover:text-brand-700 transition-colors">{cat.label}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 font-medium">{cat.desc}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          FEATURED PARCELS
          ═══════════════════════════════════════════════════════════════ */}
      {featuredParcels.length > 0 && (
        <section className="py-14 bg-slate-50" data-testid="featured-parcels-section">
          <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
            <SectionHeader
              overline="Editörün Seçimi"
              title="Öne Çıkan Arsalar"
              description="Premium lokasyonlarda, yatırım değeri yüksek arsa ilanları"
              href="/parcels?isFeatured=true"
            />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featuredParcels.map((parcel, index) => (
                <motion.div
                  key={parcel.id}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.06 }}
                >
                  <ParcelCard parcel={parcel} />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          LIVE AUCTIONS
          ═══════════════════════════════════════════════════════════════ */}
      {activeAuctions.length > 0 && (
        <section className="py-14 bg-white" data-testid="active-auctions-section">
          <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
            <div className="flex items-end justify-between mb-8">
              <div>
                <span className="overline">Gerçek Zamanlı</span>
                <h2 className="mt-3 font-heading text-3xl font-extrabold text-ink-900 tracking-tight flex items-center gap-3">
                  Canlı İhaleler
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-sm bg-red-50 border border-red-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-red-700 uppercase tracking-widest">Canlı</span>
                  </span>
                </h2>
                <p className="mt-2 text-slate-600">Gerçek zamanlı teklif verin, fırsatları kaçırmayın</p>
              </div>
              <Link
                href="/auctions"
                className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-brand-700 hover:text-brand-800 uppercase tracking-wider transition-colors"
                data-testid="view-all-auctions-link"
              >
                Tümünü Gör <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {activeAuctions.map((auction, index) => (
                <motion.div
                  key={auction.id}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.08 }}
                >
                  <AuctionCard auction={auction} />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          LATEST PARCELS — dense grid
          ═══════════════════════════════════════════════════════════════ */}
      {latestParcels.length > 0 && (
        <section className="py-14 bg-slate-50" data-testid="latest-parcels-section">
          <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
            <SectionHeader
              overline="Yeni Eklenen"
              title="Son İlanlar"
              description="Platforma eklenen en yeni arsa ilanları"
              href="/parcels?sortBy=createdAt&sortOrder=DESC"
            />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {latestParcels.slice(0, 8).map((parcel, index) => (
                <motion.div
                  key={parcel.id}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: (index % 4) * 0.05 }}
                >
                  <ParcelCard parcel={parcel} />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          TURKEY MAP — provincial / district drill-down
          ═══════════════════════════════════════════════════════════════ */}
      <section className="py-16 bg-white border-y border-slate-200" data-testid="turkey-map-section">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
          <TurkeyParcelMap />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          HOW IT WORKS — clean professional
          ═══════════════════════════════════════════════════════════════ */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
          <div className="max-w-2xl mx-auto text-center mb-14">
            <span className="overline">Kolay ve Güvenli</span>
            <h2 className="mt-4 font-heading text-4xl md:text-5xl font-extrabold text-ink-900 tracking-tight">
              Sadece 3 Adımda <span className="text-brand-700">Arsanız</span>
            </h2>
            <p className="mt-4 text-slate-600">
              NetTapu ile arsa almak hiç bu kadar kolay olmamıştı.
            </p>
          </div>

          <div className="grid gap-0 sm:grid-cols-3 border border-slate-200 rounded-lg overflow-hidden">
            {[
              {
                step: '01',
                icon: Search,
                title: 'Arsayı Bulun',
                description: 'Harita ve gelişmiş filtrelerle size uygun lokasyonu keşfedin. Her parsel tapu kaydıyla doğrulanmıştır.',
              },
              {
                step: '02',
                icon: Gavel,
                title: 'Teklif Verin',
                description: 'Canlı ihalelere katılın veya doğrudan satın alın. Kaparo ile yerinizi güvence altına alın.',
              },
              {
                step: '03',
                icon: FileCheck,
                title: 'Tapunuzu Alın',
                description: '3D Secure ödeme sonrası resmi tapu devri süreci başlar. Satış sonrası desteğimiz her zaman yanınızda.',
              },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className={`relative bg-white p-8 ${index < 2 ? 'sm:border-r border-slate-200' : ''}`}
                >
                  <div className="font-heading text-[80px] font-black leading-none text-brand-50 absolute -top-4 right-4 select-none">
                    {item.step}
                  </div>
                  <div className="relative">
                    <div className="inline-flex h-14 w-14 items-center justify-center rounded-md bg-brand-600 text-white mb-5">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-heading text-xl font-bold text-ink-900 mb-2">{item.title}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{item.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          TRUST BADGES — professional bar
          ═══════════════════════════════════════════════════════════════ */}
      <section className="py-8 bg-ink-900 border-y border-ink-800">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Lock,       label: '256-bit SSL',   desc: 'Uçtan uca şifreleme' },
              { icon: Scale,      label: 'KVKK Uyumlu',   desc: 'Yasal güvence' },
              { icon: Shield,     label: '3D Secure',     desc: 'Güvenli ödeme' },
              { icon: Headphones, label: '7/24 Destek',   desc: 'Canlı müşteri hizmetleri' },
            ].map((badge, index) => {
              const Icon = badge.icon;
              return (
                <motion.div
                  key={badge.label}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: index * 0.06 }}
                  className="flex items-center gap-3"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-ink-800 border border-ink-700 text-brand-400">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white uppercase tracking-wider">{badge.label}</p>
                    <p className="text-xs text-ink-400 truncate">{badge.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          TESTIMONIALS
          ═══════════════════════════════════════════════════════════════ */}
      {testimonials.length > 0 && (
        <section className="py-20 bg-white" data-testid="testimonials-section">
          <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
            <div className="max-w-2xl mb-12">
              <span className="overline">Müşteri Yorumları</span>
              <h2 className="mt-4 font-heading text-4xl font-extrabold text-ink-900 tracking-tight">
                Müşterilerimiz <span className="text-brand-700">Ne Diyor?</span>
              </h2>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={testimonial.id}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.08 }}
                  className="bg-white rounded-md border border-slate-200 p-6 hover:border-brand-300 hover:shadow-lg transition-all"
                >
                  <div className="flex items-center gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="h-4 w-4 text-gold-500 fill-gold-500" />
                    ))}
                  </div>
                  {testimonial.description && (
                    <p className="text-[15px] text-ink-700 leading-relaxed mb-5 line-clamp-4">
                      "{testimonial.description}"
                    </p>
                  )}
                  <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                    {testimonial.imageUrl ? (
                      <img
                        src={testimonial.imageUrl}
                        alt={testimonial.title}
                        className="h-10 w-10 rounded-full object-cover ring-2 ring-brand-100"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-white font-bold text-sm">
                        {testimonial.title.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-heading font-bold text-ink-900">{testimonial.title}</p>
                      {testimonial.websiteUrl && (
                        <p className="text-xs text-slate-500">{testimonial.websiteUrl}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          FINAL CTA
          ═══════════════════════════════════════════════════════════════ */}
      <section className="relative py-20 bg-gradient-olive overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06]" style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.9) 1.2px, transparent 1.2px)',
          backgroundSize: '24px 24px',
        }} />
        <div className="absolute -bottom-32 -right-32 w-[420px] h-[420px] rounded-full bg-brand-400/20 blur-3xl" />

        <div className="relative mx-auto max-w-[1280px] px-4 sm:px-6">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-block px-3 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm text-[11px] font-bold text-gold-300 uppercase tracking-widest mb-6">
                Hemen Başlayın
              </span>
              <h2 className="font-heading text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-[-0.03em] leading-[1.05] mb-5">
                Geleceğin Yatırımına <span className="text-gold-300">bugün başlayın.</span>
              </h2>
              <p className="text-lg text-brand-100/95 max-w-2xl mb-9 leading-relaxed">
                Binlerce doğrulanmış arsa ve güvenilir açık artırmalar sizi bekliyor.
                Üyelik ücretsiz — sadece 60 saniyede hesabınızı oluşturun.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/parcels"
                  className="inline-flex items-center justify-center gap-2 bg-white text-brand-700 px-7 py-3.5 rounded-md font-bold hover:bg-gold-50 transition-colors"
                  data-testid="cta-browse-parcels"
                >
                  <Search className="h-4 w-4" />
                  Arsaları Keşfet
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 bg-transparent border-2 border-white/40 text-white px-7 py-3.5 rounded-md font-bold hover:bg-white/10 hover:border-white transition-colors"
                  data-testid="cta-register"
                >
                  Ücretsiz Üye Ol
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {showVideo && siteSettings.intro_video_url && (
        <VideoPopup videoUrl={siteSettings.intro_video_url} onClose={() => setShowVideo(false)} />
      )}
    </main>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SECTION HEADER
   ═══════════════════════════════════════════════════════════════ */
function SectionHeader({
  overline,
  title,
  description,
  href,
  linkText = 'Tümünü Gör',
}: {
  overline?: string;
  title: string;
  description?: string;
  href?: string;
  linkText?: string;
}) {
  return (
    <div className="flex items-end justify-between mb-8 gap-4">
      <div className="min-w-0">
        {overline && <span className="overline">{overline}</span>}
        <h2 className="mt-3 font-heading text-3xl font-extrabold text-ink-900 tracking-tight">
          {title}
        </h2>
        {description && <p className="mt-1.5 text-slate-600 text-sm">{description}</p>}
      </div>
      {href && (
        <Link
          href={href}
          className="hidden sm:flex shrink-0 items-center gap-1.5 text-xs font-bold text-brand-700 hover:text-brand-800 uppercase tracking-wider transition-colors"
        >
          {linkText} <ArrowRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   AUCTION CARD
   ═══════════════════════════════════════════════════════════════ */
function AuctionCard({ auction }: { auction: Auction }) {
  const statusConfig: Record<string, { label: string; classes: string; icon: typeof Zap }> = {
    live:      { label: 'Canlı',    classes: 'bg-red-50 text-red-700 border-red-200',          icon: Zap },
    ending:    { label: 'Bitiyor',  classes: 'bg-amber-50 text-amber-700 border-amber-200',    icon: Timer },
    scheduled: { label: 'Yaklaşan', classes: 'bg-blue-50 text-blue-700 border-blue-200',       icon: Timer },
  };

  const status = statusConfig[auction.status] || {
    label: auction.status,
    classes: 'bg-slate-50 text-slate-700 border-slate-200',
    icon: Gavel,
  };
  const Icon = status.icon;

  return (
    <Link
      href={`/auctions/${auction.id}`}
      className="group block bg-white rounded-md border border-slate-200 overflow-hidden hover:border-brand-300 hover:shadow-lg transition-all"
      data-testid={`auction-card-${auction.id}`}
    >
      {/* Top strip */}
      <div className={`flex items-center justify-between px-5 py-2.5 ${
        auction.status === 'live' ? 'bg-gradient-to-r from-red-50 to-white' : 'bg-slate-50'
      } border-b border-slate-100`}>
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[10px] font-bold uppercase tracking-wider border ${status.classes}`}>
          <Icon className="h-3 w-3" />
          {status.label}
        </span>
        <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          <Users className="h-3 w-3" />
          {auction.participantCount} katılımcı
        </span>
      </div>

      {/* Body */}
      <div className="p-5">
        <h3 className="font-heading text-base font-bold text-ink-900 mb-4 line-clamp-2 group-hover:text-brand-700 transition-colors leading-snug">
          {auction.title || 'Açık Artırma'}
        </h3>

        <div className="space-y-2">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500">
              {auction.currentPrice ? 'Güncel Teklif' : 'Başlangıç'}
            </span>
            <span className="font-heading text-2xl font-extrabold text-brand-700 tracking-tight tabular-nums">
              {formatPrice(auction.currentPrice || auction.startingPrice)}
            </span>
          </div>
          {auction.currentPrice && (
            <div className="flex items-baseline justify-between text-xs">
              <span className="text-slate-500">Başlangıç</span>
              <span className="text-slate-700 font-semibold tabular-nums">{formatPrice(auction.startingPrice)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50 text-xs">
        <span className="flex items-center gap-1 text-slate-600 font-semibold">
          <TrendingUp className="h-3.5 w-3.5 text-brand-600" />
          {auction.bidCount} teklif
        </span>
        <span className="text-brand-700 font-bold uppercase tracking-wider flex items-center gap-1">
          Teklif Ver <ArrowRight className="h-3 w-3" />
        </span>
      </div>
    </Link>
  );
}
