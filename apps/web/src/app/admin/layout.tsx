'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import NotificationBell from '@/components/admin/NotificationBell';
import {
  LayoutDashboard, BarChart3, Users, ShieldBan, Map, Gavel,
  CreditCard, Landmark, ClipboardList, Phone, CalendarDays,
  HandCoins, FileText, HelpCircle, Trophy, MessageSquare,
  Target, Handshake, Settings, Bell, Menu, X, LayoutTemplate,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const ADMIN_ROLES = ['superadmin', 'admin'];

const navSections: Array<{
  title: string | null;
  items: Array<{ href: string; label: string; icon: LucideIcon }>;
}> = [
  { title: null, items: [
    { href: '/admin', label: 'Genel Bakış', icon: LayoutDashboard },
    { href: '/admin/analytics', label: 'Analitik', icon: BarChart3 },
  ]},
  { title: 'Kullanıcılar', items: [
    { href: '/admin/users', label: 'Kullanıcılar', icon: Users },
    { href: '/admin/bans', label: 'Yasaklamalar', icon: ShieldBan },
  ]},
  { title: 'Gayrimenkul', items: [
    { href: '/admin/parcels', label: 'Arsalar', icon: Map },
    { href: '/admin/auctions', label: 'Açık Artırmalar', icon: Gavel },
  ]},
  { title: 'Finans', items: [
    { href: '/admin/deposits', label: 'Depozitolar', icon: CreditCard },
    { href: '/admin/bank-transfers', label: 'Havale / EFT', icon: Landmark },
    { href: '/admin/reconciliation', label: 'Mutabakat', icon: ClipboardList },
  ]},
  { title: 'CRM', items: [
    { href: '/admin/contacts', label: 'İletişim Talepleri', icon: Phone },
    { href: '/admin/appointments', label: 'Randevular', icon: CalendarDays },
    { href: '/admin/offers', label: 'Teklifler', icon: HandCoins },
  ]},
  { title: 'İçerik', items: [
    { href: '/admin/pages', label: 'Sayfalar', icon: FileText },
    { href: '/admin/faq', label: 'S.S.S.', icon: HelpCircle },
    { href: '/admin/references', label: 'Referanslar', icon: Trophy },
    { href: '/admin/testimonials', label: 'Yorumlar', icon: MessageSquare },
  ]},
  { title: 'Pazarlama', items: [
    { href: '/admin/campaigns', label: 'Kampanyalar', icon: Target },
    { href: '/admin/dealers', label: 'Bayiler / Danışmanlar', icon: Handshake },
  ]},
  { title: 'Sistem', items: [
    { href: '/admin/settings', label: 'Ayarlar', icon: Settings },
    { href: '/admin/notifications', label: 'Bildirimler', icon: Bell },
  ]},
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) { router.replace('/login?returnTo=/admin'); return; }
    if (user && !user.roles?.some((r) => ADMIN_ROLES.includes(r))) { router.replace('/'); }
  }, [isLoading, isAuthenticated, user, router]);

  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center"><p className="text-[var(--muted-foreground)]">Yükleniyor...</p></div>;
  }
  if (!user || !user.roles?.some((r) => ADMIN_ROLES.includes(r))) return null;

  const navItems = navSections.map((section, i) => (
    <div key={i}>
      {section.title && (
        <p className="px-3 text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">{section.title}</p>
      )}
      <div className="mt-1 space-y-0.5">
        {section.items.map((item) => {
          const Icon = item.icon;
          const isActive = item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm cursor-pointer transition-colors duration-150 ${
                isActive ? 'bg-brand-50 text-brand-700 font-medium' : 'text-[var(--foreground)] hover:bg-[var(--background)]'
              }`}>
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  ));

  return (
    <div className="flex flex-1">
      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-[9999] lg:hidden">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="fixed left-0 top-0 bottom-0 w-72 bg-white p-4 overflow-y-auto shadow-2xl z-[10000]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded bg-brand-500">
                  <span className="text-xs font-bold text-white">NT</span>
                </div>
                <span className="text-sm font-bold text-brand-500">Admin</span>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-md hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="space-y-4">{navItems}</nav>
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-slate-50 p-4 lg:block overflow-y-auto">
        <div className="flex items-center gap-2 px-3 py-2">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-brand-500">
            <span className="text-xs font-bold text-white">NT</span>
          </div>
          <span className="text-sm font-bold text-brand-500">Admin Panel</span>
        </div>
        <nav className="mt-4 space-y-4">{navItems}</nav>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0">
        <div className="border-b border-slate-200 px-4 lg:px-6 py-2 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1.5 rounded-md hover:bg-slate-200">
              <Menu className="h-5 w-5" />
            </button>
            <span className="text-xs text-slate-500">Admin: {user.email}</span>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <Link href="/" className="text-xs text-brand-500 hover:underline">Siteye Dön →</Link>
          </div>
        </div>
        <main className="p-3 sm:p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
