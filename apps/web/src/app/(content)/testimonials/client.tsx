'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import { Star, CheckCircle2, Quote, ArrowRight, Users, ThumbsUp, Award } from 'lucide-react';
import { usePageContent } from '@/hooks/use-page-content';

/* ─── helpers ──────────────────────────────────────────── */

function parseArray<T>(val: unknown, defaults: T[]): T[] {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch {}
  }
  return defaults;
}

interface Testimonial {
  id: number;
  name: string;
  initials: string;
  role: string;
  company: string;
  rating: number;
  quote: string;
  verified: boolean;
  gradient: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    id: 1,
    name: 'Ahmet Yılmaz',
    initials: 'AY',
    role: 'Yatırımcı',
    company: 'Bireysel Yatırımcı',
    rating: 5,
    quote:
      'NetTapu sayesinde Ankara Gölbaşı\'nda harika bir arsa aldım. İhale süreci tamamen şeffaf ve hukuki güvence altındaydı. Danışmanlar tapu devrine kadar her adımda yanımdaydı. Kesinlikle tavsiye ederim.',
    verified: true,
    gradient: 'from-indigo-500 to-violet-600',
  },
  {
    id: 2,
    name: 'Fatma Kaya',
    initials: 'FK',
    role: 'Emlak Danışmanı',
    company: 'Kaya Gayrimenkul',
    rating: 5,
    quote:
      'Müşterilerimi NetTapu\'da gerçekleşen ihalelerle tanıştırdım ve sonuçtan son derece memnunum. Platform arayüzü kullanıcı dostu, teknik destek hızlı ve çözüm odaklı.',
    verified: true,
    gradient: 'from-violet-500 to-pink-500',
  },
  {
    id: 3,
    name: 'Mehmet Demir',
    initials: 'MD',
    role: 'Portföy Yöneticisi',
    company: 'Demir Holding',
    rating: 5,
    quote:
      'Kurumsal olarak birden fazla ihaleye katıldık. İhale sisteminin determinizmi ve güvenliği kurumsal ihtiyaçlarımızı tam karşılıyor. Ödeme altyapısı güçlü ve güvenilir.',
    verified: true,
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    id: 4,
    name: 'Zeynep Arslan',
    initials: 'ZA',
    role: 'Girişimci',
    company: 'ArslaN Yapı',
    rating: 5,
    quote:
      'İlk kez online ihaleye katıldım ve deneyim mükemmeldi. Canlı ihale ekranı rakip teklifleri anlık gösterdi. Depozito iadesi de sorunsuz gerçekleşti.',
    verified: true,
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    id: 5,
    name: 'Ali Öztürk',
    initials: 'AO',
    role: 'İnşaat Sektörü',
    company: 'Öztürk İnşaat A.Ş.',
    rating: 4,
    quote:
      'Türkiye\'nin farklı illerindeki arsaları tek platformdan inceleyip ihaleye girebilmek büyük avantaj. Harita entegrasyonu ve parsel sorgulama özelliği çok işlevsel.',
    verified: true,
    gradient: 'from-amber-500 to-orange-500',
  },
  {
    id: 6,
    name: 'Elif Şahin',
    initials: 'EŞ',
    role: 'Avukat',
    company: 'Şahin Hukuk Bürosu',
    rating: 5,
    quote:
      'Hukuki perspektiften değerlendirdiğimde NetTapu\'nun ihale sözleşmeleri ve süreç kayıtları son derece titizlikle hazırlanmış. Müvekkillere güvenle tavsiye ediyorum.',
    verified: true,
    gradient: 'from-rose-500 to-pink-500',
  },
  {
    id: 7,
    name: 'Mustafa Çelik',
    initials: 'MÇ',
    role: 'Emekli',
    company: 'Bireysel Yatırımcı',
    rating: 5,
    quote:
      'Emekliliğimi değerlendirmek için arsa yatırımına yöneldim. NetTapu\'nun danışmanları beni adım adım yönlendirdi, tapu devri sorunsuz tamamlandı. Harika bir deneyim.',
    verified: true,
    gradient: 'from-cyan-500 to-blue-500',
  },
  {
    id: 8,
    name: 'Selin Koç',
    initials: 'SK',
    role: 'Fintech Girişimcisi',
    company: 'PropTech Ventures',
    rating: 5,
    quote:
      'NetTapu\'nun ödeme altyapısı ve güvenlik standartları fintech perspektifinden bakıldığında sektörün en iyilerinden. 3D Secure entegrasyonu ve PCI-DSS uyumu etkileyici.',
    verified: true,
    gradient: 'from-purple-500 to-violet-500',
  },
  {
    id: 9,
    name: 'Hasan Yıldız',
    initials: 'HY',
    role: 'Çiftçi',
    company: 'Bireysel Yatırımcı',
    rating: 5,
    quote:
      'Köyümüze yakın tarım arazisi aradım. NetTapu\'da tam aradığımı buldum ve ihaleye girdim. Platform çok sade ve anlaşılır, teknik bilgim olmasa da kolayca kullandım.',
    verified: true,
    gradient: 'from-green-500 to-emerald-500',
  },
];

