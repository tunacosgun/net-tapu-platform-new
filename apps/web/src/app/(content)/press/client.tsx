'use client';

import { motion } from 'framer-motion';
import { ExternalLink, Download, Mail, FileText, Image, Film, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { usePageContent } from '@/hooks/use-page-content';

/* ─── helpers ──────────────────────────────────────────── */

function parseArray<T>(val: unknown, defaults: T[]): T[] {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch {}
  }
  return defaults;
}

interface PressCard {
  outlet: string;
  headline: string;
  excerpt: string;
  date: string;
  url: string;
  category: string;
}

const MEDIA_OUTLETS = [
  'Hürriyet',
  'Milliyet',
  'Sabah',
  'Cumhuriyet',
  'Ekonomist',
  'Forbes TR',
  'Bloomberg HT',
  'Dünya',
];

const PRESS_CARDS: PressCard[] = [
  {
    outlet: 'Bloomberg HT',
    headline: 'Türkiye\'nin İlk Gerçek Zamanlı Gayrimenkul İhale Platformu NetTapu Yayında',
    excerpt: 'NetTapu, geliştirdiği canlı açık artırma motoru ile Türkiye gayrimenkul sektöründe dijital dönüşümün öncüsü olmayı hedefliyor.',
    date: '15 Mart 2026',
    url: '#',
    category: 'Teknoloji',
  },
  {
    outlet: 'Forbes TR',
    headline: 'PropTech Alanında Yıldız Yükselen: NetTapu Kimdir?',
    excerpt: 'Binlerce kullanıcıya ulaşan NetTapu, arsa yatırımını demokratikleştirme iddiasıyla sektörün gündemine girdi.',
    date: '2 Mart 2026',
    url: '#',
    category: 'Girişim',
  },
  {
    outlet: 'Hürriyet',
    headline: 'Arsa Satışında Yeni Dönem: Canlı İhale ile Şeffaf Fiyat',
    excerpt: 'Kapalı devre müzakere döneminin kapandığını savunan platform, binlerce kişinin eş zamanlı teklif verebileceği altyapıyı hayata geçirdi.',
    date: '22 Şubat 2026',
    url: '#',
    category: 'Ekonomi',
  },
  {
    outlet: 'Sabah',
    headline: 'NetTapu ile Köyden Kente 81 İlde Arsa Fırsatı',
    excerpt: 'Türkiye genelinde tüm illerdeki arsa ilanlarını tek ekranda buluşturan platform, tarım ve sanayi yatırımcılarına da kapılarını açıyor.',
    date: '10 Şubat 2026',
    url: '#',
    category: 'Gündem',
  },
  {
    outlet: 'Ekonomist',
    headline: 'Gayrimenkul Yatırımı Artık Birkaç Tıkta',
    excerpt: 'Dijital depozito sistemi ve tapu süreçlerini uçtan uca dijitalleştiren NetTapu, geleneksel emlak anlayışını köklü biçimde değiştiriyor.',
    date: '28 Ocak 2026',
    url: '#',
    category: 'Analiz',
  },
  {
    outlet: 'Dünya',
    headline: 'Tarım Arazisi Yatırımcıları NetTapu\'da Buluşuyor',
    excerpt: 'Çanakkale\'den Konya\'ya uzanan tarım arazisi portföyüyle platform, bireysel ve kurumsal yatırımcıların gözdesi haline geldi.',
    date: '14 Ocak 2026',
    url: '#',
    category: 'Yatırım',
  },
];

/* ─── defaults ────────────────────────────────────────── */

const DEFAULT_CONTENT = {
  hero_title: 'Bizden Bahsedenler',
  hero_subtitle: 'Basın Odası',
  press_items: PRESS_CARDS as PressCard[],
};

const KIT_CONTENTS = [
  { icon: <Image className="h-4 w-4" />, label: 'Logo Paketi (SVG, PNG, PDF)' },
  { icon: <FileText className="h-4 w-4" />, label: 'Şirket Profili & Hakkında Metni' },
  { icon: <Film className="h-4 w-4" />, label: 'Ürün Ekran Görüntüleri' },
  { icon: <FileText className="h-4 w-4" />, label: 'Yönetici Biyografileri' },
  { icon: <Image className="h-4 w-4" />, label: 'Marka Renk & Tipografi Rehberi' },
];

function OutletBadge({ name }: { name: string }) {
  return (
    <motion.div
      whileHover={{ scale: 1.04 }}
      className="group flex items-center justify-center rounded-2xl border border-slate-100 bg-white px-5 py-4 cursor-default shadow-sm transition-all duration-200 hover:border-emerald-200 hover:shadow-md"
    >
      <span className="text-sm font-semibold text-slate-400 group-hover:text-slate-900 transition-colors duration-200">
        {name}
      </span>
    </motion.div>
  );
}

