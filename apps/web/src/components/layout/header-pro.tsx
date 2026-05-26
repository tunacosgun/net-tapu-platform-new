'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useSiteSettings } from '@/hooks/use-site-settings';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Map, Heart, Shield, User, LogOut, Menu, X, Bell,
  ChevronDown, Phone, Mail, Search,
  CreditCard, Gavel, Clock, TrendingUp, ArrowRight,
  Info, Eye, Target, Settings2, Building2, FolderOpen, Star, Newspaper, BookOpen, Headphones,
  History, HelpCircle, Scale, Undo2, LifeBuoy, MessageCircle,
} from 'lucide-react';
import { useRecentSearches } from '@/hooks/use-recent-searches';
import { useRouter } from 'next/navigation';
import type { Auction } from '@/types';
import apiClient from '@/lib/api-client';
import { NetTapuLogo } from '@/components/ui/nettapu-logo';

// ─── Types ───────────────────────────────────────────────────────────────────

interface NavDropdownItem {
  label: string;
  href: string;
  description?: string;
  icon?: string;
}

function resolveUploadUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('/')) return url;
  try {
    const parsed = new URL(url);
    if (parsed.pathname.startsWith('/uploads/') || parsed.pathname.startsWith('/site/')) {
      return parsed.pathname;
    }
  } catch {}
  return url;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  info: Info, eye: Eye, target: Target, settings: Settings2, building: Building2,
  folder: FolderOpen, star: Star, newspaper: Newspaper, book: BookOpen,
  headphones: Headphones, mail: Mail, help: HelpCircle, scale: Scale,
  undo: Undo2, lifebuoy: LifeBuoy, message: MessageCircle,
};

function NavIcon({ name, className }: { name?: string; className?: string }) {
  if (!name) return null;
  const Icon = ICON_MAP[name];
  if (!Icon) return null;
  return <Icon className={className} />;
}

// ─── Default items ───────────────────────────────────────────────────────────

const DEFAULT_CORPORATE_ITEMS: NavDropdownItem[] = [
  { label: 'Hakkımızda',        href: '/about',         description: 'Şirketimiz ve hikayemiz',    icon: 'info' },
  { label: 'Vizyon',            href: '/vision',        description: '2030 hedeflerimiz',          icon: 'eye' },
  { label: 'Misyon',            href: '/mission',       description: 'Değerlerimiz & taahhütler',  icon: 'target' },
  { label: 'Nasıl Çalışır?',    href: '/how-it-works',  description: 'Platform süreci',            icon: 'settings' },
  { label: 'Referanslar',       href: '/references',    description: 'İş ortaklarımız',            icon: 'building' },
  { label: 'Projelerimiz',      href: '/projects',      description: 'Tamamlanan projeler',        icon: 'folder' },
  { label: 'Müşteri Yorumları', href: '/testimonials',  description: 'Kullanıcı deneyimleri',      icon: 'star' },
  { label: 'Basın',             href: '/press',         description: 'Medyada NetTapu',            icon: 'newspaper' },
];

const DEFAULT_SUPPORT_ITEMS: NavDropdownItem[] = [
  { label: 'S.S.S.',               href: '/faq',                 description: 'Sık sorulan sorular',       icon: 'help' },
  { label: 'Gayrimenkul Rehberi',  href: '/real-estate-guide',   description: 'Kapsamlı yatırım rehberi',  icon: 'book' },
  { label: 'Satış Sonrası',        href: '/post-sale',           description: 'Destek süreçleri',          icon: 'headphones' },
  { label: 'Yasal Bilgiler',       href: '/legal',               description: 'Kullanım koşulları & KVKK', icon: 'scale' },
  { label: 'Cayma Hakkı',          href: '/withdrawal-rights',   description: 'İptal ve iade politikası',  icon: 'undo' },
  { label: 'İletişim',             href: '/contact',             description: 'Bize ulaşın',               icon: 'mail' },
];

// ─── Category nav bar items ──────────────────────────────────────────────────

