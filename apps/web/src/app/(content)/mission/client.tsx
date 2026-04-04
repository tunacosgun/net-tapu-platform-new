'use client';

import { motion, useInView } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import { usePageContent } from '@/hooks/use-page-content';
import Link from 'next/link';
import {
  Eye,
  Lock,
  Globe2,
  Zap,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Users,
  Shield,
  Award,
} from 'lucide-react';

/* ─── counter hook ────────────────────────────────────── */

function useCountUp(target: number, duration = 2200, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const step = (ts: number) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(ease * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [start, target, duration]);
  return count;
}

/* ─── mission card ────────────────────────────────────── */

function MissionCard({
  icon: Icon,
  title,
  description,
  gradient,
  accentBg,
  index,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  gradient: string;
  accentBg: string;
  index: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.12, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
      className="group relative overflow-hidden rounded-xl border border-slate-100 bg-white p-6 shadow-sm transition-shadow duration-300 hover:shadow-md"
    >
      <div
        className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} shadow-md`}
      >
        <Icon className="h-5 w-5 text-white" />
      </div>
      <h3 className="mb-2 text-lg font-bold text-slate-900">{title}</h3>
      <p className="text-sm leading-relaxed text-slate-600">{description}</p>
    </motion.div>
  );
}

/* ─── commitment item ─────────────────────────────────── */

function CommitmentItem({ text, index }: { text: string; index: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  return (
    <motion.li
      ref={ref}
      initial={{ opacity: 0, x: -24 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ delay: index * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-start gap-3"
    >
      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
      <span className="text-sm leading-relaxed text-slate-700">{text}</span>
    </motion.li>
  );
}

/* ─── metric card ─────────────────────────────────────── */

function MetricCard({
  icon: Icon,
  target,
  suffix,
  label,
  gradient,
  index,
}: {
  icon: React.ElementType;
  target: number;
  suffix: string;
  label: string;
  gradient: string;
  index: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const count = useCountUp(target, 2000, inView);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={inView ? { opacity: 1, scale: 1 } : {}}
      transition={{ delay: index * 0.12, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="group relative overflow-hidden rounded-xl border border-slate-100 bg-white p-6 text-center shadow-sm transition-shadow duration-300 hover:shadow-md"
    >
      <div
        className={`mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} shadow-md`}
      >
        <Icon className="h-5 w-5 text-white" />
      </div>
      <p className="text-4xl font-black bg-gradient-to-r from-emerald-600 to-emerald-800 bg-clip-text text-transparent">
        {inView ? count.toLocaleString('tr-TR') : '0'}
        {suffix}
      </p>
      <p className="mt-2 text-sm font-medium text-slate-500">{label}</p>
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
  hero_title: 'Gayrimenkul yatırımını herkes için güvenli kılmak',
  hero_subtitle: 'Misyonumuz',
  hero_description:
    "Şeffaflık, güvenlik ve erişilebilirlik ilkeleri üzerine inşa edilmiş bir platform olarak, Türkiye'nin her köşesinden vatandaşlara adil ve güvenilir yatırım fırsatları sunuyoruz.",
  mission_statement: 'Size verdiğimiz söz',
  pillars: [
    { title: 'Şeffaflık', description: 'Her işlemi kayıt altına alarak alıcı ve satıcı arasında tam şeffaflık sağlamak. Fiyat geçmişi, ihale süreçleri ve tapu bilgileri açık erişimde tutulur.' },
    { title: 'Güvenlik', description: '3D Secure ödeme altyapısı, kimlik doğrulama ve yasal çerçevede işlem garantisi. Tüm veriler şifreli kanallarla korunur, her adımda denetlenebilir.' },
    { title: 'Erişilebilirlik', description: 'Her bütçeye uygun gayrimenkul fırsatları sunarak yatırımı demokratikleştirmek. Web, mobil ve tablet — her platformdan, her coğrafyadan kolay erişim.' },
    { title: 'İnovasyon', description: 'Canlı ihale motoru, harita tabanlı arayüz, akıllı fiyat analizi ve bildirim sistemi ile sektörün en yenilikçi platformunu sunmak.' },
  ],
};

const MISSION_ICONS = [Eye, Lock, Globe2, Zap];
const MISSION_GRADIENTS = [
  'from-emerald-500 to-emerald-700',
  'from-blue-500 to-blue-700',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
];
const MISSION_ACCENT_BGS = ['bg-emerald-50', 'bg-blue-50', 'bg-teal-50', 'bg-amber-50'];

/* ─── main ────────────────────────────────────────────── */

export function MissionContent() {
  const content = usePageContent('page_content_mission', DEFAULT_CONTENT);
  const pillarsRaw = parseArray(content.pillars, DEFAULT_CONTENT.pillars);
  const missionCards = pillarsRaw.map((p, i) => ({
    icon: MISSION_ICONS[i % MISSION_ICONS.length],
    gradient: MISSION_GRADIENTS[i % MISSION_GRADIENTS.length],
    accentBg: MISSION_ACCENT_BGS[i % MISSION_ACCENT_BGS.length],
    title: p.title,
    description: p.description,
  }));

  const commitments = [
    'Tüm işlemlerde yasal uyumluluk ve notere dayalı güvence',
    'Kişisel verilerin KVKK kapsamında korunması',
    '7/24 uzman danışman desteği ve rehberlik hizmeti',
    'Adil ve rekabetçi ihale ortamı, eşit fırsat ilkesi',
    'Şeffaf komisyon yapısı, gizli ücret yok',
    'Hızlı ve güvenilir tapu devir süreçleri',
  ];

  const metrics = [
    { icon: Users, target: 10000, suffix: '+', label: 'Kayıtlı Kullanıcı', gradient: 'from-emerald-500 to-emerald-700' },
    { icon: Shield, target: 1200, suffix: '+', label: 'Başarılı Satış', gradient: 'from-emerald-500 to-teal-600' },
    { icon: TrendingUp, target: 5000, suffix: '+', label: 'Aktif İlan', gradient: 'from-blue-500 to-blue-700' },
    { icon: Award, target: 81, suffix: '', label: 'İl Kapsamı', gradient: 'from-amber-500 to-orange-600' },
  ];

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
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            {content.hero_title}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/80">
            {content.hero_description}
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/parcels"
              className="group inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-emerald-700 shadow-sm transition-all duration-200 hover:bg-emerald-50"
            >
              Arsaları Keşfet
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-white/10"
            >
              Hakkımızda
            </Link>
          </div>
        </div>
      </motion.div>

      {/* ── MISSION CARDS ────────────────────────────────── */}
      <section className="mb-10">
        <div className="mb-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-2 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-emerald-600"
          >
            <span className="h-px w-8 bg-emerald-500" />
            Temel İlkeler
            <span className="h-px w-8 bg-emerald-500" />
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="text-3xl font-extrabold text-slate-900 sm:text-4xl"
          >
            Misyonumuzu taşıyan{' '}
            <span className="bg-gradient-to-r from-emerald-600 to-emerald-800 bg-clip-text text-transparent">
              dört sütun
            </span>
          </motion.h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {missionCards.map((card, i) => (
            <MissionCard key={card.title} {...card} index={i} />
          ))}
        </div>
      </section>

      {/* ── COMMITMENTS ──────────────────────────────────── */}
      <section className="mb-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative overflow-hidden rounded-2xl bg-slate-50 p-8 sm:p-10"
        >
          <div className="absolute left-0 top-0 h-full w-1 rounded-l-2xl bg-gradient-to-b from-emerald-500 via-emerald-400 to-transparent" />

          <div className="mb-2 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-emerald-600">
            <span className="h-px w-6 bg-emerald-500" />
            Taahhütlerimiz
          </div>
          <h2 className="mb-7 text-2xl font-extrabold text-slate-900 sm:text-3xl">
            Size verdiğimiz{' '}
            <span className="bg-gradient-to-r from-emerald-600 to-emerald-800 bg-clip-text text-transparent">
              söz
            </span>
          </h2>

          <ul className="space-y-4">
            {commitments.map((c, i) => (
              <CommitmentItem key={i} text={c} index={i} />
            ))}
          </ul>
        </motion.div>
      </section>

      {/* ── METRICS ──────────────────────────────────────── */}
      <section className="mb-10">
        <div className="mb-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-2 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-emerald-600"
          >
            <span className="h-px w-8 bg-emerald-500" />
            Etkimiz
            <span className="h-px w-8 bg-emerald-500" />
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="text-3xl font-extrabold text-slate-900 sm:text-4xl"
          >
            Rakamlarla{' '}
            <span className="bg-gradient-to-r from-emerald-600 to-emerald-800 bg-clip-text text-transparent">
              NetTapu
            </span>
          </motion.h2>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {metrics.map((m, i) => (
            <MetricCard key={m.label} {...m} index={i} />
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
            Birlikte Güçlüyüz
          </p>
          <h2 className="text-3xl font-extrabold sm:text-4xl">
            Güvenilir gayrimenkul yatırımı için{' '}
            <span className="text-emerald-200">bize katılın</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-white/80">
            Türkiye&apos;nin dört bir yanındaki arsa fırsatlarını keşfedin ve
            güvenli ihale ortamında yerinizi alın.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/parcels"
              className="group inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-bold text-emerald-700 shadow-sm transition-all duration-200 hover:bg-emerald-50"
            >
              Arsaları Keşfet
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-7 py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-white/10"
            >
              Hakkımızda
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
