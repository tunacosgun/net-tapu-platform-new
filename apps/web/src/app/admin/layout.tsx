'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import NotificationBell from '@/components/admin/NotificationBell';
import { NetTapuLogo } from '@/components/ui/nettapu-logo';
import apiClient from '@/lib/api-client';
import {
  LayoutDashboard, BarChart3, Users, ShieldBan, Map, Gavel,
  CreditCard, Landmark, ClipboardList, Phone, CalendarDays,
  HandCoins, FileText, HelpCircle, Trophy, MessageSquare,
  Target, Handshake, Settings, Bell, Menu, X, ExternalLink, BookOpen, LogOut, Mail,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const ADMIN_ROLES = ['superadmin', 'admin'];

const navSections: Array<{
  title: string | null;
  items: Array<{ href: string; label: string; icon: LucideIcon; badgeKey?: string }>;
}> = [
  { title: null, items: [
    { href: '/admin',           label: 'Genel Bakış', icon: LayoutDashboard },
    { href: '/admin/analytics', label: 'Analitik',    icon: BarChart3 },
    { href: '/admin/reports',   label: 'Raporlar',    icon: BarChart3 },
  ]},
  { title: 'Kullanıcılar', items: [
    { href: '/admin/users', label: 'Kullanıcılar',  icon: Users },
    { href: '/admin/bans',  label: 'Yasaklamalar',  icon: ShieldBan },
  ]},
  { title: 'Gayrimenkul', items: [
    { href: '/admin/parcels',    label: 'Arsalar',          icon: Map },
    { href: '/admin/categories', label: 'Kategoriler',      icon: Map },
    { href: '/admin/auctions',   label: 'Açık Artırmalar',  icon: Gavel },
  ]},
  { title: 'Finans', items: [
    { href: '/admin/deposits',       label: 'Depozitolar',  icon: CreditCard },
    { href: '/admin/bank-transfers', label: 'Havale / EFT', icon: Landmark },
    { href: '/admin/reconciliation', label: 'Mutabakat',    icon: ClipboardList },
    { href: '/admin/installments',   label: 'Taksitli Satış', icon: CreditCard },
    { href: '/admin/mail-order',     label: 'Mail Order',    icon: CreditCard },
  ]},
  { title: 'Entegrasyonlar', items: [
    { href: '/admin/ekent', label: 'E-Kent Sağlayıcılar', icon: Map },
  ]},
  { title: 'CRM', items: [
    { href: '/admin/support',                 label: 'Destek Mesajları',     icon: MessageSquare, badgeKey: 'support' },
    { href: '/admin/contacts',                label: 'İletişim Talepleri',   icon: Phone },
    { href: '/admin/consultants/applications', label: 'Danışman Başvuruları', icon: Handshake },
    { href: '/admin/appointments',            label: 'Randevular',           icon: CalendarDays },
    { href: '/admin/offers',                  label: 'Teklifler',            icon: HandCoins },
    { href: '/admin/newsletter',              label: 'E-Bülten Aboneleri',   icon: Mail },
  ]},
  { title: 'İçerik', items: [
    { href: '/admin/pages',               label: 'Sayfalar',          icon: FileText },
    { href: '/admin/faq',                 label: 'S.S.S.',            icon: HelpCircle },
    { href: '/admin/real-estate-guide',   label: 'Rehber Makaleleri', icon: BookOpen },
    { href: '/admin/references',          label: 'Referanslar',       icon: Trophy },
    { href: '/admin/testimonials',        label: 'Yorumlar',          icon: MessageSquare },
  ]},
  { title: 'Pazarlama', items: [
    { href: '/admin/campaigns', label: 'Kampanyalar',           icon: Target },
    { href: '/admin/dealers',   label: 'Bayiler / Danışmanlar', icon: Handshake },
  ]},
  { title: 'Sistem', items: [
    { href: '/admin/settings',      label: 'Ayarlar',    icon: Settings },
    { href: '/admin/notifications', label: 'Bildirimler', icon: Bell },
  ]},
];

function NavItems({ pathname, onNavigate, badges }: { pathname: string; onNavigate?: () => void; badges: Record<string, number> }) {
  return (
    <nav className="space-y-5 px-2">
      {navSections.map((section, i) => (
        <div key={i}>
          {section.title && (
            <p className="section-label mb-1.5 px-2">{section.title}</p>
          )}
          <div className="space-y-0.5">
            {section.items.map((item) => {
              const Icon = item.icon;
              const exact = item.href === '/admin';
              const isActive = exact ? pathname === '/admin' : pathname.startsWith(item.href);
              const count = item.badgeKey ? badges[item.badgeKey] || 0 : 0;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={`relative flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] transition-all ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 font-bold'
                      : 'text-ink-700 hover:bg-slate-100 hover:text-brand-700 font-medium'
                  }`}
                >
                  {isActive && <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-brand-600 rounded-r" />}
                  <Icon className={`h-[15px] w-[15px] shrink-0 ${isActive ? 'text-brand-700' : 'text-slate-400'}`} />
                  <span className="flex-1">{item.label}</span>
                  {count > 0 && (
                    <span className="ml-auto px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500 text-white min-w-[18px] text-center">
                      {count}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

function SidebarHeader({ compact = false, onClose }: { compact?: boolean; onClose?: () => void }) {
  return (
    <div className={`flex items-center gap-2.5 px-4 py-4 border-b border-slate-200 ${compact ? 'justify-between' : ''}`}>
      <Link href="/admin" className="flex items-center gap-2.5">
        <NetTapuLogo variant="light" width={110} height={28} />
        <span className="badge badge-dark text-[9px]">Admin</span>
      </Link>
      {onClose && (
        <button onClick={onClose} className="p-1 rounded hover:bg-slate-100 text-slate-500">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [badges, setBadges] = useState<Record<string, number>>({});

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) { router.replace('/login?returnTo=/admin'); return; }
    if (user && !user.roles?.some((r) => ADMIN_ROLES.includes(r))) { router.replace('/'); }
  }, [isLoading, isAuthenticated, user, router]);

  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  useEffect(() => {
    if (!isAuthenticated || !user?.roles?.some((r) => ADMIN_ROLES.includes(r))) return;
    const fetchBadges = () => {
      apiClient
        .get<{ count: number }>('/admin/support/unread-count')
        .then(({ data }) => setBadges((b) => ({ ...b, support: data.count })))
        .catch(() => undefined);
    };
    fetchBadges();
    const id = setInterval(fetchBadges, 30000);
    return () => clearInterval(id);
  }, [isAuthenticated, user]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-brand-600" />
          <p className="text-sm text-slate-500 font-semibold">Yükleniyor...</p>
        </div>
      </div>
    );
  }
  if (!user || !user.roles?.some((r) => ADMIN_ROLES.includes(r))) return null;

  return (
    <div className="flex flex-1 bg-slate-50 min-h-screen">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-[9999] lg:hidden">
          <div
            className="absolute inset-0 bg-ink-900/50 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-2xl overflow-y-auto z-10 flex flex-col">
            <SidebarHeader compact onClose={() => setSidebarOpen(false)} />
            <div className="flex-1 overflow-y-auto py-4">
              <NavItems pathname={pathname} onNavigate={() => setSidebarOpen(false)} badges={badges} />
            </div>
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 border-r border-slate-200 bg-white lg:flex flex-col overflow-y-auto">
        <SidebarHeader />
        <div className="flex-1 overflow-y-auto py-4">
          <NavItems pathname={pathname} badges={badges} />
        </div>

        {/* Footer / user card */}
        <div className="border-t border-slate-200 p-3">
          <div className="flex items-center gap-2.5 rounded-md px-2 py-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white text-xs font-bold">
              {user.email?.charAt(0).toUpperCase() || 'A'}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-ink-800 truncate">{user.email}</p>
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Yönetici</p>
            </div>
            <button
              onClick={async () => {
                try { await fetch('/api/auth/session', { method: 'DELETE' }); } catch {}
                useAuthStore.getState().clearTokens();
                window.location.href = '/login';
              }}
              className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
              title="Çıkış"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar */}
        <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 lg:px-6 shrink-0 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md hover:bg-slate-100 text-ink-700"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="lg:hidden">
              <NetTapuLogo variant="light" width={90} height={22} />
            </div>
            <span className="hidden lg:block text-xs text-slate-500 font-medium">
              <span className="text-slate-400">Yönetim Paneli</span>
              {pathname !== '/admin' && <span className="mx-2 text-slate-300">/</span>}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <Link
              href="/"
              target="_blank"
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-brand-700 transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Siteye Dön</span>
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
