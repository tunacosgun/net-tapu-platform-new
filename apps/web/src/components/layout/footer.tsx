'use client';

import Link from 'next/link';
import { useSiteSettings } from '@/hooks/use-site-settings';
import { Phone, Mail, Instagram, Youtube, MessageCircle, MapPin, Clock, Shield, Award, Scale } from 'lucide-react';
import { NetTapuLogo } from '@/components/ui/nettapu-logo';

const footerSections = [
  {
    title: 'Platform',
    links: [
      { href: '/parcels',           label: 'Arsalar' },
      { href: '/auctions',          label: 'Açık Artırmalar' },
      { href: '/parcels?view=map',  label: 'Harita Görünümü' },
      { href: '/how-it-works',      label: 'Nasıl Çalışır?' },
      { href: '/campaigns',         label: 'Kampanyalar' },
    ],
  },
  {
    title: 'Kurumsal',
    links: [
      { href: '/about',        label: 'Hakkımızda' },
      { href: '/vision',       label: 'Vizyon' },
      { href: '/mission',      label: 'Misyon' },
      { href: '/references',   label: 'Referanslar' },
      { href: '/press',        label: 'Basın' },
    ],
  },
  {
    title: 'Yasal',
    links: [
      { href: '/legal',              label: 'Kullanım Koşulları' },
      { href: '/withdrawal-rights',  label: 'Cayma Hakkı' },
      { href: '/legal',              label: 'Gizlilik Politikası' },
      { href: '/legal',              label: 'KVKK Aydınlatma' },
      { href: '/auction-rules',      label: 'İhale Kuralları' },
    ],
  },
  {
    title: 'Destek',
    links: [
      { href: '/faq',                label: 'Sık Sorulan Sorular' },
      { href: '/real-estate-guide',  label: 'Gayrimenkul Rehberi' },
      { href: '/post-sale',          label: 'Satış Sonrası' },
      { href: '/contact',            label: 'İletişim' },
    ],
  },
];

const trustItems = [
  { icon: Shield, label: 'SSL Sertifikalı' },
  { icon: Scale,  label: 'KVKK Uyumlu' },
  { icon: Award,  label: '256-bit Güvenlik' },
  { icon: Clock,  label: '7/24 Destek' },
];

export function Footer() {
  const s = useSiteSettings();
  const phone = s.contact_phone || '0850 XXX XX XX';
  const email = s.contact_email || 'info@nettapu.com';
  const tagline = s.footer_tagline || 'Gayrimenkul ve arsa alım-satımı için Türkiye\'nin güvenilir online açık artırma platformu.';
  const copyright = s.copyright_text || `© ${new Date().getFullYear()} NetTapu. Tüm hakları saklıdır.`;

  return (
    <footer className="bg-ink-900 text-ink-300 mt-24" data-testid="main-footer">
      {/* Trust strip */}
      <div className="border-b border-ink-800">
        <div className="mx-auto max-w-[1280px] px-6 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {trustItems.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-ink-800 text-brand-400">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white uppercase tracking-wider">{label}</p>
                  <p className="text-[10px] text-ink-400">Güvence altında</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="mx-auto max-w-[1280px] px-6 py-14">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-12">
          {/* Brand column */}
          <div className="lg:col-span-4">
            <Link href="/" className="inline-block" data-testid="footer-logo">
              {s.site_logo ? (
                <img src={s.site_logo} alt={s.site_title || 'NetTapu'} className="h-10 w-auto" />
              ) : (
                <NetTapuLogo variant="dark" width={160} height={40} />
              )}
            </Link>

            <p className="mt-5 text-sm text-ink-400 leading-relaxed max-w-sm">{tagline}</p>

            {/* Contact */}
            <div className="mt-6 space-y-2.5">
              <a href={`tel:${phone}`} className="flex items-center gap-3 text-sm text-ink-300 hover:text-brand-400 transition-colors group">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-ink-800 group-hover:bg-brand-900 transition-colors">
                  <Phone className="h-4 w-4 text-ink-300 group-hover:text-brand-400" />
                </div>
                <span className="font-semibold tabular-nums">{phone}</span>
              </a>
              <a href={`mailto:${email}`} className="flex items-center gap-3 text-sm text-ink-300 hover:text-brand-400 transition-colors group">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-ink-800 group-hover:bg-brand-900 transition-colors">
                  <Mail className="h-4 w-4 text-ink-300 group-hover:text-brand-400" />
                </div>
                <span className="font-semibold">{email}</span>
              </a>
              {s.contact_address && (
                <div className="flex items-start gap-3 text-sm text-ink-400">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-ink-800 shrink-0">
                    <MapPin className="h-4 w-4 text-ink-400" />
                  </div>
                  <span className="mt-1 leading-relaxed">{s.contact_address}</span>
                </div>
              )}
            </div>

            {/* Social */}
            <div className="mt-6 flex gap-2">
              {[
                { href: s.social_instagram || 'https://instagram.com/nettapu', icon: Instagram, label: 'Instagram' },
                { href: s.social_twitter   || 'https://twitter.com/nettapu',   icon: () => (
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                ), label: 'X' },
                { href: s.social_youtube   || 'https://youtube.com/@nettapu',  icon: Youtube,   label: 'YouTube' },
                ...(s.whatsapp_number ? [{ href: `https://wa.me/${s.whatsapp_number}`, icon: MessageCircle, label: 'WhatsApp' }] : []),
              ].map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-9 w-9 items-center justify-center rounded-md bg-ink-800 text-ink-300 hover:bg-brand-600 hover:text-white transition-colors"
                    aria-label={social.label}
                    data-testid={`footer-social-${social.label.toLowerCase()}`}
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Link columns */}
          <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-8">
            {footerSections.map((section) => (
              <div key={section.title}>
                <h3 className="text-xs font-heading font-bold text-white uppercase tracking-widest">
                  {section.title}
                </h3>
                <div className="h-0.5 w-8 bg-brand-500 mt-3" />
                <ul className="mt-5 space-y-3">
                  {section.links.map((link, idx) => (
                    <li key={`${link.href}-${idx}`}>
                      <Link
                        href={link.href}
                        className="text-sm text-ink-400 hover:text-brand-400 transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="bg-ink-950 border-t border-ink-800">
        <div className="mx-auto max-w-[1280px] px-6 py-5">
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between text-xs">
            <p className="text-ink-500 font-medium">{copyright}</p>
            <div className="flex items-center gap-5 text-ink-500">
              <span>Eser Group iştirakidir.</span>
              <span className="flex items-center gap-1.5 text-brand-400 font-bold">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-pulse" />
                Sistem Aktif
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