const categoryNav = [
  { href: '/parcels',              label: 'Arsalar',         icon: Map },
  { href: '/auctions',             label: 'İhaleler',        icon: Gavel, live: true },
  { href: '/harita',               label: 'Harita',          icon: Map },
  { href: '/campaigns',            label: 'Kampanyalar',     icon: Star },
  { href: '/real-estate-guide',    label: 'Rehber',          icon: BookOpen },
  { href: '/become-consultant',    label: 'Danışman Ol',     icon: Map },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTimeLeft(end: string) {
  const ms = new Date(end).getTime() - Date.now();
  if (ms <= 0) return 'Sona erdi';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h > 24) return `${Math.floor(h / 24)} gün`;
  if (h > 0) return `${h}s ${m}dk`;
  return `${m} dakika`;
}

// ─── Auctions Live Dropdown ──────────────────────────────────────────────────

function AuctionsLiveDropdown() {
  const [open, setOpen] = useState(false);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didFetch = useRef(false);

  const fetchAuctions = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get<{ data: Auction[] }>('/auctions?limit=6');
      setAuctions(data.data || []);
    } catch {
      setAuctions([]);
    } finally {
      setLoading(false);
    }
  };

  function handleEnter() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setOpen(true);
    if (!didFetch.current) { didFetch.current = true; fetchAuctions(); }
  }
  function handleLeave() {
    timerRef.current = setTimeout(() => setOpen(false), 150);
  }

  const hasLive = auctions.some(a => a.status === 'live');

  return (
    <div className="relative" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      <Link
        href="/auctions"
        className="flex items-center gap-1.5 px-3 py-2.5 text-sm font-semibold text-white/90 hover:text-white transition-colors"
      >
        <Gavel className="h-4 w-4" />
        İhaleler
        {hasLive && (
          <span className="ml-1 relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
          </span>
        )}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </Link>

      {open && (
        <div className="absolute left-0 top-full mt-0 z-[100] w-96 animate-fade-in-up">
          <div className="bg-white rounded-b-lg shadow-premium border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-brand-50">
              <div className="flex items-center gap-2">
                <Gavel className="h-4 w-4 text-brand-700" />
                <span className="text-sm font-heading font-bold text-ink-800 tracking-tight">Mevcut İhaleler</span>
              </div>
              {hasLive && (
                <span className="badge badge-danger text-[10px]">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse mr-1" />
                  Canlı
                </span>
              )}
            </div>

            <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                </div>
              ) : auctions.length === 0 ? (
                <div className="py-10 text-center">
                  <Gavel className="h-8 w-8 mx-auto mb-2 text-slate-200" />
                  <p className="text-sm text-slate-400">Aktif ihale bulunmuyor</p>
                </div>
              ) : (
                auctions.map((a) => (
                  <Link
                    key={a.id}
                    href={`/auctions/${a.id}`}
                    onClick={() => setOpen(false)}
                    className="flex items-start gap-3 px-5 py-3 hover:bg-brand-50 transition-colors group"
                  >
                    <div className="mt-1.5 shrink-0">
                      {a.status === 'live'
                        ? <span className="h-2 w-2 rounded-full bg-red-500 block animate-pulse" />
                        : <span className="h-2 w-2 rounded-full bg-amber-400 block" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-ink-800 truncate group-hover:text-brand-700 transition-colors">
                        {a.title}
                      </p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="flex items-center gap-1 text-xs text-slate-500 tabular-nums">
                          <TrendingUp className="h-3 w-3" />
                          {Number(a.currentPrice || a.startingPrice).toLocaleString('tr-TR')} ₺
                        </span>
                        {a.status === 'live' && a.scheduledEnd && (
                          <span className="flex items-center gap-1 text-xs text-red-600 font-bold">
                            <Clock className="h-3 w-3" />
                            {formatTimeLeft(a.scheduledEnd)}
                          </span>
                        )}
                        {a.status === 'scheduled' && (
                          <span className="text-xs text-amber-600 font-bold">Yakında</span>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-brand-600 shrink-0 mt-1 transition-colors" />
                  </Link>
                ))
              )}
            </div>

            <Link
              href="/auctions"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-1.5 py-3 text-xs font-bold text-brand-700 hover:bg-brand-50 transition-colors border-t border-slate-100 uppercase tracking-wider"
            >
              Tüm İhaleleri Gör <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Mega Dropdown (Kurumsal & Destek) ───────────────────────────────────────

function MegaDropdown({
  items,
  pathname,
  onDark = false,
}: {
  items: NavDropdownItem[];
  pathname: string | null;
  onDark?: boolean;
}) {
  return (
    <div className="absolute left-0 top-full mt-0 z-[100] animate-fade-in-up" style={{ minWidth: 520 }}>
      <div className="bg-white rounded-b-lg shadow-premium border border-slate-200 overflow-hidden">
        <div className="grid grid-cols-2 gap-0.5 p-2">
          {items.map((item) => {
            const isActive = pathname === item.href || (pathname?.startsWith(item.href) && item.href !== '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group relative flex items-start gap-3 rounded-md px-3 py-3 transition-colors ${
                  isActive ? 'bg-brand-50' : 'hover:bg-slate-50'
                }`}
              >
                <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md transition-colors ${
                  isActive ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-500 group-hover:bg-brand-50 group-hover:text-brand-600'
                }`}>
                  <NavIcon name={item.icon} className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-heading font-bold leading-tight ${isActive ? 'text-brand-700' : 'text-ink-800 group-hover:text-brand-700'}`}>
                    {item.label}
                  </p>
                  {item.description && (
                    <p className="mt-0.5 text-xs text-slate-500 leading-snug">{item.description}</p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export function HeaderPro() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, user, avatarUrl } = useAuthStore();
  const s = useSiteSettings();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [corporateOpen, setCorporateOpen] = useState(false);
  const [mobileCorporateOpen, setMobileCorporateOpen] = useState(false);
  const corporateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [supportOpen, setSupportOpen] = useState(false);
  const [mobileSupportOpen, setMobileSupportOpen] = useState(false);
  const supportTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const { searches: recentSearches, save: saveSearch, remove: removeSearch, clear: clearSearches } = useRecentSearches();

  const SUPPORT_HREFS = new Set(DEFAULT_SUPPORT_ITEMS.map((i) => i.href));
  let corporateItems: NavDropdownItem[] = DEFAULT_CORPORATE_ITEMS;
  if (s.corporate_nav_items) {
    try {
      const parsed = JSON.parse(s.corporate_nav_items as string);
      if (Array.isArray(parsed) && parsed.length > 0) {
        corporateItems = parsed
          .filter((item: NavDropdownItem) => !SUPPORT_HREFS.has(item.href))
          .map((item: NavDropdownItem) => {
            if (!item.icon || item.icon === '') {
              const def = DEFAULT_CORPORATE_ITEMS.find(d => d.href === item.href);
              if (def?.icon) return { ...item, icon: def.icon };
            }
            return item;
          });
        if (corporateItems.length === 0) corporateItems = DEFAULT_CORPORATE_ITEMS;
      }
    } catch {}
  }
  const supportItems: NavDropdownItem[] = DEFAULT_SUPPORT_ITEMS;
  const resolvedLogo = resolveUploadUrl(s.site_logo as string | undefined);

  // Notifications poll
  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;
    const fetchNotifs = async () => {
      try {
        const { default: apiClient } = await import('@/lib/api-client');
        const { data } = await apiClient.get('/notifications', { params: { limit: 10, unreadOnly: true } });
        if (cancelled) return;
        const items = data?.data || data || [];
        const unread = Array.isArray(items) ? items.filter((n: any) => !n.isRead).length : 0;
        setNotificationCount(unread);
      } catch {
        if (!cancelled) setNotificationCount(0);
      }
    };
    fetchNotifs();
    intervalId = setInterval(fetchNotifs, 60000);
    return () => { cancelled = true; if (intervalId) clearInterval(intervalId); };
  }, [isAuthenticated]);

  // Close search dropdown on outside click — must run before any early return to keep hook order stable
  useEffect(() => {
    if (!searchFocused) return;
    function onMouseDown(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    }
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [searchFocused]);

  const isAuthPage = pathname?.startsWith('/login') || pathname?.startsWith('/register') || pathname?.startsWith('/forgot-password');
  const isAdminPage = pathname?.startsWith('/admin');
  if (isAuthPage || isAdminPage) return null;

  const isAdmin = user?.roles?.includes('admin') || user?.roles?.includes('superadmin');
  const isCorporateActive = corporateItems.some((item) => pathname?.startsWith(item.href));
  const isSupportActive = supportItems.some((item) => pathname?.startsWith(item.href));

  function handleCorporateEnter() { if (corporateTimer.current) clearTimeout(corporateTimer.current); setCorporateOpen(true); }
  function handleCorporateLeave() { corporateTimer.current = setTimeout(() => setCorporateOpen(false), 120); }
  function handleSupportEnter()   { if (supportTimer.current) clearTimeout(supportTimer.current); setSupportOpen(true); }
  function handleSupportLeave()   { supportTimer.current = setTimeout(() => setSupportOpen(false), 120); }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    saveSearch(q);
    setSearchFocused(false);
    router.push(`/parcels?search=${encodeURIComponent(q)}`);
  }

  return (
    <header className="sticky top-0 z-50 bg-white" data-testid="main-header">
      {/* ═══ Tier 1 — Dark charcoal utility strip ═══ */}
      <div className="hidden lg:block bg-ink-900 text-ink-300 border-b border-ink-800">
        <div className="mx-auto flex h-9 max-w-[1280px] items-center justify-between px-6 text-[11px] font-medium">
          <div className="flex items-center gap-6">
            {s.contact_phone && (
              <a href={`tel:${s.contact_phone}`} className="flex items-center gap-1.5 hover:text-white transition-colors" data-testid="header-phone">
                <Phone className="h-3 w-3" />
                <span className="tabular-nums">{s.contact_phone}</span>
              </a>
            )}
            {s.contact_email && (
              <a href={`mailto:${s.contact_email}`} className="flex items-center gap-1.5 hover:text-white transition-colors" data-testid="header-email">
                <Mail className="h-3 w-3" />
                <span>{s.contact_email}</span>
              </a>
            )}
            <span className="hidden xl:flex items-center gap-1.5 text-brand-300">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-pulse" />
              Türkiye'nin güvenilir arsa & ihale platformu
            </span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/how-it-works" className="hover:text-white transition-colors flex items-center gap-1.5">
              <HelpCircle className="h-3 w-3" />
              Nasıl Çalışır?
            </Link>
            <Link href="/contact" className="hover:text-white transition-colors flex items-center gap-1.5">
              <MessageCircle className="h-3 w-3" />
              İletişim
            </Link>
            <div className="h-4 w-px bg-ink-700" />
            <Link href="/profile/favorites" className="hover:text-white transition-colors flex items-center gap-1.5">
              <Heart className="h-3 w-3" />
              Favorilerim
            </Link>
          </div>
        </div>
      </div>

      {/* ═══ Tier 2 — Main white bar: logo + search + auth ═══ */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-[72px] max-w-[1280px] items-center gap-6 px-4 lg:px-6">
          {/* Logo */}
          <Link href="/" className="flex items-center shrink-0 group" data-testid="header-logo">
            {!s._loaded ? (
              <div className="h-10 w-36 animate-pulse rounded-md bg-slate-100" />
            ) : resolvedLogo ? (
              <img
                src={resolvedLogo}
                alt={s.site_title || 'NetTapu'}
                className="h-10 object-contain transition-transform duration-200 group-hover:scale-[1.02]"
              />
            ) : (
              <NetTapuLogo variant="light" width={148} height={36} className="transition-transform duration-200 group-hover:scale-[1.02]" />
            )}
          </Link>

          {/* Search bar — always visible, prominent (sahibinden style) */}
          <div className="hidden md:flex flex-1 max-w-2xl relative" ref={searchRef}>
            <form onSubmit={handleSearchSubmit} className="w-full">
              <div className={`flex items-stretch w-full bg-white border-2 rounded-md overflow-hidden transition-all ${
                searchFocused ? 'border-brand-600 shadow-brand' : 'border-slate-200 hover:border-slate-300'
              }`}>
                <div className="flex items-center pl-4 pr-2 text-slate-400">
                  <Search className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  placeholder="İl, ilçe, ada/parsel veya ilan no ile arayın..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  className="flex-1 py-2.5 bg-transparent text-ink-900 placeholder:text-slate-400 text-sm focus:outline-none"
                  data-testid="header-search-input"
                />
                <button
                  type="submit"
                  className="bg-brand-600 hover:bg-brand-700 text-white px-6 font-bold text-sm transition-colors flex items-center gap-2"
                  data-testid="header-search-submit"
                >
                  <Search className="h-4 w-4" />
                  Ara
                </button>
              </div>
            </form>

            {/* Recent searches dropdown */}
            {searchFocused && recentSearches.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 z-[100] bg-white rounded-md border border-slate-200 shadow-premium overflow-hidden animate-fade-in-up">
                <div className="flex items-center justify-between px-4 pt-3 pb-1.5">
                  <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                    <History className="h-3 w-3" /> Son Aramalar
                  </span>
                  <button type="button" onClick={clearSearches} className="text-[11px] text-slate-400 hover:text-red-500 transition-colors font-semibold">
                    Temizle
                  </button>
                </div>
                {recentSearches.slice(0, 5).map((q) => (
                  <div key={q} className="flex items-center group hover:bg-brand-50 transition-colors">
                    <button
                      type="button"
                      onClick={() => { setSearchQuery(''); saveSearch(q); setSearchFocused(false); router.push(`/parcels?search=${encodeURIComponent(q)}`); }}
                      className="flex-1 flex items-center gap-3 px-4 py-2.5 text-left"
                    >
                      <Clock className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                      <span className="text-sm text-ink-800 font-medium">{q}</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removeSearch(q); }}
                      className="pr-4 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all p-1"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1 ml-auto">
            {isAuthenticated ? (
              <>
                {/* Notifications */}
                <button
                  className="relative hidden sm:flex items-center justify-center h-10 w-10 text-slate-500 hover:text-brand-700 rounded-md hover:bg-brand-50 transition-colors"
                  data-testid="header-notifications-btn"
                >
                  <Bell className="h-5 w-5" />
                  {notificationCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-4 w-4 flex items-center justify-center text-[9px] font-bold text-white bg-red-500 rounded-full tabular-nums">
                      {notificationCount > 9 ? '9+' : notificationCount}
                    </span>
                  )}
                </button>

                {/* Favorites */}
                <Link
                  href="/profile/favorites"
                  className="hidden sm:flex items-center justify-center h-10 w-10 text-slate-500 hover:text-red-500 rounded-md hover:bg-red-50 transition-colors"
                  data-testid="header-favorites-btn"
                >
                  <Heart className="h-5 w-5" />
                </Link>

                {/* Admin shortcut */}
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="hidden lg:flex items-center gap-1.5 rounded-md bg-ink-900 px-3 py-2 text-xs font-bold text-white hover:bg-ink-800 transition-colors"
                    data-testid="header-admin-btn"
                  >
                    <Shield className="h-3.5 w-3.5" />
                    Admin
                  </Link>
                )}

                {/* Profile */}
                <div className="relative">
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-md hover:bg-slate-50 transition-colors"
                    data-testid="header-profile-btn"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white overflow-hidden shadow-brand">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                      ) : (
                        user?.email?.charAt(0).toUpperCase() || 'U'
                      )}
                    </span>
                    <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {profileOpen && (
                    <div
                      className="absolute right-0 top-full mt-1 w-64 rounded-md bg-white shadow-premium border border-slate-200 overflow-hidden animate-fade-in-up z-[100]"
                      onMouseLeave={() => setProfileOpen(false)}
                      data-testid="profile-dropdown"
                    >
                      <div className="px-4 py-4 bg-gradient-olive-soft border-b border-slate-100">
                        <p className="text-sm font-heading font-bold text-ink-900 truncate">{user?.email}</p>
                        <p className="text-xs text-slate-500 mt-0.5 font-medium">Kişisel Hesap</p>
                      </div>
                      <div className="py-1.5">
                        {[
                          { href: '/profile',                label: 'Hesabım',           icon: User },
                          { href: '/profile/favorites',      label: 'Favorilerim',       icon: Heart },
                          { href: '/profile/auctions',       label: 'İhalelerim',        icon: Gavel },
                          { href: '/profile/payments',       label: 'Ödemeler',          icon: CreditCard },
                          { href: '/profile/saved-searches', label: 'Kayıtlı Aramalar',  icon: History },
                        ].map(({ href, label, icon: Icon }) => (
                          <Link
                            key={href}
                            href={href}
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-ink-700 hover:bg-brand-50 hover:text-brand-700 transition-colors"
                          >
                            <Icon className="h-4 w-4 text-slate-400" />
                            <span>{label}</span>
                          </Link>
                        ))}
                      </div>
                      <div className="border-t border-slate-100">
                        <button
                          onClick={async () => {
                            setProfileOpen(false);
                            try { await fetch('/api/auth/session', { method: 'DELETE' }); } catch {}
                            useAuthStore.getState().clearTokens();
                            window.location.href = '/login';
                          }}
                          className="flex w-full items-center gap-3 px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors"
                          data-testid="logout-btn"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>Çıkış Yap</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="hidden md:block px-4 py-2 text-sm font-bold text-ink-700 hover:text-brand-700 rounded-md hover:bg-brand-50 transition-colors"
                  data-testid="header-login-btn"
                >
                  Giriş Yap
                </Link>
                <Link
                  href="/register"
                  className="rounded-md bg-brand-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700 shadow-brand hover:shadow-brand-lg transition-all"
                  data-testid="header-register-btn"
                >
                  Üye Ol
                </Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              className="ml-1 flex h-10 w-10 items-center justify-center rounded-md hover:bg-slate-50 lg:hidden transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menu"
              data-testid="mobile-menu-toggle"
            >
              {mobileOpen ? <X className="h-5 w-5 text-ink-800" /> : <Menu className="h-5 w-5 text-ink-800" />}
            </button>
          </div>
        </div>

        {/* Mobile search */}
        <div className="md:hidden border-t border-slate-100 bg-white px-4 py-3">
          <form onSubmit={handleSearchSubmit}>
            <div className="flex items-stretch w-full bg-slate-50 border border-slate-200 rounded-md overflow-hidden">
              <div className="flex items-center pl-3 text-slate-400">
                <Search className="h-4 w-4" />
              </div>
              <input
                type="text"
                placeholder="Arsa, il veya ilan no..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 py-2.5 px-3 bg-transparent text-ink-900 placeholder:text-slate-400 text-sm focus:outline-none"
              />
              <button type="submit" className="bg-brand-600 text-white px-4 font-bold text-xs">
                ARA
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ═══ Tier 3 — Olive category bar ═══ */}
      <div className="hidden lg:block bg-brand-700 text-white border-b border-brand-800">
        <div className="mx-auto flex max-w-[1280px] items-center px-6">
          <nav className="flex items-center" data-testid="category-nav">
            {categoryNav.map((item) => {
              const isActive = item.href === '/' ? pathname === '/' :
                pathname?.startsWith(item.href.split('?')[0]);
              const Icon = item.icon;
              if (item.href === '/auctions') {
                return <AuctionsLiveDropdown key={item.href} />;
              }
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center gap-1.5 px-4 py-3 text-sm font-semibold transition-colors ${
                    isActive
                      ? 'text-white bg-brand-800'
                      : 'text-white/90 hover:text-white hover:bg-brand-800'
                  }`}
                  data-testid={`nav-link-${item.label.toLowerCase()}`}
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  {item.label}
                  {isActive && <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-gold-400" />}
                </Link>
              );
            })}

            {/* Kurumsal */}
            <div className="relative" onMouseEnter={handleCorporateEnter} onMouseLeave={handleCorporateLeave}>
              <button
                className={`relative flex items-center gap-1.5 px-4 py-3 text-sm font-semibold transition-colors ${
                  isCorporateActive || corporateOpen ? 'text-white bg-brand-800' : 'text-white/90 hover:text-white hover:bg-brand-800'
                }`}
                data-testid="nav-corporate-btn"
                aria-expanded={corporateOpen}
              >
                <Building2 className="h-4 w-4" />
                Kurumsal
                <ChevronDown className={`h-3 w-3 transition-transform ${corporateOpen ? 'rotate-180' : ''}`} />
              </button>
              {corporateOpen && <MegaDropdown items={corporateItems} pathname={pathname} />}
            </div>

            {/* Destek */}
            <div className="relative" onMouseEnter={handleSupportEnter} onMouseLeave={handleSupportLeave}>
              <button
                className={`relative flex items-center gap-1.5 px-4 py-3 text-sm font-semibold transition-colors ${
                  isSupportActive || supportOpen ? 'text-white bg-brand-800' : 'text-white/90 hover:text-white hover:bg-brand-800'
                }`}
                data-testid="nav-support-btn"
                aria-expanded={supportOpen}
              >
                <LifeBuoy className="h-4 w-4" />
                Destek
                <ChevronDown className={`h-3 w-3 transition-transform ${supportOpen ? 'rotate-180' : ''}`} />
              </button>
              {supportOpen && <MegaDropdown items={supportItems} pathname={pathname} />}
            </div>
          </nav>

          {/* Right side of category bar */}
          <div className="ml-auto flex items-center gap-4 text-xs">
            <Link href="/parcels?isFeatured=true" className="flex items-center gap-1.5 text-gold-300 hover:text-gold-200 font-bold uppercase tracking-wider transition-colors">
              <Star className="h-3.5 w-3.5 fill-gold-300" />
              Öne Çıkanlar
            </Link>
          </div>
        </div>
      </div>

      {/* ═══ Mobile menu ═══ */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden bg-white border-t border-slate-200 shadow-lg overflow-hidden"
            data-testid="mobile-menu"
          >
            <nav className="px-4 py-4 space-y-1">
              {categoryNav.map((item) => {
                const isActive = pathname?.startsWith(item.href.split('?')[0]);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-md transition-colors ${
                      isActive ? 'text-brand-700 bg-brand-50' : 'text-ink-700 hover:bg-slate-50'
                    }`}
                  >
                    {Icon && <Icon className="h-5 w-5" />}
                    {item.label}
                  </Link>
                );
              })}

              {/* Kurumsal expandable */}
              <div>
                <button
                  onClick={() => setMobileCorporateOpen(!mobileCorporateOpen)}
                  className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-sm font-bold rounded-md transition-colors ${
                    isCorporateActive ? 'text-brand-700 bg-brand-50' : 'text-ink-700 hover:bg-slate-50'
                  }`}
                  data-testid="mobile-corporate-toggle"
                >
                  <span className="flex items-center gap-3"><Building2 className="h-5 w-5" />Kurumsal</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${mobileCorporateOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {mobileCorporateOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.18 }}
                      className="overflow-hidden"
                    >
                      <div className="ml-4 mt-1 border-l-2 border-brand-200 pl-3 space-y-0.5">
                        {corporateItems.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => { setMobileOpen(false); setMobileCorporateOpen(false); }}
                            className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-ink-700 hover:bg-slate-50 rounded-md"
                          >
                            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 text-slate-500">
                              <NavIcon name={item.icon} className="h-3.5 w-3.5" />
                            </span>
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Destek expandable */}
              <div>
                <button
                  onClick={() => setMobileSupportOpen(!mobileSupportOpen)}
                  className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-sm font-bold rounded-md transition-colors ${
                    isSupportActive ? 'text-brand-700 bg-brand-50' : 'text-ink-700 hover:bg-slate-50'
                  }`}
                  data-testid="mobile-support-toggle"
                >
                  <span className="flex items-center gap-3"><LifeBuoy className="h-5 w-5" />Destek</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${mobileSupportOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {mobileSupportOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.18 }}
                      className="overflow-hidden"
                    >
                      <div className="ml-4 mt-1 border-l-2 border-brand-200 pl-3 space-y-0.5">
                        {supportItems.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => { setMobileOpen(false); setMobileSupportOpen(false); }}
                            className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-ink-700 hover:bg-slate-50 rounded-md"
                          >
                            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 text-slate-500">
                              <NavIcon name={item.icon} className="h-3.5 w-3.5" />
                            </span>
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Auth section */}
              {!isAuthenticated ? (
                <div className="pt-3 mt-3 border-t border-slate-100 flex gap-2">
                  <Link href="/login" onClick={() => setMobileOpen(false)} className="flex-1 btn btn-secondary btn-lg justify-center">Giriş Yap</Link>
                  <Link href="/register" onClick={() => setMobileOpen(false)} className="flex-1 btn btn-primary btn-lg justify-center">Üye Ol</Link>
                </div>
              ) : (
                <div className="pt-2 mt-2 border-t border-slate-100 space-y-1">
                  <Link href="/profile" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-ink-700 hover:bg-slate-50 rounded-md">
                    <User className="h-5 w-5 text-slate-400" /> Hesabım
                  </Link>
                  <button
                    onClick={async () => {
                      setMobileOpen(false);
                      try { await fetch('/api/auth/session', { method: 'DELETE' }); } catch {}
                      useAuthStore.getState().clearTokens();
                      window.location.href = '/login';
                    }}
                    className="flex w-full items-center gap-3 px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 rounded-md"
                  >
                    <LogOut className="h-5 w-5" /> Çıkış Yap
                  </button>
                </div>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
