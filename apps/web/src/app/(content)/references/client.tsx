'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import { Building2, ArrowRight, Star, TrendingUp, Globe, ShieldCheck } from 'lucide-react';
import { usePageContent } from '@/hooks/use-page-content';

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
  hero_title: 'Güvenilir Markalar Bize Güveniyor',
  hero_subtitle: 'Referanslar',
  hero_description: "Türkiye'nin önde gelen finans, teknoloji ve gayrimenkul markalarıyla güçlü iş birlikleri kuruyoruz.",
  partners: [
    { name: 'Emlakjet', sector: 'Gayrimenkul' },
    { name: 'Sahibinden', sector: 'İlan Platformu' },
    { name: 'Halkbank', sector: 'Bankacılık' },
    { name: 'Ziraat Bankası', sector: 'Bankacılık' },
    { name: 'Garanti BBVA', sector: 'Bankacılık' },
    { name: 'Yapı Kredi', sector: 'Bankacılık' },
    { name: 'İş Bankası', sector: 'Bankacılık' },
    { name: 'QNB Finansbank', sector: 'Bankacılık' },
    { name: 'Albaraka', sector: 'Bankacılık' },
    { name: 'TEB', sector: 'Bankacılık' },
    { name: 'Kuveyt Türk', sector: 'Bankacılık' },
    { name: 'Vakıfbank', sector: 'Bankacılık' },
    { name: 'Hepsiburada', sector: 'E-Ticaret' },
    { name: 'Trendyol', sector: 'E-Ticaret' },
    { name: 'n11', sector: 'E-Ticaret' },
    { name: 'Gittigidiyor', sector: 'E-Ticaret' },
    { name: 'Amazon TR', sector: 'E-Ticaret' },
    { name: 'TKGM', sector: 'Kamu' },
  ],
};

const COMPANIES_ROW_A = [
  { name: 'Emlakjet', sector: 'Gayrimenkul' },
  { name: 'Sahibinden', sector: 'İlan Platformu' },
  { name: 'Halkbank', sector: 'Bankacılık' },
  { name: 'Ziraat Bankası', sector: 'Bankacılık' },
  { name: 'Garanti BBVA', sector: 'Bankacılık' },
  { name: 'Yapı Kredi', sector: 'Bankacılık' },
  { name: 'İş Bankası', sector: 'Bankacılık' },
  { name: 'QNB Finansbank', sector: 'Bankacılık' },
  { name: 'Albaraka', sector: 'Bankacılık' },
];

const COMPANIES_ROW_B = [
  { name: 'TEB', sector: 'Bankacılık' },
  { name: 'Kuveyt Türk', sector: 'Bankacılık' },
  { name: 'Vakıfbank', sector: 'Bankacılık' },
  { name: 'Hepsiburada', sector: 'E-Ticaret' },
  { name: 'Trendyol', sector: 'E-Ticaret' },
  { name: 'n11', sector: 'E-Ticaret' },
  { name: 'Gittigidiyor', sector: 'E-Ticaret' },
  { name: 'Amazon TR', sector: 'E-Ticaret' },
  { name: 'TKGM', sector: 'Kamu' },
];

const ALL_COMPANIES = [...COMPANIES_ROW_A, ...COMPANIES_ROW_B];

