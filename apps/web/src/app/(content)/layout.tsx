'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { ChevronDown, ArrowRight, Phone, Mail, Info, Eye, Target, Settings2, Building2, FolderOpen, Star, Newspaper, HelpCircle, BookOpen, Headphones, Scale, Undo2 } from 'lucide-react';

type LinkItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }> };

const navLinks: LinkItem[] = [
  { href: '/about',              label: 'Hakkımızda',           icon: Info },
  { href: '/vision',             label: 'Vizyon',               icon: Eye },
  { href: '/mission',            label: 'Misyon',               icon: Target },
  { href: '/how-it-works',       label: 'Nasıl Çalışır',        icon: Settings2 },
  { href: '/faq',                label: 'S.S.S.',               icon: HelpCircle },
  { href: '/references',         label: 'Referanslar',          icon: Building2 },
  { href: '/projects',           label: 'Projelerimiz',         icon: FolderOpen },
  { href: '/testimonials',       label: 'Müşteri Yorumları',    icon: Star },
  { href: '/press',              label: 'Basın',                icon: Newspaper },
  { href: '/legal',              label: 'Yasal Bilgiler',       icon: Scale },
  { href: '/withdrawal-rights',  label: 'Cayma Hakkı',          icon: Undo2 },
  { href: '/real-estate-guide',  label: 'Gayrimenkul Rehberi',  icon: BookOpen },
  { href: '/post-sale',          label: 'Satış Sonrası',        icon: Headphones },
  { href: '/contact',            label: 'İletişim',             icon: Mail },
];

export default function ContentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const currentLink = navLinks.find((l) => pathname === l.href || pathname.startsWith(l.href + '/'));

  return (
    <div className="bg-white min-h-screen">
      {/* Breadcrumb banner */}
      <div className="border-b border-slate-200 bg-gradient-olive-soft">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 py-6">
          <nav className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 mb-3" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-brand-700 transition-colors">Ana Sayfa</Link>
            <span className="text-slate-300">/</span>
            <span className="text-brand-700">{currentLink?.label || 'Kurumsal'}</span>
          </nav>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-ink-900 tracking-tight">
            {currentLink?.label || 'Kurumsal'}
          </h1>
        </div>
      </div>

      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 py-8">
        {/* Mobile nav */}
        <div className="lg:hidden mb-5">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex w-full items-center justify-between rounded-md border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-ink-800"
          >
            <span className="flex items-center gap-2">
              {currentLink?.icon && <currentLink.icon className="h-4 w-4 text-brand-600" />}
              {currentLink?.label || 'Kurumsal Sayfalar'}
            </span>
            <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${mobileOpen ? 'rotate-180' : ''}`} />
          </button>
          {mobileOpen && (
            <div className="mt-1 rounded-md border border-slate-200 bg-white shadow-lg overflow-hidden">
              <nav className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                {navLinks.map((link) => {
                  const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 text-sm ${
                        isActive ? 'bg-brand-50 text-brand-700 font-bold' : 'text-ink-700 hover:bg-slate-50 font-medium'
                      }`}
                    >
                      <Icon className={`h-4 w-4 ${isActive ? 'text-brand-700' : 'text-slate-400'}`} />
                      {link.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
          )}
        </div>

        <div className="lg:flex lg:gap-8">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block lg:w-64 lg:shrink-0">
            <div className="sticky top-24">
              <p className="section-label mb-3 px-3">Kurumsal</p>
              <nav className="flex flex-col gap-0.5">
                {navLinks.map((link) => {
                  const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`relative flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm transition-all ${
                        isActive
                          ? 'bg-brand-50 text-brand-700 font-bold'
                          : 'text-ink-700 hover:bg-slate-50 hover:text-brand-700 font-medium'
                      }`}
                    >
                      {isActive && <span className="absolute left-0 top-2 bottom-2 w-0.5 bg-brand-600 rounded-r" />}
                      <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-brand-700' : 'text-slate-400'}`} />
                      {link.label}
                    </Link>
                  );
                })}
              </nav>

              {/* Help card */}
              <div className="mt-6 rounded-md border border-slate-200 bg-gradient-olive-soft p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-brand-700 mb-1.5">Yardım?</p>
                <p className="text-sm font-bold text-ink-900 mb-1">Uzman ekibimiz yanınızda</p>
                <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                  Sorularınız için bize ulaşın. 7/24 hizmetinizdeyiz.
                </p>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-1 rounded-md bg-brand-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-700 transition-colors"
                >
                  <Phone className="h-3 w-3" />
                  Bize Ulaşın
                  <ArrowRight className="h-3 w-3 ml-0.5" />
                </Link>
              </div>
            </div>
          </aside>

          <main className="min-w-0 flex-1 max-w-4xl">
            <div className="prose prose-slate max-w-none">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
