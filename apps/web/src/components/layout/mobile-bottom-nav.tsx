'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { Home, Map, Gavel, Heart, User, LogIn } from 'lucide-react';

const navItems = [
  { href: '/',                   label: 'Ana Sayfa', icon: Home },
  { href: '/parcels',            label: 'Arsalar',   icon: Map },
  { href: '/auctions',           label: 'İhaleler',  icon: Gavel },
  { href: '/profile/favorites',  label: 'Favoriler', icon: Heart },
  { href: '/profile',            label: 'Hesabım',   icon: User, authOnly: true, guestHref: '/login', guestLabel: 'Giriş', guestIcon: LogIn },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuthStore();
  const isAdminPage = pathname?.startsWith('/admin');
  const isAuthPage = pathname?.startsWith('/login') || pathname?.startsWith('/register') || pathname?.startsWith('/forgot-password');
  if (isAdminPage || isAuthPage) return null;

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-white border-t border-slate-200 shadow-[0_-4px_12px_rgba(17,17,16,0.06)]">
      <div className="grid grid-cols-5 h-16">
        {navItems.map((item) => {
          const isAuth = item.authOnly;
          const href = isAuth && !isAuthenticated ? (item.guestHref || '/login') : item.href;
          const label = isAuth && !isAuthenticated ? (item.guestLabel || item.label) : item.label;
          const Icon = isAuth && !isAuthenticated && item.guestIcon ? item.guestIcon : item.icon;
          const isActive = item.href === '/'
            ? pathname === '/'
            : pathname?.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={href}
              className={`flex flex-col items-center justify-center gap-1 transition-all relative ${
                isActive ? 'text-brand-700' : 'text-slate-500 active:text-brand-700'
              }`}
              data-testid={`mobile-nav-${item.label.toLowerCase()}`}
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-10 bg-brand-600 rounded-b" />
              )}
              <Icon className={`h-5 w-5 ${isActive ? 'stroke-[2.2]' : 'stroke-[1.8]'}`} />
              <span className={`text-[10px] font-bold leading-none tracking-wide ${isActive ? 'text-brand-700' : 'text-slate-500'}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
