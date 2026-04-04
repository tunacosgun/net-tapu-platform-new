'use client';

import { motion, useInView, AnimatePresence } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import { usePageContent } from '@/hooks/use-page-content';
import Link from 'next/link';
import {
  Shield,
  Cpu,
  Smartphone,
  Headphones,
  ArrowRight,
  Users,
  BarChart3,
  CheckCircle2,
  MapPin,
  ChevronRight,
} from 'lucide-react';

/* ─── helpers ─────────────────────────────────────────── */

function useCountUp(target: number, duration = 2000, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [start, target, duration]);
  return count;
}

/* ─── sub-components ──────────────────────────────────── */

function StatCard({
  value,
  label,
  index,
}: {
  value: string;
  label: string;
  index: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const numericTarget = parseInt(value.replace(/\D/g, ''), 10);
  const suffix = value.replace(/[\d.]/g, '');
  const animated = useCountUp(numericTarget, 2000, inView);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.12, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 text-center shadow-sm transition-shadow duration-300 hover:shadow-md"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 rounded-2xl" />
      <p className="relative bg-gradient-to-r from-emerald-600 to-emerald-700 bg-clip-text text-4xl font-black text-transparent">
        {inView ? animated.toLocaleString('tr-TR') : '0'}
        {suffix}
      </p>
      <p className="relative mt-2 text-sm font-medium text-slate-500">{label}</p>
    </motion.div>
  );
}

