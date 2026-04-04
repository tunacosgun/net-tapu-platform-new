'use client';

import { useRef } from 'react';
import { usePageContent } from '@/hooks/use-page-content';
import Link from 'next/link';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import {
  Search,
  FileText,
  Gavel,
  ShieldCheck,
  Home,
  Eye,
  Lock,
  Users,
  Scale,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';

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
  hero_title: '5 Adımda Gayrimenkul Yatırımı',
  hero_subtitle: 'Platform Rehberi',
  hero_description: 'NetTapu ile arsa satın alma süreciniz tamamen dijital, güvenli ve şeffaf bir şekilde tamamlanır. Her adım tasarlanmış olup hukuki geçerliliğe sahiptir.',
  steps: [
    { step: '01', title: 'Keşfedin', description: 'Türkiye genelindeki arsa ilanlarını interaktif harita üzerinden keşfedin. Şehir, ilçe, fiyat aralığı, metrekare ve imar durumuna göre gelişmiş filtrelerle arama yapın. Her ilan için konum, çevre analizi ve erişim bilgilerine anında ulaşın.' },
    { step: '02', title: 'İnceleyin', description: 'Beğendiğiniz arsanın detay sayfasından tüm teknik bilgilere erişin: ada/parsel numaraları, imar durumu, tapu sicil kayıtları, fotoğraflar ve konum haritası. TKGM parsel sorgu bağlantısı ile resmi kayıtları doğrulayın.' },
    { step: '03', title: 'Teklif Verin', description: 'Doğrudan teklif verin veya açık artırma ilanlarına canlı olarak katılın. İhaleye girmek için güvenli ödeme sistemi üzerinden teminat bedelini yatırın. Gerçek zamanlı ihale ekranında rakiplerinizin tekliflerini anlık takip edin.' },
    { step: '04', title: 'Güvende Olun', description: 'Tüm finansal işlemler 3D Secure güvenlik protokolü ile korunur. Ödeme bilgileriniz PCI-DSS uyumlu şifreli kanallar üzerinden iletilir. İhale sürecinin her adımı kayıt altına alınır ve yasal güvence altındadır.' },
    { step: '05', title: 'Tapu İşlemleri', description: 'İhaleyi kazandığınızda veya teklifiniz kabul edildiğinde, uzman danışman ekibimiz tapu devir sürecinde size adım adım rehberlik eder. Tüm yasal belgeler profesyonel olarak hazırlanır, devir işlemi sorunsuz tamamlanır.' },
  ],
};

const STEP_ICONS = [Search, FileText, Gavel, ShieldCheck, Home];
const STEP_GRADIENTS = [
  'from-emerald-500 to-emerald-700',
  'from-blue-500 to-blue-700',
  'from-emerald-500 to-teal-600',
  'from-emerald-500 to-emerald-700',
  'from-amber-500 to-orange-600',
];
const STEP_TAGS = ['Ücretsiz Keşfet', 'Detaylı Bilgi', 'Canlı İhale', '3D Secure', 'Uzman Destek'];
const STEP_SUBTITLES = [
  'Harita ile ilanları incele',
  'Detay sayfası, ada/parsel bilgileri',
  'İhaleye katıl, depozito yatır',
  '3D Secure, şifreli kanallar',
  'Devir süreci',
];

