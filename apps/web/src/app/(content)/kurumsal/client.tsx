'use client';

import { useRef, useState, useEffect } from 'react';
import { usePageContent } from '@/hooks/use-page-content';
import { motion, useInView } from 'framer-motion';
import {
  ArrowRight,
  Gavel,
  MapPin,
  Shield,
  Users,
  ChevronRight,
  Star,
  Zap,
  Building2,
  TrendingUp,
  BarChart3,
  HeartHandshake,
  ChevronDown,
} from 'lucide-react';
import Link from 'next/link';

/* ─── helpers ──────────────────────────────────────────── */

function parseArray<T>(val: unknown, defaults: T[]): T[] {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch {}
  }
  return defaults;
}

/* ─── defaults ────────────────────────────────────────── */

const DEFAULT_CONTENT = {
  hero_title: 'Gayrimenkulde Geleceği Bugün Yaşatıyoruz',
  hero_subtitle: "Türkiye'nin En Hızlı Büyüyen PropTech Firması",
  hero_description:
    "NetTapu, canlı ihale motoru, harita tabanlı arama ve güvenli ödeme altyapısıyla Türkiye'nin gayrimenkul ekosistemini yeniden tanımlıyor. Binlerce yatırımcının güvendiği platform.",
  stats: [
    { value: '24', label: 'İşlem Hacmi' },
    { value: '10000', label: 'Aktif Kullanıcı' },
    { value: '500', label: 'Tamamlanan İhale' },
    { value: '99', label: 'Sistem Uptime' },
  ],
};

function useCountUp(target: number, duration = 2200, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [start, target, duration]);
  return count;
}

function MetricCard({
  prefix,
  value,
  suffix,
  label,
  index,
}: {
  prefix?: string;
  value: number;
  suffix: string;
  label: string;
  index: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const animated = useCountUp(value, 2200, inView);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.12, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
      className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 text-center shadow-sm transition-all duration-300 hover:border-emerald-200 hover:shadow-md"
    >
      <p className="text-4xl font-black text-emerald-600 sm:text-5xl">
        {prefix}
        {inView ? animated.toLocaleString('tr-TR') : '0'}
        {suffix}
      </p>
      <p className="mt-2 text-sm font-medium text-slate-500">{label}</p>
    </motion.div>
  );
}

function BentoCard({
  title,
  description,
  icon: Icon,
  gradient,
  large = false,
  href = '#',
  index,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  gradient: string;
  large?: boolean;
  href?: string;
  index: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all duration-300 hover:border-emerald-200 hover:shadow-md ${large ? 'sm:col-span-2' : ''}`}
    >
      <div className="relative">
        <div
          className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} shadow-md`}
        >
          <Icon className="h-6 w-6 text-white" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">{description}</p>
        <Link
          href={href}
          className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-emerald-600 transition-all duration-200 group-hover:gap-2 group-hover:text-emerald-700"
        >
          Keşfet <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </motion.div>
  );
}

