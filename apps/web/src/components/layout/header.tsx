'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useSiteSettings } from '@/hooks/use-site-settings';
import {
  Map, Heart, Shield, User, LogOut, Menu, X,
  ChevronDown, Phone, Mail, HelpCircle, Gavel, Clock, TrendingUp, ArrowRight,
  MessageSquare,
} from 'lucide-react';
import type { Auction } from '@/types';
import apiClient from '@/lib/api-client';

/* ── Logo component: shows NT badge instantly, swaps to image once loaded ── */
function SiteLogo({ logoUrl, title }: { logoUrl?: string; title?: string }) {
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <Link href="/" className="flex items-center gap-2.5 cursor-pointer">
      {/* NT badge — always rendered, hidden only when logo has loaded */}
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 text-white text-sm font-extrabold shadow-sm shadow-brand-500/20 shrink-0 transition-opacity duration-200 ${
          logoUrl && imgLoaded ? 'hidden' : 'flex'
        }`}
      >
        NT
      </div>

      {/* Logo image — preloaded invisibly, shown on load */}
      {logoUrl && (
        <img
          src={logoUrl}
          alt={title || 'NetTapu'}
          className={`h-9 w-auto transition-opacity duration-200 ${imgLoaded ? 'opacity-100' : 'opacity-0 absolute'}`}
          onLoad={() => setImgLoaded(true)}
        />
      )}

      {!logoUrl && (
        <div className="flex flex-col leading-tight">
          <span className="text-lg font-bold text-gray-900 tracking-tight">{title || 'NetTapu'}</span>
          <span className="text-[10px] font-medium text-gray-400 uppercase tracking-widest -mt-0.5">Arsa & Açık Artırma</span>
        </div>
      )}
    </Link>
  );
}

/* ── Live auction status badge ── */
function AuctionStatusDot({ status }: { status: string }) {
  if (status === 'live') return <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" /></span>;
  if (status === 'scheduled') return <span className="h-2 w-2 rounded-full bg-amber-400 inline-block" />;
  return <span className="h-2 w-2 rounded-full bg-gray-300 inline-block" />;
}

function formatTimeLeft(end: string) {
  const ms = new Date(end).getTime() - Date.now();
  if (ms <= 0) return 'Sona erdi';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h > 24) return `${Math.floor(h / 24)} gün`;
  if (h > 0) return `${h}s ${m}dk`;
  return `${m} dakika`;
}

/* ── İhaleler hover dropdown ── */
function AuctionsDropdown() {
  const [open, setOpen] = useState(false);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const fetchedRef = useRef(false);

  const fetchAuctions = useCallback(async () => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    setLoading(true);
    try {
      const { data } = await apiClient.get<{ data: Auction[] }>('/auctions?limit=5&status=live,scheduled');
      setAuctions(data.data || []);
    } catch {
      try {
        const { data } = await apiClient.get<Auction[]>('/auctions?limit=5');
        setAuctions(Array.isArray(data) ? data.slice(0, 5) : []);
      } catch {}
    } finally {
      setLoading(false);
    }
  }, []);

  // WebSocket for real-time bid updates
  useEffect(() => {
    if (!open) return;
    const wsUrl = process.env.NEXT_PUBLIC_AUCTION_WS_URL || 'wss://nettapu-demo.tunasoft.tech/auction-ws';
    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket(wsUrl);
      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === 'BID_PLACED' || msg.type === 'AUCTION_STATUS') {
            fetchedRef.current = false;
            fetchAuctions();
          }
        } catch {}
      };
    } catch {}
    return () => { ws?.close(); };
  }, [open, fetchAuctions]);

  const handleMouseEnter = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setOpen(true);
    fetchAuctions();
  };

  const handleMouseLeave = () => {
    timerRef.current = setTimeout(() => setOpen(false), 200);
  };

  return (
    <div
      className="relative"
      ref={ref}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Link
        href="/auctions"
        className="flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-150 cursor-pointer text-gray-500 hover:text-gray-900 hover:bg-gray-50"
      >
        İhaleler
        <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </Link>

      {open && (
        <div className="absolute left-0 top-full pt-1 z-50 w-80">
          <div className="rounded-2xl border border-gray-200/80 bg-white shadow-2xl shadow-gray-200/60 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-brand-50 to-white border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Gavel className="h-4 w-4 text-brand-600" />
                <span className="text-sm font-semibold text-gray-800">Mevcut İhaleler</span>
              </div>
              {auctions.some(a => a.status === 'live') && (
                <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                  <span className="relative flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" /><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" /></span>
                  CANLI
                </span>
              )}
            </div>

            {/* Auction list */}
            <div className="max-h-72 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                </div>
              ) : auctions.length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-400">
                  <Gavel className="h-8 w-8 mx-auto mb-2 text-gray-200" />
                  Aktif ihale bulunmuyor
                </div>
              ) : (
                auctions.map((auction) => (
                  <Link
                    key={auction.id}
                    href={`/auctions/${auction.id}`}
                    onClick={() => setOpen(false)}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 group"
                  >
                    <div className="mt-1 shrink-0">
                      <AuctionStatusDot status={auction.status} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate group-hover:text-brand-600 transition-colors">
                        {auction.title}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <TrendingUp className="h-3 w-3" />
                          {Number(auction.currentPrice || auction.startingPrice).toLocaleString('tr-TR')} ₺
                        </span>
                        {auction.status === 'live' && auction.scheduledEnd && (
                          <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                            <Clock className="h-3 w-3" />
                            {formatTimeLeft(auction.scheduledEnd)}
                          </span>
                        )}
                        {auction.status === 'scheduled' && (
                          <span className="text-xs text-amber-600 font-medium">Yakında</span>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-brand-400 transition-colors shrink-0 mt-1" />
                  </Link>
                ))
              )}
            </div>

            {/* Footer */}
            <Link
              href="/auctions"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-1.5 py-3 text-xs font-semibold text-brand-600 hover:bg-brand-50 transition-colors border-t border-gray-100"
            >
              Tüm İhaleleri Gör
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main nav items (excluding auctions which has its own component) ── */
const staticNav = [
  { href: '/parcels', label: 'Arsalar' },
  { href: '/how-it-works', label: 'Nasıl Çalışır?' },
  { href: '/about', label: 'Hakkımızda' },
];

export function Header() {
  const pathname = usePathname();
  const { isAuthenticated, user, avatarUrl } = useAuthStore();
  const s = useSiteSettings();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [supportUnread, setSupportUnread] = useState(0);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Pull the support unread count for the dropdown badge. Cheap: a single
  // SUM query, gated on isAuthenticated.
  useEffect(() => {
    if (!isAuthenticated) { setSupportUnread(0); return; }
    const fetchCount = () => {
      apiClient
        .get<{ count: number }>('/support/unread-count')
        .then(({ data }) => setSupportUnread(data.count))
        .catch(() => undefined);
    };
    fetchCount();
    const id = setInterval(fetchCount, 30000);
    return () => clearInterval(id);
  }, [isAuthenticated]);

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 0); }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isAdmin = user?.roles?.includes('admin') || user?.roles?.includes('superadmin');

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/80 backdrop-blur-xl border-b border-gray-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)]'
          : 'bg-white border-b border-transparent'
      }`}
    >
      {/* Top utility bar */}
      <div className="hidden sm:block border-b border-gray-100/80">
        <div className="mx-auto flex h-8 max-w-7xl items-center justify-between px-4 text-xs text-gray-500">
          <div className="flex items-center gap-4">
            {s.contact_phone && (
              <a href={`tel:${s.contact_phone}`} className="flex items-center gap-1.5 hover:text-gray-700 transition-colors duration-150">
                <Phone className="h-3 w-3" />
                {s.contact_phone}
              </a>
            )}
            {s.contact_email && (
              <a href={`mailto:${s.contact_email}`} className="flex items-center gap-1.5 hover:text-gray-700 transition-colors duration-150">
                <Mail className="h-3 w-3" />
                {s.contact_email}
              </a>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Link href="/contact" className="hover:text-gray-700 transition-colors duration-150">İletişim</Link>
            <span className="text-gray-200">|</span>
            <Link href="/how-it-works" className="flex items-center gap-1 hover:text-gray-700 transition-colors duration-150">
              <HelpCircle className="h-3 w-3" />
              Yardım
            </Link>
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <SiteLogo logoUrl={s.site_logo} title={s.site_title} />

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-0.5">
          {staticNav.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-150 ${
                  isActive ? 'text-brand-600 bg-brand-50' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <AuctionsDropdown />
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-1.5">
          <Link
            href="/parcels?view=map"
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:text-brand-600 rounded-lg hover:bg-gray-50 transition-all duration-150"
          >
            <Map className="h-4 w-4" />
            <span className="hidden lg:inline">Harita</span>
          </Link>

          {isAuthenticated ? (
            <>
              <Link
                href="/profile/favorites"
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:text-rose-500 rounded-lg hover:bg-gray-50 transition-all duration-150"
              >
                <Heart className="h-4 w-4" />
                <span className="hidden lg:inline">Favoriler</span>
              </Link>

              {isAdmin && (
                <Link
                  href="/admin"
                  className="flex items-center gap-1.5 rounded-lg border border-brand-200/80 bg-brand-50/50 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-100/50 transition-all duration-150"
                >
                  <Shield className="h-3.5 w-3.5" />
                  Admin
                </Link>
              )}

              {/* Profile dropdown */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 text-sm font-bold text-white overflow-hidden shadow-sm shadow-brand-500/20 transition-transform duration-150 hover:scale-105 active:scale-95"
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    user?.email?.charAt(0).toUpperCase() || 'U'
                  )}
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-gray-200/80 bg-white/95 backdrop-blur-xl shadow-xl shadow-gray-200/50 z-50 overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50/50">
                      <p className="text-sm font-semibold text-gray-900 truncate">{user?.email}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Kişisel Hesap</p>
                    </div>
                    <div className="py-1">
                      <Link href="/profile" onClick={() => setProfileOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <User className="h-4 w-4 text-gray-400" />
                        Hesabım
                      </Link>
                      <Link href="/profile/favorites" onClick={() => setProfileOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <Heart className="h-4 w-4 text-gray-400" />
                        Favorilerim
                      </Link>
                      <Link href="/profile/support" onClick={() => setProfileOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <MessageSquare className="h-4 w-4 text-gray-400" />
                        <span className="flex-1">Destek Taleplerim</span>
                        {supportUnread > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500 text-white">{supportUnread}</span>
                        )}
                      </Link>
                    </div>
                    <div className="border-t border-gray-100 py-1">
                      <button
                        onClick={async () => {
                          setProfileOpen(false);
                          try { await fetch('/api/auth/session', { method: 'DELETE' }); } catch {}
                          useAuthStore.getState().clearTokens();
                          window.location.href = '/login';
                        }}
                        className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        Çıkış Yap
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-all duration-150">
                Giriş Yap
              </Link>
              <Link href="/register" className="rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-5 py-2 text-sm font-semibold text-white hover:from-brand-600 hover:to-brand-700 shadow-sm shadow-brand-500/20 transition-all duration-200 active:scale-[0.98]">
                Üye Ol
              </Link>
            </div>
          )}

          {/* Mobile menu toggle */}
          <button
            className="ml-1 flex h-9 w-9 items-center justify-center rounded-lg hover:bg-gray-100 md:hidden transition-colors duration-150"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            {mobileOpen ? <X className="h-5 w-5 text-gray-600" /> : <Menu className="h-5 w-5 text-gray-600" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white/95 backdrop-blur-xl">
          <nav className="px-4 py-3 space-y-1">
            {staticNav.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`block px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    isActive ? 'text-brand-600 bg-brand-50' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            <Link
              href="/auctions"
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-2 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                pathname.startsWith('/auctions') ? 'text-brand-600 bg-brand-50' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Gavel className="h-4 w-4" />
              İhaleler
            </Link>
            <div className="border-t border-gray-100 pt-2 mt-2 space-y-1">
              <Link href="/parcels?view=map" onClick={() => setMobileOpen(false)} className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50 rounded-lg">
                <Map className="h-4 w-4 text-gray-400" />
                Harita
              </Link>
              {isAuthenticated && (
                <>
                  <Link href="/profile" onClick={() => setMobileOpen(false)} className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50 rounded-lg">
                    <User className="h-4 w-4 text-gray-400" />
                    Hesabım
                  </Link>
                  <button
                    onClick={async () => {
                      setMobileOpen(false);
                      try { await fetch('/api/auth/session', { method: 'DELETE' }); } catch {}
                      useAuthStore.getState().clearTokens();
                      window.location.href = '/login';
                    }}
                    className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <LogOut className="h-4 w-4" />
                    Çıkış Yap
                  </button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