function PressCardItem({ card, index }: { card: PressCard; index: number }) {
  return (
    <motion.a
      href={card.url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -2 }}
      className="group block rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:border-emerald-100 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
              {card.outlet}
            </span>
            <span className="inline-flex items-center rounded-full border border-slate-100 bg-slate-50 px-2.5 py-0.5 text-[11px] text-slate-500">
              {card.category}
            </span>
            <span className="text-[11px] text-slate-400">{card.date}</span>
          </div>
          <h3 className="text-sm font-semibold text-slate-900 leading-snug group-hover:text-emerald-700 transition-colors">
            {card.headline}
          </h3>
          <p className="mt-2 text-xs text-slate-500 leading-relaxed line-clamp-2">
            {card.excerpt}
          </p>
        </div>
        <ExternalLink className="h-4 w-4 shrink-0 text-slate-300 group-hover:text-emerald-500 transition-colors mt-1" />
      </div>
    </motion.a>
  );
}

export function PressContent() {
  const content = usePageContent('page_content_press', DEFAULT_CONTENT);
  const pressItemsRaw = parseArray(content.press_items, DEFAULT_CONTENT.press_items);
  const pressItems: PressCard[] = pressItemsRaw.map((item, i) => {
    if (typeof item === 'object' && item !== null && 'outlet' in item) return item as PressCard;
    const it = item as { source?: string; title?: string; date?: string; url?: string };
    return {
      outlet: it.source ?? `Kaynak ${i + 1}`,
      headline: it.title ?? '',
      excerpt: '',
      date: it.date ?? '',
      url: it.url ?? '#',
      category: '',
    };
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600">
        <div className="pointer-events-none absolute -top-40 left-1/3 h-96 w-96 rounded-full bg-white/10 blur-[120px]" />
        <div className="pointer-events-none absolute top-10 right-1/4 h-72 w-72 rounded-full bg-white/10 blur-[100px]" />

        <div className="relative px-4 pt-20 pb-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/20 px-4 py-1.5 text-xs font-medium text-white mb-6">
              <FileText className="h-3 w-3" />
              {content.hero_subtitle}
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-4">
              {content.hero_title}
            </h1>
            <p className="max-w-xl mx-auto text-base text-white/80">
              Türkiye'nin önde gelen medya kuruluşlarının NetTapu hakkındaki haberleri ve değerlendirmeleri.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 pb-24 pt-12 space-y-16">
        {/* Media Logos Bar */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <p className="text-center text-xs font-medium text-slate-400 uppercase tracking-widest mb-6">
            Bizi haberleştiren yayın organları
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {MEDIA_OUTLETS.map((name) => (
              <OutletBadge key={name} name={name} />
            ))}
          </div>
        </motion.section>

        {/* Press Cards */}
        <section>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8 flex items-end justify-between"
          >
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Basın Haberleri</h2>
              <p className="mt-1 text-sm text-slate-500">Medyada yer alan haberler ve köşe yazıları</p>
            </div>
          </motion.div>
          <div className="grid gap-4 sm:grid-cols-2">
            {pressItems.map((card, i) => (
              <PressCardItem key={i} card={card} index={i} />
            ))}
          </div>
        </section>

        {/* Press Kit Download */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl border border-emerald-100 bg-emerald-50 p-8"
        >
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <div className="shrink-0 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 border border-emerald-200">
              <Download className="h-7 w-7 text-emerald-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-slate-900">Basın Kiti İndirin</h2>
              <p className="mt-1 text-sm text-slate-600 mb-5">
                Haberleriniz için ihtiyaç duyduğunuz tüm materyaller tek pakette.
              </p>
              <ul className="space-y-2.5 mb-6">
                {KIT_CONTENTS.map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-slate-700">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white border border-emerald-100 text-emerald-600">
                      {item.icon}
                    </span>
                    {item.label}
                  </li>
                ))}
              </ul>
              <button className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-200">
                <Download className="h-4 w-4" />
                Basın Kitini İndir (PDF, 8 MB)
              </button>
            </div>
          </div>
        </motion.section>

        {/* Press Contact */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <div className="rounded-2xl border border-slate-100 bg-white p-6 sm:p-8 shadow-sm">
            <div className="grid sm:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Basın İletişim</h2>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Röportaj talepleri, açıklama talebi veya teknik sorularınız için basın ekibimizle doğrudan iletişime geçebilirsiniz.
                </p>
                <p className="mt-4 text-sm font-semibold text-slate-900">Basın & Kurumsal İletişim</p>
                <p className="text-xs text-slate-500 mt-0.5">NetTapu Gayrimenkul Teknoloji A.Ş.</p>
              </div>
              <div className="space-y-3">
                <a
                  href="mailto:basin@nettapu.com"
                  className="group flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4 hover:border-emerald-200 hover:bg-emerald-50 transition-all"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
                    <Mail className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">E-posta</p>
                    <p className="text-sm font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors">
                      basin@nettapu.com
                    </p>
                  </div>
                  <ChevronRight className="ml-auto h-4 w-4 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                </a>
                <div className="flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Yanıt Süresi</p>
                    <p className="text-sm font-semibold text-slate-900">24 saat içinde</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
