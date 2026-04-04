'use client';

import { useState, useEffect } from 'react';
import { usePageContent } from '@/hooks/use-page-content';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronDown,
  Clock,
  FileText,
  RefreshCcw,
  ArrowRight,
  RotateCcw,
  Shield,
  Info,
} from 'lucide-react';
import Link from 'next/link';

/* ─── defaults ────────────────────────────────────────── */

const DEFAULT_CONTENT = {
  hero_title: 'Cayma Hakkı',
  hero_description:
    '6502 sayılı Tüketicinin Korunması Hakkında Kanun kapsamındaki cayma hakkı bilgileri ve NetTapu\'ya özgü uygulama koşulları.',
  content: '',
};

interface Section {
  id: string;
  label: string;
}

interface AccordionItem {
  id: number;
  question: string;
  answer: string;
}

const SECTIONS: Section[] = [
  { id: '14-gun', label: '14 Günlük Cayma Hakkı' },
  { id: 'kosullar', label: 'Kullanım Koşulları' },
  { id: 'istisnalar', label: 'İstisnalar' },
  { id: 'nasil-kullanilir', label: 'Nasıl Kullanılır?' },
  { id: 'iade-sureci', label: 'İade Süreci' },
  { id: 'sss', label: 'Sık Sorulan Sorular' },
];

const FAQ_ITEMS: AccordionItem[] = [
  {
    id: 1,
    question: 'Cayma hakkı süresi ne zaman başlar?',
    answer:
      'Cayma hakkı süresi, sözleşmenin kurulduğu tarihten itibaren 14 takvim günü olarak başlar. Tatil günleri dahil tüm günler sayılır. Sürenin son günü resmi tatile denk gelirse, takip eden ilk iş günü süre sonu olarak kabul edilir.',
  },
  {
    id: 2,
    question: 'Yazılı bildirim nasıl yapılır?',
    answer:
      'Cayma bildirimi e-posta, iadeli taahhütlü posta veya platform üzerindeki talep formu aracılığıyla yapılabilir. Bildirimin 14 günlük süre içinde gönderilmiş olması yeterlidir; NetTapu\'ya ulaşma tarihi değil, gönderim tarihi esas alınır.',
  },
  {
    id: 3,
    question: 'Cayma hakkını kullandıktan sonra ücret alınır mı?',
    answer:
      'Geçerli cayma bildirimi sonrasında herhangi bir ceza veya ücret talep edilmez. Yalnızca hizmetin fiilen kullanılan kısmına isabet eden bedel orantılı olarak kesilebilir. Depozito iadeleri ise 5-10 iş günü içinde eksiksiz gerçekleştirilir.',
  },
  {
    id: 4,
    question: 'İhale sürecinde cayma hakkı var mı?',
    answer:
      'Hayır. Canlı ihale ortamında verilen ve kabul edilen teklifler bağlayıcıdır. İhaleyi kazanan teklif sahibi cayma hakkından yararlanamaz. Bu durum 6502 sayılı Kanun\'un ilgili hükümleri gereğidir ve ihale şartnamesinde açıkça belirtilmektedir.',
  },
  {
    id: 5,
    question: 'İade ne kadar sürede gerçekleşir?',
    answer:
      'Geçerli cayma bildirimi alındıktan sonra NetTapu, ödemeyi 14 gün içinde iade etmekle yükümlüdür. Uygulamada kredi kartı iadeleri 5-10 iş günü, banka havalesi iadeleri ise 3-5 iş günü içinde tamamlanmaktadır. Banka işlem süreleri bankalara göre farklılık gösterebilir.',
  },
];

function useActiveSection(ids: string[]): string {
  const [active, setActive] = useState(ids[0] ?? '');

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;

      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActive(id);
        },
        { rootMargin: '-30% 0px -60% 0px', threshold: 0 },
      );
      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, [ids]);

  return active;
}

