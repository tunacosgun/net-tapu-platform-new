'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useSiteSettings } from '@/hooks/use-site-settings';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Map, Heart, Shield, User, LogOut, Menu, X, Bell,
  ChevronDown, Phone, Mail, Search,
  Settings, CreditCard, Gavel,
  Info, Eye, Target, Settings2, Building2, FolderOpen, Star, Newspaper, BookOpen, Headphones,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface NavDropdownItem {
  label: string;
  href: string;
  description?: string;
  icon?: string; // lucide icon name
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function resolveUploadUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('/')) return url; // already relative
  try {
    const parsed = new URL(url);
    if (parsed.pathname.startsWith('/uploads/') || parsed.pathname.startsWith('/site/')) {
      return parsed.pathname;
    }
  } catch {}
  return url;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  info: Info,
  eye: Eye,
  target: Target,
  settings: Settings2,
  building: Building2,
  folder: FolderOpen,
  star: Star,
  newspaper: Newspaper,
  book: BookOpen,
  headphones: Headphones,
  mail: Mail,
};

function NavIcon({ name, className }: { name?: string; className?: string }) {
  if (!name) return null;
  const Icon = ICON_MAP[name];
  if (!Icon) return null;
  return <Icon className={className} />;
}

// ─── Default corporate items ──────────────────────────────────────────────────

const DEFAULT_CORPORATE_ITEMS: NavDropdownItem[] = [
  { label: 'Hakkımızda', href: '/about', description: 'Şirketimiz ve hikayemiz', icon: 'info' },
  { label: 'Vizyon', href: '/vision', description: '2030 hedeflerimiz', icon: 'eye' },
  { label: 'Misyon', href: '/mission', description: 'Değerlerimiz ve taahhütlerimiz', icon: 'target' },
  { label: 'Nasıl Çalışır?', href: '/how-it-works', description: 'Platform süreci', icon: 'settings' },
  { label: 'Referanslar', href: '/references', description: 'İş ortaklarımız', icon: 'building' },
  { label: 'Projelerimiz', href: '/projects', description: 'Tamamlanan projeler', icon: 'folder' },
  { label: 'Müşteri Yorumları', href: '/testimonials', description: 'Kullanıcı deneyimleri', icon: 'star' },
  { label: 'Basın', href: '/press', description: 'Medyada NetTapu', icon: 'newspaper' },
  { label: 'Gayrimenkul Rehberi', href: '/real-estate-guide', description: 'Kapsamlı yatırım rehberi', icon: 'book' },
  { label: 'Satış Sonrası', href: '/post-sale', description: 'Destek süreçleri', icon: 'headphones' },
  { label: 'İletişim', href: '/contact', description: 'Bize ulaşın', icon: 'mail' },
];

// ─── Main nav ─────────────────────────────────────────────────────────────────

const mainNav = [
  { href: '/parcels', label: 'Arsalar', icon: Map },
  { href: '/auctions', label: 'İhaleler', icon: Gavel },
];

// ─── Corporate Mega Dropdown ──────────────────────────────────────────────────

