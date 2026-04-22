'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import {
  User, Heart, FileText, Gavel, CreditCard, Search, Bell, LogOut,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const profileNavItems: Array<{ href: string; label: string; icon: LucideIcon }> = [
  { href: '/profile',                label: 'Profilim',           icon: User },
  { href: '/profile/favorites',      label: 'Favorilerim',        icon: Heart },
  { href: '/profile/offers',         label: 'Tekliflerim',        icon: FileText },
  { href: '/profile/auctions',       label: 'İhale Geçmişim',     icon: Gavel },
  { href: '/profile/payments',       label: 'Ödeme Geçmişim',     icon: CreditCard },
  { href: '/profile/saved-searches', label: 'Kayıtlı Aramalar',   icon: Search },
  { href: '/profile/notifications',  label: 'Bildirim Ayarları',  icon: Bell },
];

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace('/login?returnTo=/profile');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-brand-600" />
          <p className="text-sm text-slate-500 font-semibold">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) return null;

  const firstName = (user as any).firstName || user.email?.split('@')[0] || '';
  const initial = (firstName || user.email || 'U').charAt(0).toUpperCase();

  return (
    <div className="bg-white min-h-screen">
      {/* Page header banner */}
      <div className="border-b border-slate-200 bg-gradient-olive-soft">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 py-8">
          <div className="flex items-center gap-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-md bg-brand-600 text-white font-heading text-2xl font-extrabold shadow-brand">
              {initial}
            </div>
            <div className="min-w-0">
              <span className="overline">Hesabım</span>
              <h1 className="mt-1.5 font-heading text-2xl sm:text-3xl font-extrabold text-ink-900 tracking-tight truncate">
                {firstName || 'Hoş Geldiniz'}
              </h1>
              <p className="text-sm text-slate-600 truncate">{user.email}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 py-6">
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Sidebar */}
          <aside className="lg:w-60 shrink-0">
            <nav className="flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 border-b lg:border-b-0 border-slate-200">
              {profileNavItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.href === '/profile'
                    ? pathname === '/profile'
                    : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`relative flex items-center gap-2.5 whitespace-nowrap rounded-md px-3.5 py-2.5 text-sm transition-all ${
                      isActive
                        ? 'bg-brand-50 text-brand-700 font-bold'
                        : 'text-ink-700 hover:bg-slate-50 hover:text-brand-700 font-medium'
                    }`}
                  >
                    {isActive && <span className="absolute left-0 top-2 bottom-2 w-0.5 bg-brand-600 rounded-r" />}
                    <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-brand-700' : 'text-slate-400'}`} />
                    {item.label}
                  </Link>
                );
              })}
              <button
                onClick={async () => {
                  try { await fetch('/api/auth/session', { method: 'DELETE' }); } catch {}
                  useAuthStore.getState().clearTokens();
                  window.location.href = '/login';
                }}
                className="hidden lg:flex items-center gap-2.5 whitespace-nowrap rounded-md px-3.5 py-2.5 text-sm text-red-600 hover:bg-red-50 font-medium mt-3 border-t border-slate-100 pt-3"
              >
                <LogOut className="h-4 w-4" />
                Çıkış Yap
              </button>
            </nav>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">{children}</div>
        </div>
      </div>
    </div>
  );
}
