'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { usePageContent } from '@/hooks/use-page-content';
import Link from 'next/link';
import {
  Monitor,
  Globe2,
  Heart,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

/* ─── word-by-word reveal ─────────────────────────────── */

function WordReveal({ text, className }: { text: string; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const words = text.split(' ');

  return (
    <p ref={ref} className={className}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          className="mr-[0.3em] inline-block"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: i * 0.04, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          {word}
        </motion.span>
      ))}
    </p>
  );
}

/* ─── pillar card ─────────────────────────────────────── */

function PillarCard({
  number,
  icon: Icon,
  title,
  description,
  gradient,
  index,
}: {
  number: string;
  icon: React.ElementType;
  title: string;
  description: string;
  gradient: string;
  index: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.15, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="group relative overflow-hidden rounded-xl border border-slate-100 bg-white p-8 shadow-sm transition-shadow duration-300 hover:shadow-md"
    >
      <div
        className={`mb-4 inline-flex items-center justify-center rounded-xl bg-gradient-to-br ${gradient} px-3 py-1.5 text-xs font-black tracking-widest text-white shadow-md`}
      >
        {number}
      </div>

      <div
        className={`mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} shadow-lg`}
      >
        <Icon className="h-7 w-7 text-white" />
      </div>

      <h3 className="mb-3 text-xl font-bold text-slate-900">{title}</h3>
      <p className="text-sm leading-relaxed text-slate-600">{description}</p>
    </motion.div>
  );
}

/* ─── timeline ────────────────────────────────────────── */

const ROADMAP = [
  {
    year: '2024',
    label: 'Platform Lansmanı',
    detail: 'Canlı ihale motoru ve harita tabanlı arayüz',
    done: true,
  },
  {
    year: '2025',
    label: 'Mobil Uygulama',
    detail: 'iOS ve Android native uygulamalar',
    done: true,
  },
  {
    year: '2026',
    label: 'Uluslararası Açılım',
    detail: 'Çok dilli platform ve uluslararası ödemeler',
    done: false,
  },
  {
    year: '2030',
    label: 'Ekosistem Liderliği',
    detail: 'Bölgenin en büyük gayrimenkul ekosistemi',
    done: false,
  },
];