const steps = [
  {
    number: '01',
    title: 'Keşfedin',
    subtitle: 'Harita ile ilanları incele',
    description:
      'Türkiye genelindeki arsa ilanlarını interaktif harita üzerinden keşfedin. Şehir, ilçe, fiyat aralığı, metrekare ve imar durumuna göre gelişmiş filtrelerle arama yapın. Her ilan için konum, çevre analizi ve erişim bilgilerine anında ulaşın.',
    icon: Search,
    gradient: 'from-emerald-500 to-emerald-700',
    tag: 'Ücretsiz Keşfet',
  },
  {
    number: '02',
    title: 'İnceleyin',
    subtitle: 'Detay sayfası, ada/parsel bilgileri',
    description:
      'Beğendiğiniz arsanın detay sayfasından tüm teknik bilgilere erişin: ada/parsel numaraları, imar durumu, tapu sicil kayıtları, fotoğraflar ve konum haritası. TKGM parsel sorgu bağlantısı ile resmi kayıtları doğrulayın.',
    icon: FileText,
    gradient: 'from-blue-500 to-blue-700',
    tag: 'Detaylı Bilgi',
  },
  {
    number: '03',
    title: 'Teklif Verin',
    subtitle: 'İhaleye katıl, depozito yatır',
    description:
      'Doğrudan teklif verin veya açık artırma ilanlarına canlı olarak katılın. İhaleye girmek için güvenli ödeme sistemi üzerinden teminat bedelini yatırın. Gerçek zamanlı ihale ekranında rakiplerinizin tekliflerini anlık takip edin.',
    icon: Gavel,
    gradient: 'from-emerald-500 to-teal-600',
    tag: 'Canlı İhale',
  },
  {
    number: '04',
    title: 'Güvende Olun',
    subtitle: '3D Secure, şifreli kanallar',
    description:
      'Tüm finansal işlemler 3D Secure güvenlik protokolü ile korunur. Ödeme bilgileriniz PCI-DSS uyumlu şifreli kanallar üzerinden iletilir. İhale sürecinin her adımı kayıt altına alınır ve yasal güvence altındadır.',
    icon: ShieldCheck,
    gradient: 'from-emerald-500 to-emerald-700',
    tag: '3D Secure',
  },
  {
    number: '05',
    title: 'Tapu İşlemleri',
    subtitle: 'Devir süreci',
    description:
      'İhaleyi kazandığınızda veya teklifiniz kabul edildiğinde, uzman danışman ekibimiz tapu devir sürecinde size adım adım rehberlik eder. Tüm yasal belgeler profesyonel olarak hazırlanır, devir işlemi sorunsuz tamamlanır.',
    icon: Home,
    gradient: 'from-amber-500 to-orange-600',
    tag: 'Uzman Destek',
  },
];