function SidebarNav({ sections, active }: { sections: Section[]; active: string }) {
  return (
    <nav className="space-y-1">
      {sections.map((s) => (
        <a
          key={s.id}
          href={`#${s.id}`}
          className={`block rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
            active === s.id
              ? 'bg-emerald-50 text-emerald-700 border-l-2 border-emerald-500 pl-2.5'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          {s.label}
        </a>
      ))}
    </nav>
  );
}

function MobileTabs({ sections, active }: { sections: Section[]; active: string }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
      {sections.map((s) => (
        <a
          key={s.id}
          href={`#${s.id}`}
          className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-200 ${
            active === s.id
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          {s.label}
        </a>
      ))}
    </div>
  );
}

function AccordionItem({
  item,
  isOpen,
  onToggle,
}: {
  item: AccordionItem;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={`overflow-hidden rounded-xl border transition-all duration-200 ${
        isOpen
          ? 'border-emerald-200 bg-emerald-50/60'
          : 'border-slate-200 bg-white hover:border-slate-300'
      }`}
    >
      <button
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="text-sm font-semibold leading-snug text-slate-800">{item.question}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.25 }}
          className="mt-0.5 shrink-0"
        >
          <ChevronDown
            className={`h-5 w-5 transition-colors ${isOpen ? 'text-emerald-600' : 'text-slate-400'}`}
          />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: 'easeInOut' }}
          >
            <div className="border-t border-emerald-100 px-5 pb-4 pt-3">
              <p className="text-sm leading-relaxed text-slate-600">{item.answer}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SectionHeading({ id, title }: { id: string; title: string }) {
  return (
    <h2
      id={id}
      className="mb-4 scroll-mt-28 text-xl font-bold text-slate-900"
    >
      {title}
    </h2>
  );
}