function CorporateDropdown({
  items,
  pathname,
}: {
  items: NavDropdownItem[];
  pathname: string | null;
}) {
  const cols = items.length > 6 ? 3 : 2;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className="absolute left-1/2 top-full mt-2 -translate-x-1/2 z-50"
      style={{ minWidth: cols === 3 ? 680 : 480 }}
    >
      {/* Arrow */}
      <div className="flex justify-center">
        <div className="h-2 w-4 overflow-hidden -mb-px">
          <div className="h-3 w-3 bg-white border-l border-t border-slate-100 rotate-45 translate-y-1 mx-auto shadow-sm" />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden p-3">
        <div
          className="grid gap-1"
          style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
        >
          {items.map((item) => {
            const isActive = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group relative flex items-start gap-3 rounded-xl px-3 py-3 transition-all duration-150 ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                {/* Left accent bar on hover */}
                <div
                  className={`absolute left-0 top-3 bottom-3 w-0.5 rounded-full transition-all duration-150 ${
                    isActive ? 'bg-emerald-500' : 'bg-transparent group-hover:bg-emerald-300'
                  }`}
                />

                {/* Icon dot */}
                <div
                  className={`mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg transition-colors duration-150 ${
                    isActive
                      ? 'bg-emerald-100 text-emerald-600'
                      : 'bg-slate-100 text-slate-500 group-hover:bg-emerald-50 group-hover:text-emerald-500'
                  }`}
                >
                  <NavIcon name={item.icon} className="h-3.5 w-3.5" />
                </div>

                <div className="min-w-0">
                  <p className={`text-sm font-semibold leading-tight ${isActive ? 'text-emerald-700' : 'text-slate-800'}`}>
                    {item.label}
                  </p>
                  {item.description && (
                    <p className="mt-0.5 text-xs text-slate-500 leading-snug">
                      {item.description}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function HeaderPro() {
  const pathname = usePathname();
  const { isAuthenticated, user, avatarUrl } = useAuthStore();
  const s = useSiteSettings();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [corporateOpen, setCorporateOpen] = useState(false);
  const [mobileCorporateOpen, setMobileCorporateOpen] = useState(false);
  const corporateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Parse corporate nav items from settings
  let corporateItems: NavDropdownItem[] = DEFAULT_CORPORATE_ITEMS;
  if (s.corporate_nav_items) {
    try {
      const parsed = JSON.parse(s.corporate_nav_items as string);
      if (Array.isArray(parsed) && parsed.length > 0) {
        corporateItems = parsed;
      }
    } catch {}
  }

  const resolvedLogo = resolveUploadUrl(s.site_logo as string | undefined);

  // Fetch real notification count (only if endpoint exists)
  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    const fetchNotifs = async () => {
      try {
        const { default: apiClient } = await import('@/lib/api-client');
        const { data } = await apiClient.get('/notifications', { params: { limit: 10, unreadOnly: true } });
        if (cancelled) return;
        const items = data?.data || data || [];
        setNotifications(Array.isArray(items) ? items : []);
        const unread = Array.isArray(items) ? items.filter((n: any) => !n.isRead).length : 0;
        setNotificationCount(unread);
        return true;
      } catch {
        if (!cancelled) setNotificationCount(0);
        return false;
      }
    };
    fetchNotifs().then((ok) => {
      if (ok && !cancelled) {
        const iv = setInterval(fetchNotifs, 60000);
        return () => clearInterval(iv);
      }
    });
    return () => { cancelled = true; };
  }, [isAuthenticated]);

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 20); }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isAuthPage = pathname?.startsWith('/login') || pathname?.startsWith('/register') || pathname?.startsWith('/forgot-password');
  const isAdminPage = pathname?.startsWith('/admin');
  if (isAuthPage || isAdminPage) return null;

  const isAdmin = user?.roles?.includes('admin') || user?.roles?.includes('superadmin');

  const isCorporateActive = corporateItems.some((item) => pathname?.startsWith(item.href));

  function handleCorporateEnter() {
    if (corporateTimer.current) clearTimeout(corporateTimer.current);
    setCorporateOpen(true);
  }

  function handleCorporateLeave() {
    corporateTimer.current = setTimeout(() => setCorporateOpen(false), 120);
  }

  return (
    <>
      <div className="h-[72px] lg:h-[108px]" />
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/95 backdrop-blur-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
            : 'bg-white'
        }`}
        data-testid="main-header"
      >
        {/* Top utility bar */}
        <div className="hidden lg:block bg-slate-50">
          <div className="mx-auto flex h-9 max-w-7xl items-center justify-between px-6 text-xs">
            <div className="flex items-center gap-6">
              {s.contact_phone && (
                <a
                  href={`tel:${s.contact_phone}`}
                  className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 transition-colors duration-200"
                  data-testid="header-phone"
                >
                  <Phone className="h-3.5 w-3.5" />
                  <span className="font-medium">{s.contact_phone}</span>
                </a>
              )}
              {s.contact_email && (
                <a
                  href={`mailto:${s.contact_email}`}
                  className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 transition-colors duration-200"
                  data-testid="header-email"
                >
                  <Mail className="h-3.5 w-3.5" />
                  <span className="font-medium">{s.contact_email}</span>
                </a>
              )}
            </div>
            <div className="flex items-center gap-6">
              <Link
                href="/contact"
                className="font-medium text-slate-500 hover:text-emerald-600 transition-colors duration-200"
              >
                İletişim
              </Link>
              <Link
                href="/how-it-works"
                className="flex items-center gap-1.5 font-medium text-slate-500 hover:text-emerald-600 transition-colors duration-200"
              >
                <Settings2 className="h-3.5 w-3.5" />
                Yardım
              </Link>
            </div>
          </div>
        </div>

        {/* Main navigation */}
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group" data-testid="header-logo">
            {!s._loaded ? (
              /* Skeleton while settings load — no flash of wrong logo */
              <div className="h-10 w-32 animate-pulse rounded-lg bg-slate-100" />
            ) : resolvedLogo ? (
              <img
                src={resolvedLogo}
                alt={s.site_title || 'NetTapu'}
                className="h-10 object-contain transition-transform duration-200 group-hover:scale-105"
              />
            ) : (
              <>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white text-sm font-bold shadow-sm transition-transform duration-200 group-hover:scale-105">
                  NT
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="text-lg font-bold font-heading text-slate-900 tracking-tight">
                    {s.site_title || 'NetTapu'}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                    Arsa & Açık Artırma
                  </span>
                </div>
              </>
            )}
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1" data-testid="desktop-nav">
            {mainNav.map((item) => {
              const isActive = item.href === '/' ? pathname === '/' : pathname?.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'text-emerald-600 bg-emerald-50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                  data-testid={`nav-link-${item.href.replace('/', '')}`}
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  {item.label}
                </Link>
              );
            })}

            {/* Kurumsal dropdown trigger */}
            <div
              className="relative"
              onMouseEnter={handleCorporateEnter}
              onMouseLeave={handleCorporateLeave}
            >
              <button
                className={`relative flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 select-none ${
                  isCorporateActive || corporateOpen
                    ? 'text-emerald-600 bg-emerald-50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
                data-testid="nav-corporate-btn"
                aria-expanded={corporateOpen}
                aria-haspopup="true"
              >
                Kurumsal
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform duration-200 ${corporateOpen ? 'rotate-180' : ''}`}
                />
              </button>

              <AnimatePresence>
                {corporateOpen && (
                  <CorporateDropdown items={corporateItems} pathname={pathname} />
                )}
              </AnimatePresence>
            </div>
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Search - Desktop only */}
            <button
              className="hidden lg:flex items-center justify-center h-10 w-10 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-all duration-200"
              data-testid="header-search-btn"
            >
              <Search className="h-5 w-5" />
            </button>

            {isAuthenticated ? (
              <>
                {/* Notifications */}
                <button
                  className="relative flex items-center justify-center h-10 w-10 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-all duration-200"
                  data-testid="header-notifications-btn"
                  onClick={() => setNotifOpen(!notifOpen)}
                >
                  <Bell className="h-5 w-5" />
                  {notificationCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full" />
                  )}
                </button>

                {/* Favorites */}
                <Link
                  href="/profile/favorites"
                  className="hidden lg:flex items-center justify-center h-10 w-10 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-50 transition-all duration-200"
                  data-testid="header-favorites-btn"
                >
                  <Heart className="h-5 w-5" />
                </Link>

                {/* Admin Badge */}
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="hidden lg:flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-all duration-200"
                    data-testid="header-admin-btn"
                  >
                    <Shield className="h-3.5 w-3.5" />
                    <span>Admin</span>
                  </Link>
                )}

                {/* Profile dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 text-sm font-bold text-white overflow-hidden shadow-sm transition-all duration-200 hover:bg-emerald-700"
                    data-testid="header-profile-btn"
                  >
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                    ) : (
                      user?.email?.charAt(0).toUpperCase() || 'U'
                    )}
                  </button>

                  <AnimatePresence>
                    {profileOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-64 rounded-xl bg-white shadow-[0_10px_40px_rgba(0,0,0,0.1)] overflow-hidden"
                        onMouseLeave={() => setProfileOpen(false)}
                        data-testid="profile-dropdown"
                      >
                        {/* Profile Header */}
                        <div className="px-4 py-4 bg-slate-50">
                          <p className="text-sm font-bold font-heading text-slate-900 truncate">{user?.email}</p>
                          <p className="text-xs text-slate-500 mt-1 font-medium">Kişisel Hesap</p>
                        </div>

                        {/* Menu Items */}
                        <div className="py-2">
                          <Link
                            href="/profile"
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors duration-150"
                          >
                            <User className="h-4 w-4 text-slate-400" />
                            <span>Hesabım</span>
                          </Link>
                          <Link
                            href="/profile/favorites"
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors duration-150"
                          >
                            <Heart className="h-4 w-4 text-slate-400" />
                            <span>Favorilerim</span>
                          </Link>
                          <Link
                            href="/profile/auctions"
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors duration-150"
                          >
                            <Gavel className="h-4 w-4 text-slate-400" />
                            <span>İhalelerim</span>
                          </Link>
                          <Link
                            href="/profile/payments"
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors duration-150"
                          >
                            <CreditCard className="h-4 w-4 text-slate-400" />
                            <span>Ödemeler</span>
                          </Link>
                        </div>

                        {/* Logout */}
                        <div className="py-2 border-t border-slate-100">
                          <button
                            onClick={async () => {
                              setProfileOpen(false);
                              try { await fetch('/api/auth/session', { method: 'DELETE' }); } catch {}
                              useAuthStore.getState().clearTokens();
                              window.location.href = '/login';
                            }}
                            className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors duration-150"
                            data-testid="logout-btn"
                          >
                            <LogOut className="h-4 w-4" />
                            <span>Çıkış Yap</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="hidden lg:block px-4 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-50 transition-all duration-200"
                  data-testid="header-login-btn"
                >
                  Giriş Yap
                </Link>
                <Link
                  href="/register"
                  className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 shadow-sm hover:shadow transition-all duration-200"
                  data-testid="header-register-btn"
                >
                  Üye Ol
                </Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              className="ml-2 flex h-10 w-10 items-center justify-center rounded-lg hover:bg-slate-50 lg:hidden transition-colors duration-200"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menu"
              data-testid="mobile-menu-toggle"
            >
              {mobileOpen ? <X className="h-5 w-5 text-slate-600" /> : <Menu className="h-5 w-5 text-slate-600" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden bg-white shadow-lg overflow-hidden"
              data-testid="mobile-menu"
            >
              <nav className="px-4 py-4 space-y-1">
                {/* Main nav items */}
                {mainNav.map((item) => {
                  const isActive = pathname?.startsWith(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-lg transition-colors duration-150 ${
                        isActive ? 'text-emerald-600 bg-emerald-50' : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {Icon && <Icon className="h-5 w-5" />}
                      {item.label}
                    </Link>
                  );
                })}

                {/* Kurumsal expandable section */}
                <div>
                  <button
                    onClick={() => setMobileCorporateOpen(!mobileCorporateOpen)}
                    className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-sm font-semibold rounded-lg transition-colors duration-150 ${
                      isCorporateActive ? 'text-emerald-600 bg-emerald-50' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                    data-testid="mobile-corporate-toggle"
                  >
                    <span className="flex items-center gap-3">
                      <Building2 className="h-5 w-5" />
                      Kurumsal
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform duration-200 ${mobileCorporateOpen ? 'rotate-180' : ''}`}
                    />
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
                        <div className="ml-4 mt-1 border-l-2 border-emerald-100 pl-3 space-y-0.5">
                          {corporateItems.map((item) => {
                            const isActive = pathname?.startsWith(item.href);
                            return (
                              <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => { setMobileOpen(false); setMobileCorporateOpen(false); }}
                                className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors duration-150 ${
                                  isActive
                                    ? 'text-emerald-600 bg-emerald-50 font-semibold'
                                    : 'text-slate-600 hover:bg-slate-50 font-medium'
                                }`}
                              >
                                <span className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md ${isActive ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                  <NavIcon name={item.icon} className="h-3.5 w-3.5" />
                                </span>
                                {item.label}
                              </Link>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Auth section */}
                {isAuthenticated && (
                  <div className="pt-2 mt-2 border-t border-slate-100 space-y-1">
                    <Link
                      href="/profile"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-lg"
                    >
                      <User className="h-5 w-5 text-slate-400" />
                      Hesabım
                    </Link>
                    <button
                      onClick={async () => {
                        setMobileOpen(false);
                        try { await fetch('/api/auth/session', { method: 'DELETE' }); } catch {}
                        useAuthStore.getState().clearTokens();
                        window.location.href = '/login';
                      }}
                      className="flex w-full items-center gap-3 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <LogOut className="h-5 w-5" />
                      Çıkış Yap
                    </button>
                  </div>
                )}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