function ValueCard({
  icon: Icon,
  title,
  description,
  gradient,
  index,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  gradient: string;
  index: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.1, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
      className="group relative overflow-hidden rounded-xl border border-slate-100 bg-white p-6 shadow-sm transition-shadow duration-300 hover:shadow-md"
    >
      <div
        className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} shadow-md`}
      >
        <Icon className="h-5 w-5 text-white" />
      </div>
      <h3 className="mb-2 text-lg font-bold text-slate-900">{title}</h3>
      <p className="text-sm leading-relaxed text-slate-600">{description}</p>
    </motion.div>
  );
}

function TeamCard({
  name,
  role,
  initials,
  gradient,
  index,
}: {
  name: string;
  role: string;
  initials: string;
  gradient: string;
  index: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={inView ? { opacity: 1, scale: 1 } : {}}
      transition={{ delay: index * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="group flex flex-col items-center rounded-xl border border-slate-100 bg-white p-6 text-center shadow-sm transition-shadow duration-300 hover:shadow-md"
    >
      <div
        className={`mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br ${gradient} text-2xl font-black text-white shadow-lg`}
      >
        {initials}
      </div>
      <p className="font-bold text-slate-900">{name}</p>
      <p className="mt-1 text-sm text-slate-500">{role}</p>
    </motion.div>
  );
}

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
  hero_title: "Türkiye'nin en güvenilir gayrimenkul platformu",
  hero_subtitle: 'Hakkımızda',
  hero_description:
    'NetTapu, teknolojiyi ve şeffaflığı bir araya getirerek gayrimenkul alım-satımında yeni bir dönem başlatıyor. Canlı ihale sistemi, harita tabanlı arayüz ve güvenli ödeme altyapısı ile yatırımcıların yanındayız.',
  story_title: 'Hikayemiz',
  story_text:
    'NetTapu, 2023 yılında Türkiye\'nin gayrimenkul piyasasındaki en büyük sorunu çözmek için kuruldu: güven eksikliği ve bilgi asimetrisi. Geleneksel yöntemlerle yürütülen arazi satışları, hem alıcı hem satıcı için belirsizlik yaratıyordu.\n\nBugün 81 ilde aktif olan platformumuz, canlı ihale motoru, harita tabanlı arayüz ve yasal güvenceli tapu süreci ile Türkiye\'nin en şeffaf gayrimenkul ekosistemini sunuyor.',
  stats: [
    { value: '10.000+', label: 'Kayıtlı Kullanıcı' },
    { value: '5.000+', label: 'Aktif İlan' },
    { value: '1.200+', label: 'Başarılı Satış' },
    { value: '81', label: 'İl Kapsamı' },
  ],
  values: [
    { title: 'Güvenilirlik', description: 'Tüm işlemler yasal çerçevede, tam şeffaflıkla yürütülür. Notere dayalı tapu garantisi ile her adımda güvendeyiz.' },
    { title: 'Teknoloji', description: 'Canlı ihale motoru, harita tabanlı arayüz ve gerçek zamanlı teklif sistemi ile sektörü dijital çağa taşıyoruz.' },
    { title: 'Erişilebilirlik', description: 'Web, iOS ve Android — her cihazdan sorunsuz erişim. Türkiye\'nin her köşesinden piyasaya ulaşın.' },
    { title: 'Destek', description: '7/24 uzman danışman desteği ve rehberlik hizmeti. Sorularınız için her zaman yanınızdayız.' },
  ],
  team: [
    { name: 'Ahmet Yılmaz', role: 'Kurucu & CEO', initials: 'AY' },
    { name: 'Elif Kaya', role: 'CTO', initials: 'EK' },
    { name: 'Mehmet Demir', role: 'Hukuk Direktörü', initials: 'MD' },
    { name: 'Zeynep Arslan', role: 'Ürün Yöneticisi', initials: 'ZA' },
  ],
};

/* ─── icon maps ───────────────────────────────────────── */

const VALUE_ICONS = [Shield, Cpu, Smartphone, Headphones];
const VALUE_GRADIENTS = [
  'from-emerald-500 to-emerald-700',
  'from-blue-500 to-blue-700',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
];
const TEAM_GRADIENTS = [
  'from-emerald-500 to-emerald-700',
  'from-blue-500 to-blue-700',
  'from-emerald-500 to-teal-600',
  'from-rose-500 to-pink-600',
];

/* ─── main ────────────────────────────────────────────── */

export function AboutPageContent() {
  const storyRef = useRef(null);
  const storyInView = useInView(storyRef, { once: true });

  const content = usePageContent('page_content_about', DEFAULT_CONTENT);

  const stats = parseArray(content.stats, DEFAULT_CONTENT.stats);
  const values = parseArray(content.values, DEFAULT_CONTENT.values);
  const team = parseArray(content.team, DEFAULT_CONTENT.team);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      {/* ── HERO ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="relative mb-10 overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-700 via-emerald-600 to-emerald-800 px-8 py-12 text-white"
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-white/8 blur-2xl" />
        <div className="relative">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-200" />
            {content.hero_subtitle}
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            {content.hero_title}
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-white/80">
            {content.hero_description}
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/parcels"
              className="group inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-emerald-700 shadow-sm transition-all duration-200 hover:bg-emerald-50"
            >
              Arsaları Keşfet
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-white/10"
            >
              Bize Ulaşın
            </Link>
          </div>
        </div>
      </motion.div>

      {/* ── STATS ────────────────────────────────────────── */}
      <div className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s, i) => (
          <StatCard key={s.label} value={s.value} label={s.label} index={i} />
        ))}
      </div>

      {/* ── STORY ────────────────────────────────────────── */}
      <section ref={storyRef} className="mb-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={storyInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="relative overflow-hidden rounded-2xl bg-slate-50 p-8 sm:p-10"
        >
          <div className="absolute left-0 top-0 h-full w-1 rounded-l-2xl bg-gradient-to-b from-emerald-500 via-emerald-400 to-transparent" />

          <div className="mb-3 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-emerald-600">
            <span className="h-px w-8 bg-emerald-500" />
            Hikayemiz
          </div>

          <blockquote className="mb-6 text-xl font-light italic leading-relaxed text-slate-700 sm:text-2xl">
            &ldquo;Gayrimenkul yatırımı herkes için ulaşılabilir olmak zorunda —
            coğrafyadan, bütçeden ve bürokratik engelden bağımsız olarak.&rdquo;
          </blockquote>

          <div className="space-y-4 text-base leading-relaxed text-slate-600">
            <p>
              NetTapu, 2023 yılında Türkiye&apos;nin gayrimenkul piyasasındaki en büyük
              sorunu çözmek için kuruldu: güven eksikliği ve bilgi asimetrisi. Geleneksel
              yöntemlerle yürütülen arazi satışları, hem alıcı hem satıcı için belirsizlik
              yaratıyordu.
            </p>
            <p>
              Bugün 81 ilde aktif olan platformumuz, canlı ihale motoru, harita tabanlı
              arayüz ve yasal güvenceli tapu süreci ile Türkiye&apos;nin en şeffaf
              gayrimenkul ekosistemini sunuyor.
            </p>
          </div>
        </motion.div>
      </section>

      {/* ── VALUES ───────────────────────────────────────── */}
      <section className="mb-10">
        <div className="mb-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-2 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-emerald-600"
          >
            <span className="h-px w-8 bg-emerald-500" />
            Değerlerimiz
            <span className="h-px w-8 bg-emerald-500" />
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl font-extrabold text-slate-900 sm:text-4xl"
          >
            Bizi farklı kılan{' '}
            <span className="bg-gradient-to-r from-emerald-600 to-emerald-800 bg-clip-text text-transparent">
              dört temel ilke
            </span>
          </motion.h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {values.map((v, i) => (
            <ValueCard key={v.title} icon={VALUE_ICONS[i % VALUE_ICONS.length]} gradient={VALUE_GRADIENTS[i % VALUE_GRADIENTS.length]} title={v.title} description={v.description} index={i} />
          ))}
        </div>
      </section>

      {/* ── TEAM ─────────────────────────────────────────── */}
      <section className="mb-10">
        <div className="mb-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-2 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-emerald-600"
          >
            <span className="h-px w-8 bg-emerald-500" />
            Ekibimiz
            <span className="h-px w-8 bg-emerald-500" />
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl font-extrabold text-slate-900 sm:text-4xl"
          >
            Vizyonu hayata{' '}
            <span className="bg-gradient-to-r from-emerald-600 to-emerald-800 bg-clip-text text-transparent">
              geçirenler
            </span>
          </motion.h2>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {team.map((member, i) => (
            <TeamCard key={member.name} name={member.name} role={member.role} initials={member.initials} gradient={TEAM_GRADIENTS[i % TEAM_GRADIENTS.length]} index={i} />
          ))}
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-700 via-emerald-600 to-emerald-800 p-10 text-center text-white sm:p-14"
      >
        <div className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-12 -right-12 h-48 w-48 rounded-full bg-white/8 blur-2xl" />
        <div className="relative">
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-emerald-200">
            Hazır mısınız?
          </p>
          <h2 className="text-3xl font-extrabold sm:text-4xl">
            Gayrimenkul yatırımının{' '}
            <span className="text-emerald-200">geleceğine</span>{' '}
            hoş geldiniz
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-white/80">
            Türkiye&apos;nin dört bir yanındaki arsa fırsatlarını keşfedin,
            güvenli ihalede yerinizi alın.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/parcels"
              className="group inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-bold text-emerald-700 shadow-sm transition-all duration-200 hover:bg-emerald-50"
            >
              Arsaları Keşfet
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
            <a
              href="mailto:info@nettapu.com"
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-7 py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-white/10"
            >
              info@nettapu.com
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