const advantages = [
  {
    icon: Eye,
    title: 'Tam Şeffaflık',
    description:
      'Tüm teklifler, fiyatlar ve ihale sonuçları anlık olarak görüntülenir. Gizli ücret yoktur, her adım açık şekilde kayıt altına alınır.',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
  },
  {
    icon: Lock,
    title: 'Güvenli Altyapı',
    description:
      'Banka düzeyinde şifreleme ve 3D Secure koruması. Tüm verileriniz SSL/TLS ile şifreli kanallardan aktarılır.',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  {
    icon: Users,
    title: 'Uzman Danışmanlar',
    description:
      'Deneyimli gayrimenkul ve hukuk danışmanları her aşamada yanınızda. Hafta içi 09:00-18:00 telefon desteği.',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
  },
  {
    icon: Scale,
    title: 'Yasal Güvence',
    description:
      'Tüm işlemler Türk hukuku çerçevesinde yürütülür. İhale sözleşmeleri yasal geçerliliğe sahiptir.',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
  },
];

const stats = [
  { value: '2.400+', label: 'Tamamlanan Tapu İşlemi' },
  { value: '98%', label: 'Müşteri Memnuniyeti' },
  { value: '₺4.2 Mlr', label: 'Toplam İşlem Hacmi' },
  { value: '7/24', label: 'Platform Erişimi' },
];

function StepCard({ step, index }: { step: (typeof steps)[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  const Icon = step.icon;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: index % 2 === 0 ? -40 : 40 }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
      className="relative flex gap-6 lg:gap-10"
    >
      {/* Number + connector */}
      <div className="flex flex-col items-center">
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={isInView ? { scale: 1, rotate: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2, type: 'spring', stiffness: 200 }}
          className={`relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${step.gradient} shadow-md`}
        >
          <Icon className="h-7 w-7 text-white" strokeWidth={1.5} />
          <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white ring-1 ring-slate-200">
            <span className="text-[9px] font-bold text-slate-500">{step.number}</span>
          </div>
        </motion.div>
        {index < steps.length - 1 && (
          <motion.div
            initial={{ scaleY: 0 }}
            animate={isInView ? { scaleY: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.4 }}
            style={{ originY: 0 }}
            className="mt-3 h-12 w-px bg-gradient-to-b from-slate-200 to-transparent"
          />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 pb-10">
        <div className="mb-2 flex items-center gap-2">
          <span
            className={`inline-block rounded-full bg-gradient-to-r ${step.gradient} px-3 py-0.5 text-[11px] font-semibold text-white`}
          >
            {step.tag}
          </span>
        </div>
        <h3 className="text-xl font-bold text-slate-900 lg:text-2xl">{step.title}</h3>
        <p className="mt-0.5 text-sm font-medium text-slate-400">{step.subtitle}</p>
        <p className="mt-3 text-sm leading-relaxed text-slate-600 lg:text-base">{step.description}</p>
      </div>
    </motion.div>
  );
}

function AdvantageCard({ adv, index }: { adv: (typeof advantages)[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
  const Icon = adv.icon;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group rounded-xl border border-slate-100 bg-white p-6 shadow-sm transition-shadow duration-300 hover:shadow-md"
    >
      <div
        className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${adv.iconBg} ${adv.iconColor}`}
      >
        <Icon className="h-5 w-5" strokeWidth={1.5} />
      </div>
      <h3 className="text-base font-semibold text-slate-900">{adv.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{adv.description}</p>
    </motion.div>
  );
}

export function HowItWorksContent() {
  const heroRef = useRef<HTMLDivElement>(null);
  const content = usePageContent('page_content_how_it_works', DEFAULT_CONTENT);
  const stepsRaw = parseArray(content.steps, DEFAULT_CONTENT.steps);
  const dynamicSteps = stepsRaw.map((s, i) => ({
    number: s.step ?? String(i + 1).padStart(2, '0'),
    title: s.title,
    subtitle: STEP_SUBTITLES[i] ?? '',
    description: s.description,
    icon: STEP_ICONS[i % STEP_ICONS.length],
    gradient: STEP_GRADIENTS[i % STEP_GRADIENTS.length],
    tag: STEP_TAGS[i] ?? '',
  }));
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 60]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  const statsRef = useRef<HTMLDivElement>(null);
  const statsInView = useInView(statsRef, { once: true });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      {/* Hero */}
      <div ref={heroRef} className="mb-8">
        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-700 via-emerald-600 to-emerald-800 px-8 py-12 text-white"
        >
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-white/8 blur-2xl" />
          <div className="relative text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5"
            >
              <TrendingUp className="h-3.5 w-3.5 text-emerald-200" />
              <span className="text-xs font-semibold uppercase tracking-widest text-emerald-100">
                {content.hero_subtitle}
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-4xl font-extrabold leading-tight tracking-tight lg:text-5xl"
            >
              {content.hero_title}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="mt-4 text-lg leading-relaxed text-white/80"
            >
              {content.hero_description}
            </motion.p>
          </div>
        </motion.div>
      </div>

      {/* Stats bar */}
      <div ref={statsRef} className="mb-10 rounded-2xl border border-slate-100 bg-white px-4 py-8 shadow-sm">
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              animate={statsInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="text-center"
            >
              <div className="text-2xl font-extrabold text-slate-900 lg:text-3xl">{stat.value}</div>
              <div className="mt-1 text-xs text-slate-500">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Steps */}
      <section className="mb-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-10 text-center"
        >
          <h2 className="text-3xl font-bold text-slate-900 lg:text-4xl">Süreç Adımları</h2>
          <p className="mt-3 text-slate-500">Her adım güvenli ve yasal çerçevede yürütülür</p>
        </motion.div>

        <div className="relative">
          {dynamicSteps.map((step, index) => (
            <StepCard key={step.number} step={step} index={index} />
          ))}
        </div>
      </section>

      {/* Why NetTapu */}
      <section className="mb-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-8 text-center"
        >
          <h2 className="text-3xl font-bold text-slate-900 lg:text-4xl">
            Neden{' '}
            <span className="bg-gradient-to-r from-emerald-600 to-emerald-800 bg-clip-text text-transparent">
              NetTapu?
            </span>
          </h2>
          <p className="mt-3 text-slate-500">
            Güvenli ve şeffaf gayrimenkul alışverişi için tercih edilme sebeplerimiz
          </p>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {advantages.map((adv, index) => (
            <AdvantageCard key={adv.title} adv={adv} index={index} />
          ))}
        </div>
      </section>

      {/* Checklist section */}
      <section className="mb-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="overflow-hidden rounded-2xl bg-slate-50 p-8"
        >
          <h3 className="mb-6 text-xl font-bold text-slate-900">Platform Garantileri</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              'Gerçek zamanlı ihale takibi',
              'Anlık teklif bildirimleri',
              'Yasal sözleşme güvencesi',
              'PCI-DSS uyumlu ödeme',
              'TKGM entegrasyonu',
              'Depozito iade garantisi',
              'Tapu devir danışmanlığı',
              'Çoklu cihaz desteği',
            ].map((item, i) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="flex items-center gap-2.5"
              >
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                <span className="text-sm text-slate-700">{item}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-700 via-emerald-600 to-emerald-800 p-10 text-center text-white"
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
        <div className="relative">
          <h2 className="text-3xl font-extrabold">Hemen Başlayın</h2>
          <p className="mt-3 text-base text-white/80">
            Türkiye genelindeki arsa ilanlarını keşfedin, fırsatları kaçırmayın.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/parcels"
              className="group inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-semibold text-emerald-700 shadow-sm transition-all duration-200 hover:bg-emerald-50"
            >
              Arsaları Keşfet
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-7 py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-white/10"
            >
              Uzmanla Konuş
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