const SOCIAL_PROOF = [
  { icon: Users, value: '12.000+', label: 'Aktif Kullanıcı' },
  { icon: Star, value: '4.9/5', label: 'Ortalama Puan' },
  { icon: ThumbsUp, value: '%98', label: 'Memnuniyet Oranı' },
  { icon: Award, value: '2.400+', label: 'Tamamlanan İşlem' },
];

/* ─── defaults ────────────────────────────────────────── */

const DEFAULT_CONTENT = {
  hero_title: 'Onlar Konuşsun',
  hero_subtitle: 'Müşteri Yorumları',
  testimonials: TESTIMONIALS as unknown as { name: string; role: string; text: string; rating: number }[],
};

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'lg' }) {
  const cls = size === 'lg' ? 'h-6 w-6' : 'h-4 w-4';
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`${cls} ${i < rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
        />
      ))}
    </div>
  );
}

function TestimonialCard({ testimonial, index }: { testimonial: Testimonial; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: (index % 3) * 0.1 }}
      className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all duration-300 hover:border-emerald-100 hover:shadow-md"
    >
      <Quote className="absolute right-5 top-5 h-8 w-8 rotate-180 text-slate-100" />
      <StarRating rating={testimonial.rating} />
      <p className="mt-4 text-sm leading-relaxed text-slate-600">{testimonial.quote}</p>
      <div className="mt-6 flex items-center gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${testimonial.gradient} text-sm font-bold text-white shadow-lg`}
        >
          {testimonial.initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-semibold text-slate-900">{testimonial.name}</span>
            {testimonial.verified && (
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
            )}
          </div>
          <p className="truncate text-xs text-slate-500">
            {testimonial.role} · {testimonial.company}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export function TestimonialsContent() {
  const heroRef = useRef<HTMLDivElement>(null);
  const socialRef = useRef<HTMLDivElement>(null);
  const socialInView = useInView(socialRef, { once: true });

  const content = usePageContent('page_content_testimonials', DEFAULT_CONTENT);
  const testimonialsRaw = parseArray(content.testimonials, DEFAULT_CONTENT.testimonials);
  const GRADIENTS = ['from-indigo-500 to-violet-600', 'from-violet-500 to-pink-500', 'from-blue-500 to-cyan-500', 'from-emerald-500 to-teal-500', 'from-amber-500 to-orange-500', 'from-rose-500 to-pink-500', 'from-cyan-500 to-blue-500', 'from-purple-500 to-violet-500', 'from-green-500 to-emerald-500'];
  const dynamicTestimonials: Testimonial[] = testimonialsRaw.map((t, i) => {
    if ('id' in (t as object)) return t as unknown as Testimonial;
    const tt = t as { name?: string; role?: string; text?: string; rating?: number };
    const name = tt.name ?? `Kullanıcı ${i + 1}`;
    const initials = name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
    return {
      id: i + 1,
      name,
      initials,
      role: tt.role ?? '',
      company: '',
      rating: tt.rating ?? 5,
      quote: tt.text ?? '',
      verified: true,
      gradient: GRADIENTS[i % GRADIENTS.length],
    };
  });

  const avgRating = (
    dynamicTestimonials.reduce((sum, t) => sum + t.rating, 0) / Math.max(dynamicTestimonials.length, 1)
  ).toFixed(1);

  const col1 = dynamicTestimonials.filter((_, i) => i % 3 === 0);
  const col2 = dynamicTestimonials.filter((_, i) => i % 3 === 1);
  const col3 = dynamicTestimonials.filter((_, i) => i % 3 === 2);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div ref={heroRef} className="relative overflow-hidden bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600 px-4 pb-16 pt-16 lg:px-8 lg:pt-24">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-40 -top-20 h-96 w-96 rounded-full bg-white/10 blur-[120px]" />
          <div className="absolute -right-20 top-20 h-72 w-72 rounded-full bg-white/10 blur-[100px]" />
        </div>

        <div className="relative mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/20 px-4 py-1.5"
          >
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span className="text-xs font-semibold uppercase tracking-widest text-white">
              {content.hero_subtitle}
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl font-extrabold leading-tight tracking-tight text-white lg:text-6xl"
          >
            {content.hero_title}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-4 text-base text-white/80"
          >
            Binlerce memnun müşterimizin gerçek deneyimleri ve değerlendirmeleri.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mx-auto mt-8 flex max-w-xs flex-col items-center gap-2"
          >
            <div className="text-6xl font-black text-white">{avgRating}</div>
            <StarRating rating={5} size="lg" />
            <p className="text-sm text-white/70">{dynamicTestimonials.length} doğrulanmış yorum</p>
          </motion.div>
        </div>
      </div>

      {/* Social proof bar */}
      <div ref={socialRef} className="relative border-b border-slate-100 bg-white px-4 py-10 lg:px-8">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-8 lg:grid-cols-4">
          {SOCIAL_PROOF.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 16 }}
                animate={socialInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="flex flex-col items-center gap-2 text-center"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                  <Icon className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="text-2xl font-extrabold text-slate-900">{item.value}</div>
                <div className="text-xs text-slate-500">{item.label}</div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Masonry testimonials grid */}
      <div className="bg-slate-50 px-4 py-16 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="hidden gap-4 md:grid md:grid-cols-3">
            <div className="flex flex-col gap-4">
              {col1.map((t, i) => (
                <TestimonialCard key={t.id} testimonial={t} index={i * 3} />
              ))}
            </div>
            <div className="flex flex-col gap-4 md:mt-8">
              {col2.map((t, i) => (
                <TestimonialCard key={t.id} testimonial={t} index={i * 3 + 1} />
              ))}
            </div>
            <div className="flex flex-col gap-4">
              {col3.map((t, i) => (
                <TestimonialCard key={t.id} testimonial={t} index={i * 3 + 2} />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4 md:hidden">
            {dynamicTestimonials.map((t, i) => (
              <TestimonialCard key={t.id} testimonial={t} index={i} />
            ))}
          </div>
        </div>
      </div>

      {/* Rating distribution */}
      <div className="bg-white px-4 py-12 lg:px-8">
        <div className="mx-auto max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
          >
            <h3 className="mb-5 text-base font-semibold text-slate-900">Puan Dağılımı</h3>
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = dynamicTestimonials.filter((t) => t.rating === stars).length;
              const pct = Math.round((count / Math.max(dynamicTestimonials.length, 1)) * 100);
              return (
                <div key={stars} className="mb-3 flex items-center gap-3 text-sm">
                  <span className="w-12 shrink-0 text-right text-slate-500">{stars} ★</span>
                  <div className="flex-1 overflow-hidden rounded-full bg-slate-100 h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${pct}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, delay: (5 - stars) * 0.1 }}
                      className="h-full rounded-full bg-gradient-to-r from-amber-400 to-yellow-500"
                    />
                  </div>
                  <span className="w-8 shrink-0 text-slate-400">{count}</span>
                </div>
              );
            })}
          </motion.div>
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
          <div className="mx-auto mb-4 flex gap-1 justify-center">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="h-6 w-6 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <h2 className="text-3xl font-extrabold text-white">Siz de Deneyimleyin</h2>
          <p className="mt-3 text-base text-white/80">
            12.000+ kullanıcının tercih ettiği platforma katılın ve fark yaratın.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/parcels"
              className="group inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-semibold text-emerald-700 shadow-lg transition-all duration-200 hover:scale-105"
            >
              Arsaları Keşfet
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/how-it-works"
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/20 px-7 py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-white/30"
            >
              Nasıl Çalışır?
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