export function WithdrawalRightsContent() {
  const pageContent = usePageContent('page_content_withdrawal', DEFAULT_CONTENT);
  const sectionIds = SECTIONS.map((s) => s.id);
  const activeSection = useActiveSection(sectionIds);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* HERO */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600 px-6 py-10 sm:py-12">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 left-10 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
        <div className="relative mx-auto max-w-3xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-white">
            <Shield className="h-3 w-3" />
            Tüketici Hakları
          </div>
          <h1 className="text-3xl font-extrabold leading-tight text-white sm:text-4xl">
            {pageContent.hero_title}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/80 sm:text-base">
            {pageContent.hero_description}
          </p>
          <p className="mt-3 text-xs text-white/60">
            Son güncelleme: Ocak 2025 &nbsp;·&nbsp; Yürürlük tarihi: 01.01.2025
          </p>
        </div>
      </div>

      {/* BODY */}
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="lg:flex lg:gap-10">
          {/* Desktop sticky sidebar */}
          <aside className="hidden lg:block lg:w-52 lg:shrink-0">
            <div className="sticky top-28">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                İçindekiler
              </p>
              <SidebarNav sections={SECTIONS} active={activeSection} />
              <div className="mt-6 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                <p className="text-xs font-semibold text-emerald-800">Yardıma mı ihtiyacınız var?</p>
                <p className="mt-1 text-xs text-emerald-700">
                  Destek ekibimiz Pzt–Cum 09:00–18:00 arasında hizmetinizde.
                </p>
                <Link
                  href="/contact"
                  className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900"
                >
                  İletişime Geç <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <main className="min-w-0 flex-1 max-w-3xl">
            {/* Mobile horizontal tabs */}
            <div className="mb-6 lg:hidden">
              <MobileTabs sections={SECTIONS} active={activeSection} />
            </div>

            <div className="space-y-12">
              {/* SECTION 1: 14 Günlük Cayma Hakkı */}
              <section>
                <SectionHeading id="14-gun" title="14 Günlük Cayma Hakkı" />
                <div className="mb-5 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-5">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                  <div>
                    <p className="text-sm font-bold text-amber-800">
                      14 gün içinde yazılı bildirim gerekir
                    </p>
                    <p className="mt-1 text-sm text-amber-700">
                      Sözleşme kurulduğu tarihten itibaren 14 takvim günü içinde herhangi bir
                      gerekçe göstermeksizin cayma hakkınızı kullanabilirsiniz. Süre tatil günleri
                      dahil işler; son günün resmi tatile denk gelmesi halinde takip eden ilk iş
                      günü esas alınır.
                    </p>
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm leading-relaxed text-slate-700">
                    6502 sayılı Tüketicinin Korunması Hakkında Kanun&apos;un 48. maddesi uyarınca,
                    mesafeli satış sözleşmelerinde tüketici, on dört gün içinde herhangi bir
                    gerekçe göstermeksizin ve cezai şart ödemeksizin sözleşmeden cayma hakkına
                    sahiptir. Bu hak, NetTapu platformu üzerinden kurulan uygun sözleşmeler için
                    geçerlidir.
                  </p>
                </div>
              </section>

              {/* SECTION 2: Koşullar */}
              <section>
                <SectionHeading id="kosullar" title="Cayma Hakkı Kullanım Koşulları" />
                <p className="mb-4 text-sm leading-relaxed text-slate-600">
                  Cayma hakkını kullanabilmek için aşağıdaki koşulların sağlanması gerekmektedir:
                </p>
                <ol className="space-y-3">
                  {[
                    {
                      n: 1,
                      text: 'Platformda kayıtlı ve kimlik doğrulaması tamamlanmış gerçek kişi kullanıcı olmak.',
                    },
                    {
                      n: 2,
                      text: '14 takvim günlük yasal süre dolmadan yazılı bildirimde bulunmak.',
                    },
                    {
                      n: 3,
                      text: 'Cayma talebinin cayma hakkı kapsamındaki bir işleme ilişkin olması.',
                    },
                    {
                      n: 4,
                      text: 'Hizmetin tamamen ifa edilmemiş ya da cayma hakkını düşürecek koşulların gerçekleşmemiş olması.',
                    },
                    {
                      n: 5,
                      text: 'Bildirimin e-posta, iadeli taahhütlü posta veya platform içi form aracılığıyla yapılması.',
                    },
                  ].map((item) => (
                    <li key={item.n} className="flex gap-3 text-sm text-slate-700">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                        {item.n}
                      </span>
                      <span className="pt-0.5 leading-relaxed">{item.text}</span>
                    </li>
                  ))}
                </ol>
              </section>

              {/* SECTION 3: İstisnalar */}
              <section>
                <SectionHeading id="istisnalar" title="Cayma Hakkı İstisnaları" />
                <p className="mb-4 text-sm leading-relaxed text-slate-600">
                  Aşağıdaki durumlarda cayma hakkı kullanılamaz:
                </p>
                <div className="mb-4 flex gap-3 rounded-xl border border-red-200 bg-red-50 p-5">
                  <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                  <div>
                    <p className="text-sm font-bold text-red-800">
                      İhale kazanan teklifler cayma hakkı dışındadır
                    </p>
                    <p className="mt-1 text-sm text-red-700">
                      Canlı açık artırma (ihale) ortamında verilen ve kabul edilen teklifler
                      yasal olarak bağlayıcıdır. 6502 sayılı Kanun&apos;un 48/5. maddesi uyarınca
                      açık artırmayla yapılan satışlarda cayma hakkı uygulanmaz.
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    {
                      title: 'Tapu Devri Tamamlanan Satışlar',
                      desc: 'Taşınmaz mülkiyetinin resmi tapu devirleriyle alıcıya geçtiği işlemler cayma hakkı kapsamı dışındadır.',
                    },
                    {
                      title: 'Fiyatı Piyasaya Bağlı Dalgalanan Hizmetler',
                      desc: 'Platform dışında belirlenen ve sağlayıcının kontrolü dışındaki fiyat hareketlerinden etkilenen işlemlerde cayma hakkı kullanılamaz.',
                    },
                    {
                      title: 'Kullanıcı Tarafından Başlatılan ve Tamamlanan Dijital İçerik',
                      desc: 'Kullanıcının açık onayıyla başlayıp cayma süresi içinde tam olarak ifa edilen dijital hizmetlerde cayma hakkı sona erer.',
                    },
                    {
                      title: 'Süresi Dolmuş Cayma Talebi',
                      desc: '14 takvim günlük yasal süre geçtikten sonra yapılan cayma bildirimleri kabul edilmez.',
                    },
                  ].map((item) => (
                    <div
                      key={item.title}
                      className="flex gap-3 rounded-xl border border-slate-200 bg-white p-4"
                    >
                      <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                        <p className="mt-0.5 text-sm text-slate-600">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* SECTION 4: Nasıl Kullanılır */}
              <section>
                <SectionHeading id="nasil-kullanilir" title="Nasıl Kullanılır?" />
                <p className="mb-6 text-sm leading-relaxed text-slate-600">
                  Cayma hakkınızı 3 adımda kullanabilirsiniz:
                </p>
                <div className="grid gap-4 sm:grid-cols-3">
                  {[
                    {
                      step: 1,
                      icon: FileText,
                      title: 'Bildirim',
                      desc: '14 gün içinde destek@nettapu.com adresine veya platform içi form aracılığıyla yazılı bildirim yapın. Sözleşme numarası ve cayma gerekçenizi belirtin.',
                      color: 'from-emerald-500 to-teal-600',
                    },
                    {
                      step: 2,
                      icon: Info,
                      title: 'Belgeler',
                      desc: 'Gerektiğinde kimlik fotokopisi, sözleşme kopyası ve ödeme dekontu talep edilebilir. Tüm belgeler dijital olarak iletilebilir.',
                      color: 'from-amber-500 to-orange-500',
                    },
                    {
                      step: 3,
                      icon: RefreshCcw,
                      title: 'İade',
                      desc: 'Geçerli bildirim alındıktan sonra ödeme 14 gün içinde iade edilir. Genellikle 5-10 iş günü içinde hesabınıza yansır.',
                      color: 'from-blue-500 to-indigo-600',
                    },
                  ].map(({ step, icon: Icon, title, desc, color }) => (
                    <div
                      key={step}
                      className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-5"
                    >
                      <div
                        className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${color} shadow-md`}
                      >
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                        Adım {step}
                      </p>
                      <p className="mt-1 font-bold text-slate-900">{title}</p>
                      <p className="mt-2 text-sm leading-relaxed text-slate-600">{desc}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* SECTION 5: İade Süreci */}
              <section>
                <SectionHeading id="iade-sureci" title="İade Süreci" />
                <div className="mb-5 flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                  <div>
                    <p className="text-sm font-bold text-emerald-800">
                      Depozito iadeleri 5-10 iş günü içinde yapılır
                    </p>
                    <p className="mt-1 text-sm text-emerald-700">
                      Geçerli cayma bildirimi alındıktan sonra ödemeniz yasal 14 günlük süre
                      içinde iade edilir. Uygulamada bu süre genellikle çok daha kısadır.
                    </p>
                  </div>
                </div>
                <div className="relative ml-3">
                  <div className="absolute left-3.5 top-0 h-full w-px bg-slate-200" />
                  {[
                    {
                      day: 'Gün 0',
                      title: 'Cayma Bildirimi',
                      desc: 'Yazılı bildirim NetTapu\'ya ulaşır ve sistem tarafından kaydedilir.',
                      icon: FileText,
                    },
                    {
                      day: 'Gün 1-2',
                      title: 'Değerlendirme',
                      desc: 'Ekibimiz bildirimi inceleyerek geçerliliğini doğrular. Eksik belge varsa bildirim yapılır.',
                      icon: Info,
                    },
                    {
                      day: 'Gün 3-5',
                      title: 'İade Başlatılır',
                      desc: 'İade süreci ödeme sağlayıcısında başlatılır. Kredi kartı iadeleri için banka süreçleri devreye girer.',
                      icon: RotateCcw,
                    },
                    {
                      day: 'Gün 5-10',
                      title: 'Hesabınıza Yansıma',
                      desc: 'Tutar banka veya kart hesabınıza yansır. Bankalara göre işlem süresi farklılık gösterebilir.',
                      icon: CheckCircle2,
                    },
                  ].map(({ day, title, desc, icon: Icon }, i) => (
                    <div key={i} className="relative mb-6 flex items-start gap-5 pl-10">
                      <div className="absolute left-0 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-emerald-600 shadow-sm">
                        <Icon className="h-3.5 w-3.5 text-white" />
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-emerald-600">
                          {day}
                        </p>
                        <p className="font-semibold text-slate-900">{title}</p>
                        <p className="mt-0.5 text-sm text-slate-600">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-2 overflow-hidden rounded-xl border border-slate-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Ödeme Yöntemi
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                          İade Süresi
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[
                        { method: 'Kredi / Banka Kartı', time: '5-10 iş günü' },
                        { method: 'Banka Havalesi / EFT', time: '3-5 iş günü' },
                        { method: 'Sanal Kart', time: '5-7 iş günü' },
                      ].map((row) => (
                        <tr key={row.method} className="bg-white">
                          <td className="px-4 py-3 font-medium text-slate-800">{row.method}</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                              <Clock className="h-3 w-3" />
                              {row.time}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* SECTION 6: FAQ */}
              <section>
                <SectionHeading id="sss" title="Sık Sorulan Sorular" />
                <div className="space-y-3">
                  {FAQ_ITEMS.map((item) => (
                    <AccordionItem
                      key={item.id}
                      item={item}
                      isOpen={openFaq === item.id}
                      onToggle={() => setOpenFaq(openFaq === item.id ? null : item.id)}
                    />
                  ))}
                </div>
              </section>

              {/* CONTACT CTA */}
              <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-slate-50 p-6 sm:p-8">
                <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600">
                  Yardım & Destek
                </p>
                <h3 className="mt-1 text-lg font-bold text-slate-900">
                  Daha fazla sorunuz mu var?
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Cayma hakkı veya iade sürecine ilişkin her türlü sorunuz için destek ekibimize
                  ulaşabilirsiniz. Pazartesi–Cuma 09:00–18:00 saatleri arasında hizmetinizdeyiz.
                </p>
                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/contact"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-200 transition-all duration-200 hover:bg-emerald-700"
                  >
                    İletişim Formu
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <a
                    href="mailto:destek@nettapu.com"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-all duration-200 hover:border-slate-400 hover:bg-slate-50"
                  >
                    destek@nettapu.com
                  </a>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