const PARTNER_ADVANTAGES = [
  {
    icon: TrendingUp,
    title: 'Büyüyen Ekosistem',
    description:
      'Her ay yüzlerce yeni ilan ve aktif ihale ile büyüyen platformumuzda markanız öne çıkar.',
    iconBg: 'bg-indigo-50',
    iconColor: 'text-indigo-600',
    border: 'border-indigo-100',
  },
  {
    icon: Globe,
    title: 'Ulusal Erişim',
    description:
      "Türkiye'nin 81 ilinde aktif kullanıcı kitlesiyle markanızı doğru hedef kitleye ulaştırın.",
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    border: 'border-emerald-100',
  },
  {
    icon: ShieldCheck,
    title: 'Güvenilir Altyapı',
    description:
      'PCI-DSS uyumlu ödeme sistemleri ve kurumsal güvenlik standartları ile güçlü ortaklık.',
    iconBg: 'bg-teal-50',
    iconColor: 'text-teal-600',
    border: 'border-teal-100',
  },
  {
    icon: Star,
    title: 'Prestijli Referans',
    description:
      "Türkiye'nin lider finans ve teknoloji markalarıyla birlikte anılan güvenilir bir ağın parçası olun.",
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    border: 'border-amber-100',
  },
];

const STATS = [
  { value: '18+', label: 'İş Ortağı' },
  { value: '2.400+', label: 'Tamamlanan İşlem' },
  { value: '₺4.2 Mlr', label: 'İşlem Hacmi' },
  { value: '%98', label: 'Memnuniyet' },
];

function LogoBox({ company, delay = 0 }: { company: { name: string; sector: string }; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ scale: 1.05 }}
      className="group flex min-w-[140px] flex-col items-center justify-center gap-1.5 rounded-xl border border-slate-100 bg-white px-5 py-4 shadow-sm transition-all duration-300 hover:border-emerald-200 hover:shadow-md"
    >
      <Building2 className="h-5 w-5 text-slate-300 transition-colors group-hover:text-emerald-500" />
      <span className="text-center text-sm font-semibold text-slate-500 transition-colors group-hover:text-slate-900">
        {company.name}
      </span>
      <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 transition-colors group-hover:text-emerald-600">
        {company.sector}
      </span>
    </motion.div>
  );
}