function CorporateLinkCard({
  icon: Icon,
  title,
  description,
  href,
  gradient,
  index,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  href: string;
  gradient: string;
  index: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.07, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        href={href}
        className="group flex items-start gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all duration-300 hover:border-emerald-200 hover:shadow-md"
      >
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} shadow-md transition-transform duration-300 group-hover:scale-110`}
        >
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors duration-200">
            {title}
          </p>
          <p className="mt-0.5 text-sm text-slate-500 group-hover:text-slate-600 transition-colors duration-200">
            {description}
          </p>
        </div>
        <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-300 transition-all duration-200 group-hover:translate-x-1 group-hover:text-emerald-500" />
      </Link>
    </motion.div>
  );
}

export function KurumsalContent() {
  const heroRef = useRef(null);
  const content = usePageContent('page_content_kurumsal', DEFAULT_CONTENT);
  const statsRaw = parseArray(content.stats, DEFAULT_CONTENT.stats);
  const METRIC_PREFIXES = ['₺', '', '', ''];
  const METRIC_SUFFIXES = ['M+', '+', '+', '.9%'];
  const metrics = statsRaw.map((s, i) => ({
    prefix: METRIC_PREFIXES[i] ?? '',
    value: parseInt(String(s.value).replace(/\D/g, ''), 10) || 0,
    suffix: METRIC_SUFFIXES[i] ?? '',
    label: s.label,
  }));

  const bentoItems = [
    {
      title: 'Canlı İhale Sistemi',
      description:
        'Gerçek zamanlı teklif motoru, deterministik sıralama ve yarış koşulu önleme altyapısıyla hukuken bağlayıcı canlı ihaleler.',
      icon: Gavel,
      gradient: 'from-emerald-500 to-teal-600',
      large: true,
      href: '/auctions',
    },
    {
      title: 'Arsa İlanları',
      description: "Türkiye'nin 81 ilinde binlerce arsa ve taşınmaz ilanı.",
      icon: MapPin,
      gradient: 'from-indigo-500 to-violet-600',
      href: '/parcels',
    },
    {
      title: 'Harita Arama',
      description: 'Konum tabanlı interaktif harita ile parsel sorgulama.',
      icon: Building2,
      gradient: 'from-cyan-500 to-blue-600',
      href: '/map',
    },
    {
      title: 'Güvenli Ödeme',
      description: 'PCI-DSS uyumlu sanal POS ve 3D Secure koruması.',
      icon: Shield,
      gradient: 'from-amber-500 to-orange-600',
      href: '/how-it-works',
    },
    {
      title: 'Danışmanlık',
      description: '7/24 uzman gayrimenkul danışmanlık hizmeti.',
      icon: HeartHandshake,
      gradient: 'from-rose-500 to-pink-600',
      href: '/contact',
    },
  ];

  const corporateLinks = [
    {
      icon: Users,
      title: 'Hakkımızda',
      description: 'NetTapu ekibi ve kuruluş hikayemiz',
      href: '/about',
      gradient: 'from-emerald-500 to-teal-600',
    },
    {
      icon: Star,
      title: 'Vizyon',
      description: "Gayrimenkulde Türkiye'nin en güvenilir platformu",
      href: '/vision',
      gradient: 'from-amber-500 to-orange-500',
    },
    {
      icon: Zap,
      title: 'Misyon',
      description: 'Şeffaf ve teknolojik gayrimenkul ekosistemi',
      href: '/mission',
      gradient: 'from-cyan-500 to-blue-600',
    },
    {
      icon: TrendingUp,
      title: 'Nasıl Çalışır',
      description: 'Platform işleyişi ve süreç adımları',
      href: '/how-it-works',
      gradient: 'from-indigo-500 to-violet-600',
    },
    {
      icon: BarChart3,
      title: 'Referanslar',
      description: 'Başarılı satışlar ve müşteri hikayeleri',
      href: '/references',
      gradient: 'from-violet-500 to-purple-700',
    },
    {
      icon: Building2,
      title: 'Projelerimiz',
      description: 'Aktif ve tamamlanan gayrimenkul projeleri',
      href: '/projects',
      gradient: 'from-rose-500 to-pink-600',
    },
  ];

  const avatarColors = [
    'from-emerald-500 to-teal-600',
    'from-indigo-500 to-violet-600',
    'from-amber-500 to-orange-500',
    'from-cyan-500 to-blue-600',
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* FULL-PAGE LIGHT HERO */}
      <section
        ref={heroRef}
        className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600 px-4 sm:px-6 lg:px-8"
      >
        {/* Subtle dot pattern */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.12) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        {/* Soft ambient blobs */}
        <div className="pointer-events-none absolute -left-32 top-1/4 h-[500px] w-[500px] rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 top-1/3 h-[400px] w-[400px] rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-1/4 left-1/3 h-[360px] w-[360px] rounded-full bg-white/10 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-4xl text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65 }}
            className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-white/30 bg-white/20 px-5 py-2 text-sm font-semibold text-white"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
            </span>
            {content.hero_subtitle}
          </motion.div>

          {/* H1 */}
          <motion.h1
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-5xl font-black leading-tight tracking-tight text-white sm:text-6xl lg:text-7xl"
          >
            {content.hero_title}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.22 }}
            className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/80"
          >
            {content.hero_description}
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.35 }}
            className="mt-9 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
          >
            <Link
              href="/parcels"
              className="group inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-bold text-emerald-700 shadow-xl transition-all duration-300 hover:bg-emerald-50 hover:shadow-2xl"
            >
              Platforma Giriş Yap
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
            <a
              href="#hizmetler"
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/20 px-7 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:bg-white/30"
            >
              Daha Fazla Öğren
            </a>
          </motion.div>

          {/* Social proof mini-bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.48 }}
            className="mt-10 inline-flex flex-wrap items-center justify-center gap-4 rounded-2xl border border-white/20 bg-white/10 px-6 py-3.5 backdrop-blur-sm"
          >
            <div className="flex items-center">
              <div className="flex -space-x-2.5">
                {avatarColors.map((g, i) => (
                  <div
                    key={i}
                    className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-white/30 bg-gradient-to-br ${g} text-xs font-bold text-white`}
                  >
                    {String.fromCharCode(65 + i)}
                  </div>
                ))}
              </div>
              <span className="ml-3 text-sm font-medium text-white">
                10.000+ aktif yatırımcı
              </span>
            </div>
            <div className="h-4 w-px bg-white/20" />
            <div className="flex items-center gap-1.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              ))}
              <span className="text-sm font-semibold text-white">4.9/5</span>
            </div>
            <div className="h-4 w-px bg-white/20" />
            <span className="text-sm font-semibold text-white">₺2.4M+ işlem</span>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            className="flex flex-col items-center gap-1 text-white/50"
          >
            <span className="text-xs tracking-widest">Kaydır</span>
            <ChevronDown className="h-4 w-4" />
          </motion.div>
        </motion.div>
      </section>

      {/* METRICS */}
      <section className="bg-white px-4 py-20 sm:px-6 lg:px-8 border-b border-slate-100">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {metrics.map((m, i) => (
              <MetricCard
                key={m.label}
                prefix={m.prefix}
                value={m.value}
                suffix={m.suffix}
                label={m.label}
                index={i}
              />
            ))}
          </div>
        </div>
      </section>

      {/* BENTO SERVICES GRID */}
      <section id="hizmetler" className="bg-slate-50 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55 }}
              className="mb-3 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-emerald-600"
            >
              <span className="h-px w-8 bg-emerald-500" />
              Hizmetlerimiz
              <span className="h-px w-8 bg-emerald-500" />
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.08 }}
              className="text-3xl font-extrabold text-slate-900 sm:text-4xl"
            >
              Tek platformda{' '}
              <span className="text-emerald-600">
                her şey
              </span>
            </motion.h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {bentoItems.map((item, i) => (
              <BentoCard key={item.title} {...item} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* CORPORATE LINKS */}
      <section className="bg-white px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55 }}
              className="mb-3 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-emerald-600"
            >
              <span className="h-px w-8 bg-emerald-500" />
              Kurumsal Bilgiler
              <span className="h-px w-8 bg-emerald-500" />
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.08 }}
              className="text-3xl font-extrabold text-slate-900 sm:text-4xl"
            >
              Bizi daha iyi{' '}
              <span className="text-emerald-600">
                tanıyın
              </span>
            </motion.h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {corporateLinks.map((link, i) => (
              <CorporateLinkCard key={link.href} {...link} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIAL */}
      <section className="bg-slate-50 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-8 sm:p-12 shadow-sm"
          >
            <div className="pointer-events-none absolute left-0 top-0 h-full w-1 rounded-l-3xl bg-gradient-to-b from-emerald-500 via-teal-400 to-transparent" />

            <div className="relative">
              <div className="mb-6 flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <blockquote className="text-xl font-light italic leading-relaxed text-slate-700 sm:text-2xl">
                &ldquo;NetTapu üzerinden katıldığım ilk ihalede arsamı aldım. Sistem son derece
                şeffaf, süreç hızlı ve güvenilirdi. Tekrar kullanacağım.&rdquo;
              </blockquote>
              <div className="mt-6 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-lg font-black text-white">
                  MK
                </div>
                <div>
                  <p className="font-bold text-slate-900">Murat Karahan</p>
                  <p className="text-sm text-slate-500">Gayrimenkul Yatırımcısı, İstanbul</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="px-4 pb-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600 p-10 text-center sm:p-16 shadow-lg"
          >
            <div className="pointer-events-none absolute -left-20 -top-20 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -right-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }}
            />

            <div className="relative">
              <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-white/70">
                Yatırıma Başlayın
              </p>
              <h2 className="text-3xl font-black text-white sm:text-4xl lg:text-5xl">
                Gayrimenkul yatırımının{' '}
                <span className="text-emerald-200">
                  geleceğine
                </span>{' '}
                hoş geldiniz
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-white/80">
                Türkiye&apos;nin dört bir yanındaki arsa ve gayrimenkul fırsatlarını keşfedin.
                Canlı ihalede yerinizi alın.
              </p>
              <div className="mt-9 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Link
                  href="/parcels"
                  className="group inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-sm font-bold text-emerald-700 shadow-xl transition-all duration-300 hover:bg-emerald-50 hover:shadow-2xl"
                >
                  Arsaları Keşfet
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/20 px-8 py-4 text-sm font-semibold text-white transition-all duration-300 hover:bg-white/30"
                >
                  Bizimle İletişime Geçin
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