function Timeline() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  return (
    <div ref={ref} className="relative">
      <div className="absolute left-6 top-0 h-full w-px bg-gradient-to-b from-emerald-400 via-emerald-200 to-transparent" />

      <div className="space-y-6">
        {ROADMAP.map((item, i) => (
          <motion.div
            key={item.year}
            initial={{ opacity: 0, x: -30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: i * 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex gap-6 pl-14"
          >
            <div
              className={`absolute left-4 top-1 flex h-5 w-5 -translate-x-1/2 items-center justify-center rounded-full border-2 ${
                item.done
                  ? 'border-emerald-500 bg-emerald-100'
                  : 'border-slate-300 bg-white'
              }`}
            >
              <div
                className={`h-2 w-2 rounded-full ${item.done ? 'bg-emerald-500' : 'bg-slate-300'}`}
              />
            </div>

            <div
              className={`rounded-xl border p-5 transition-all duration-300 ${
                item.done
                  ? 'border-emerald-200 bg-emerald-50'
                  : 'border-slate-100 bg-white shadow-sm hover:shadow-md'
              }`}
              style={{ flex: 1 }}
            >
              <div className="mb-1 flex items-center gap-3">
                <span
                  className={`text-xs font-black tracking-widest ${
                    item.done ? 'text-emerald-600' : 'text-slate-400'
                  }`}
                >
                  {item.year}
                </span>
                {item.done && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                    <CheckCircle2 className="h-3 w-3" />
                    Tamamlandı
                  </span>
                )}
              </div>
              <p className="font-bold text-slate-900">{item.label}</p>
              <p className="mt-1 text-sm text-slate-500">{item.detail}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
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
  hero_title: 'Vizyon 2030',
  hero_subtitle: 'Vizyonumuz',
  hero_description:
    "Türkiye'nin gayrimenkul ekosistemini dijitalleştirerek küresel sahneye taşımak ve her vatandaşa güvenli yatırım fırsatı sunmak.",
  vision_statement:
    'Teknoloji ve güven bir araya geldiğinde, gayrimenkul yatırımı coğrafyadan, bütçeden ve bürokratik engellerden bağımsız olarak herkes için erişilebilir hale gelir.',
  goals: [
    { year: '2024', title: 'Platform Lansmanı', description: 'Canlı ihale motoru ve harita tabanlı arayüz' },
    { year: '2025', title: 'Mobil Uygulama', description: 'iOS ve Android native uygulamalar' },
    { year: '2026', title: 'Uluslararası Açılım', description: 'Çok dilli platform ve uluslararası ödemeler' },
    { year: '2030', title: 'Ekosistem Liderliği', description: 'Bölgenin en büyük gayrimenkul ekosistemi' },
  ],
  pillars: [
    { title: 'Dijital Dönüşüm', description: 'Gayrimenkul sektörünü geleneksel yöntemlerden kurtararak tamamen dijital ve şeffaf bir ekosistem oluşturmak. Yapay zeka destekli değerleme ve gerçek zamanlı piyasa analizi ile sektörü geleceğe taşımak.' },
    { title: 'Küresel Erişim', description: 'Türkiye gayrimenkul piyasasını uluslararası yatırımcılara açarak sınır ötesi yatırım imkanları sunmak. Çok dilli platform desteği ve uluslararası ödeme altyapısı ile küresel bir pazar yeri olmak.' },
    { title: 'Toplumsal Fayda', description: 'Gayrimenkul yatırımını demokratikleştirerek her bütçeye uygun fırsatlar sunmak. Kırsal kalkınmayı destekleyen arazi projeleri ve sürdürülebilir şehircilik vizyonu ile topluma değer katmak.' },
  ],
};

const PILLAR_ICONS = [Monitor, Globe2, Heart];
const PILLAR_GRADIENTS = ['from-emerald-500 to-emerald-700', 'from-blue-500 to-blue-700', 'from-emerald-500 to-teal-600'];
const PILLAR_NUMBERS = ['01', '02', '03'];

/* ─── main ────────────────────────────────────────────── */

export function VisionContent() {
  const content = usePageContent('page_content_vision', DEFAULT_CONTENT);
  const pillarsRaw = parseArray(content.pillars, DEFAULT_CONTENT.pillars);
  const pillars = pillarsRaw.map((p, i) => ({
    number: PILLAR_NUMBERS[i] ?? String(i + 1).padStart(2, '0'),
    icon: PILLAR_ICONS[i % PILLAR_ICONS.length],
    gradient: PILLAR_GRADIENTS[i % PILLAR_GRADIENTS.length],
    title: p.title,
    description: p.description,
  }));

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
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-200" />
            {content.hero_subtitle}
          </div>
          <h1 className="text-5xl font-extrabold leading-none tracking-tight sm:text-6xl">
            {content.hero_title}
          </h1>
          <WordReveal
            text={content.hero_description}
            className="mt-5 max-w-2xl text-lg leading-relaxed text-white/80"
          />
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/parcels"
              className="group inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-bold text-emerald-700 shadow-sm transition-all duration-200 hover:bg-emerald-50"
            >
              Hemen Başla
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </motion.div>

      {/* ── PILLARS ──────────────────────────────────────── */}
      <section className="mb-10">
        <div className="mb-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-2 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-emerald-600"
          >
            <span className="h-px w-8 bg-emerald-500" />
            Stratejik Sütunlar
            <span className="h-px w-8 bg-emerald-500" />
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="text-3xl font-extrabold text-slate-900 sm:text-4xl"
          >
            Vizyonumuzu şekillendiren{' '}
            <span className="bg-gradient-to-r from-emerald-600 to-emerald-800 bg-clip-text text-transparent">
              üç temel güç
            </span>
          </motion.h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {pillars.map((p, i) => (
            <PillarCard key={p.title} {...p} index={i} />
          ))}
        </div>
      </section>

      {/* ── ROADMAP ──────────────────────────────────────── */}
      <section className="mb-10">
        <div className="mb-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-2 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-emerald-600"
          >
            <span className="h-px w-8 bg-emerald-500" />
            Yol Haritası
            <span className="h-px w-8 bg-emerald-500" />
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="text-3xl font-extrabold text-slate-900 sm:text-4xl"
          >
            2024&rsquo;ten{' '}
            <span className="bg-gradient-to-r from-emerald-600 to-emerald-800 bg-clip-text text-transparent">
              2030&rsquo;a
            </span>
          </motion.h2>
        </div>
        <Timeline />
      </section>

      {/* ── MANIFESTO ────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="relative overflow-hidden rounded-2xl bg-slate-50 p-10 text-center sm:p-14"
      >
        <div className="absolute left-0 top-0 h-full w-1 rounded-l-2xl bg-gradient-to-b from-emerald-500 to-transparent" />
        <div className="text-4xl text-emerald-500 mb-4">&ldquo;</div>
        <blockquote className="text-xl font-light italic leading-relaxed text-slate-700 sm:text-2xl">
          {content.vision_statement}
        </blockquote>
        <p className="mt-6 text-sm font-semibold tracking-widest text-emerald-600">
          — NetTapu Kurucu Ekibi
        </p>
      </motion.div>
    </div>
  );
}