function MarqueeRow({
  companies,
  direction = 'left',
}: {
  companies: { name: string; sector: string }[];
  direction?: 'left' | 'right';
}) {
  const doubled = [...companies, ...companies];
  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-24 bg-gradient-to-r from-slate-50 to-transparent" />
      <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-24 bg-gradient-to-l from-slate-50 to-transparent" />

      <motion.div
        className="flex gap-4 py-2"
        animate={{
          x: direction === 'left' ? ['0%', '-50%'] : ['-50%', '0%'],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        {doubled.map((company, i) => (
          <div key={`${company.name}-${i}`} className="shrink-0">
            <div className="group flex min-w-[150px] flex-col items-center justify-center gap-1.5 rounded-xl border border-slate-100 bg-white px-5 py-4 shadow-sm transition-all duration-300 hover:border-emerald-200">
              <Building2 className="h-4 w-4 text-slate-300 transition-colors group-hover:text-emerald-500" />
              <span className="text-center text-sm font-semibold text-slate-500 transition-colors group-hover:text-slate-900">
                {company.name}
              </span>
              <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 transition-colors group-hover:text-emerald-600">
                {company.sector}
              </span>
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

export function ReferencesContent() {
  const statsRef = useRef<HTMLDivElement>(null);
  const statsInView = useInView(statsRef, { once: true });
  const content = usePageContent('page_content_references', DEFAULT_CONTENT);
  const partnersRaw = parseArray(content.partners, DEFAULT_CONTENT.partners);
  const midpoint = Math.ceil(partnersRaw.length / 2);
  const dynamicRowA = partnersRaw.slice(0, midpoint);
  const dynamicRowB = partnersRaw.slice(midpoint);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600 px-4 pb-16 pt-16 lg:px-8 lg:pt-24">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-white/10 blur-[120px]" />
          <div className="absolute -right-20 top-0 h-80 w-80 rounded-full bg-white/10 blur-[100px]" />
        </div>

        <div className="relative mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/20 px-4 py-1.5"
          >
            <Star className="h-3.5 w-3.5 text-white" />
            <span className="text-xs font-semibold uppercase tracking-widest text-white">
              {content.hero_subtitle}
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl font-extrabold leading-tight tracking-tight text-white lg:text-5xl"
          >
            {content.hero_title}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-4 text-base text-white/80"
          >
            {content.hero_description}
          </motion.p>
        </div>
      </div>

      {/* Stats */}
      <div ref={statsRef} className="relative border-b border-slate-100 bg-white px-4 py-10 lg:px-8">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-8 lg:grid-cols-4">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              animate={statsInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="text-center"
            >
              <div className="text-2xl font-extrabold text-emerald-600 lg:text-3xl">{stat.value}</div>
              <div className="mt-1 text-xs text-slate-500">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Marquee logo wall */}
      <div className="relative bg-slate-50 py-16">
        <div className="relative mx-auto mb-10 max-w-xl px-4 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-2xl font-bold text-slate-900 lg:text-3xl"
          >
            İş Ortaklarımız
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-2 text-sm text-slate-500"
          >
            Finans, teknoloji ve gayrimenkul sektörünün liderleriyle çalışıyoruz
          </motion.p>
        </div>

        <div className="space-y-4">
          <MarqueeRow companies={dynamicRowA} direction="left" />
          <MarqueeRow companies={dynamicRowB} direction="right" />
        </div>
      </div>

      {/* Full logo grid - static */}
      <div className="bg-white px-4 py-12 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-8 text-center text-xl font-bold text-slate-900"
          >
            Tüm Ortaklarımız
          </motion.h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {partnersRaw.map((company, i) => (
              <LogoBox key={company.name} company={company} delay={i * 0.03} />
            ))}
          </div>
        </div>
      </div>

      {/* Case testimonial */}
      <div className="bg-slate-50 px-4 py-16 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl overflow-hidden rounded-3xl border border-slate-100 bg-white p-10 shadow-sm"
        >
          <div className="mb-6 flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <blockquote className="text-xl font-medium leading-relaxed text-slate-700 lg:text-2xl">
            &ldquo;NetTapu ile gerçekleştirdiğimiz ihale entegrasyonu, müşterilerimize sunduğumuz
            gayrimenkul deneyimini tamamen dönüştürdü. Platform güvenilirliği ve şeffaflığı
            açısından sektörde bir adım öne çıkıyor.&rdquo;
          </blockquote>
          <div className="mt-8 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-lg font-bold text-white">
              E
            </div>
            <div>
              <div className="font-semibold text-slate-900">Emlakjet</div>
              <div className="text-sm text-slate-500">Teknoloji Direktörü</div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Partner advantages */}
      <div className="bg-white px-4 py-12 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-10 text-center"
          >
            <h2 className="text-2xl font-bold text-slate-900 lg:text-3xl">
              Neden{' '}
              <span className="text-emerald-600">
                Ortağımız Olun?
              </span>
            </h2>
            <p className="mt-3 text-slate-500">
              Güçlü iş birliğinin avantajlarını keşfedin
            </p>
          </motion.div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PARTNER_ADVANTAGES.map((adv, i) => {
              const Icon = adv.icon;
              return (
                <motion.div
                  key={adv.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className={`group relative overflow-hidden rounded-2xl border ${adv.border} bg-white p-6 shadow-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-md`}
                >
                  <div className="relative">
                    <div
                      className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${adv.iconBg} ${adv.iconColor}`}
                    >
                      <Icon className="h-5 w-5" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-base font-semibold text-slate-900">{adv.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-500">{adv.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-slate-50 px-4 py-20 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-2xl overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600 p-10 text-center shadow-lg"
        >
          <h2 className="text-3xl font-extrabold text-white">İş Birliği Yapalım</h2>
          <p className="mt-3 text-base text-white/80">
            Sektörün en güvenilir gayrimenkul platformuyla ortaklık fırsatlarını değerlendirin.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/contact"
              className="group inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-semibold text-emerald-700 shadow-lg transition-all duration-200 hover:scale-105"
            >
              Başvuru Yapın
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
