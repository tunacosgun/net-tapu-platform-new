'use client';

import { useState } from 'react';
import { usePageContent } from '@/hooks/use-page-content';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileSignature,
  CreditCard,
  FileCheck,
  Key,
  CheckCircle2,
  Phone,
  MessageCircle,
  Mail,
  ChevronDown,
  ArrowRight,
  Clock,
  Shield,
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
  hero_title: 'Satıştan Sonra Da Yanınızdayız',
  hero_subtitle: 'Satış Sonrası Destek',
  hero_description: 'Sözleşmeden tapu tesciline kadar her adımda uzman ekibimiz sizi yönlendirir.',
  services: [
    { title: 'Sözleşme İmzalama', description: 'Satış kararının ardından satış sözleşmesi taraflarca imzalanır.' },
    { title: 'Ödeme Planı', description: 'Ödeme takvimi ve taksit planı netleştirilir, depozito iadesi başlatılır.' },
    { title: 'Tapu Başvurusu', description: 'Gerekli belgeler hazırlanır ve Tapu Müdürlüğü\'ne başvuru yapılır.' },
    { title: 'Tapu Devri', description: 'Tapu Müdürlüğü\'nde resmi devir işlemi gerçekleştirilir.' },
    { title: 'Teslim', description: 'Tapunuz tescillenir ve arsa fiilen size devredilir.' },
  ],
};

interface TimelineStep {
  icon: React.ReactNode;
  title: string;
  timing: string;
  description: string;
  detail: string;
  done: boolean;
}

const TIMELINE_STEPS: TimelineStep[] = [
  {
    icon: <FileSignature className="h-5 w-5" />,
    title: 'Sözleşme İmzalama',
    timing: 'Hemen',
    description: 'Satış kararının ardından satış sözleşmesi taraflarca imzalanır.',
    detail: 'Dijital imza veya noter onaylı fiziksel imza seçenekleriyle gerçekleştirilen sözleşme, tüm koşulları hukuken bağlayıcı biçimde belgeler. Ekibimiz süreci sizin adınıza yönetir.',
    done: true,
  },
  {
    icon: <CreditCard className="h-5 w-5" />,
    title: 'Ödeme Planı',
    timing: '1 – 3 gün',
    description: 'Ödeme takvimi ve taksit planı netleştirilir, depozito iadesi başlatılır.',
    detail: 'Kapora ve satış tutarının ödeme düzeni belirlenir. Katılmayan ihale katılımcılarının depozitoları bu aşamada iade sürecine girer. Tüm finansal akış NetTapu güvencesi altındadır.',
    done: true,
  },
  {
    icon: <FileCheck className="h-5 w-5" />,
    title: 'Tapu Başvurusu',
    timing: '3 – 7 gün',
    description: 'Gerekli belgeler hazırlanır ve Tapu Müdürlüğü\'ne başvuru yapılır.',
    detail: 'Nüfus cüzdanı sureti, tapu senedi, vergi borcu yoktur yazısı ve diğer belgeler ekibimiz tarafından kontrol edilir. Randevu alınarak tapu müdürlüğüne başvuru tamamlanır.',
    done: true,
  },
  {
    icon: <Key className="h-5 w-5" />,
    title: 'Tapu Devri',
    timing: '7 – 30 gün',
    description: 'Tapu Müdürlüğü\'nde resmi devir işlemi gerçekleştirilir.',
    detail: 'Tapu Müdürlüğü\'nde alıcı ve satıcının birlikte imzalamasıyla tapu devri tamamlanır. Tapu harcı ve masrafları bu aşamada ödenir. Uzman ekibimiz tüm süreçte yanınızdadır.',
    done: false,
  },
  {
    icon: <CheckCircle2 className="h-5 w-5" />,
    title: 'Teslim',
    timing: 'Tamamlandı',
    description: 'Tapunuz tescillenir ve arsa fiilen size devredilir.',
    detail: 'Tapu siciline tescil edilen mülkünüz artık tamamen sizin. Gerekirse yerinde teslim tutanağı düzenlenir. Satış sonrası danışmanlık hizmetlerimiz bu noktadan sonra da devam eder.',
    done: false,
  },
];

interface FaqItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'Tapu devri ne kadar sürer?',
    answer: 'Belgelerin eksiksiz teslim edilmesi ve randevu planlamasına bağlı olarak tapu devri genellikle 7 ile 30 gün arasında tamamlanmaktadır. NetTapu uzman ekibi süreci hızlandırmak için ilgili kurumlarla iletişimi sizin adınıza yürütür.',
  },
  {
    question: 'Depozitom ne zaman iade edilir?',
    answer: 'İhaleyi kazanamayan katılımcıların depozitoları, ihale kapanışından itibaren 3 iş günü içinde kayıtlı banka hesabına iade edilir. Kazanan tarafın depozitosu satış bedelinden düşülür.',
  },
  {
    question: 'Tapu devri sırasında bizzat bulunmam gerekiyor mu?',
    answer: 'Evet, tapu devri işlemi Tapu Müdürlüğü\'nde alıcı ve satıcının imzası ile tamamlanır. Bizzat bulunamıyorsanız noter onaylı vekaletname ile yetkilendirdiğiniz kişi sizin adınıza işlemi gerçekleştirebilir.',
  },
  {
    question: 'Satın aldığım arazinin imar durumunu nasıl öğrenebilirim?',
    answer: 'İlgili Belediye\'nin İmar Müdürlüğü\'nden veya e-devlet üzerinden imar durumu sorgulanabilir. NetTapu satış sonrası danışmanlık hizmetimiz kapsamında imar durumu tespiti için de destek verilmektedir.',
  },
  {
    question: 'Satın alma sonrası hangi desteklerden yararlanabilirim?',
    answer: 'NetTapu satış sonrasında; tapu takibi, teknik altyapı danışmanlığı (elektrik, su, yol), imar durumu takibi ve yatırım değerleme hizmetlerini sunmaya devam eder. Tüm bu hizmetlere 7/24 destek kanallarımız üzerinden ulaşabilirsiniz.',
  },
];

function SupportCard({
  icon,
  title,
  channel,
  sla,
  href,
  accentClass,
}: {
  icon: React.ReactNode;
  title: string;
  channel: string;
  sla: string;
  href?: string;
  accentClass: string;
}) {
  const Inner = (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 h-full group hover:border-emerald-100 hover:shadow-md transition-all shadow-sm">
      <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${accentClass} mb-4`}>
        {icon}
      </div>
      <h3 className="text-base font-semibold text-slate-900 mb-1">{title}</h3>
      <p className="text-sm text-slate-600 mb-3">{channel}</p>
      <div className="flex items-center gap-2">
        <Clock className="h-3.5 w-3.5 text-slate-400" />
        <span className="text-xs text-slate-500">{sla}</span>
      </div>
    </div>
  );

  if (href) {
    return (
      <motion.a whileHover={{ y: -3 }} href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer">
        {Inner}
      </motion.a>
    );
  }
  return <motion.div whileHover={{ y: -3 }}>{Inner}</motion.div>;
}

function FaqRow({ item, index }: { item: FaqItem; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35 }}
      className="rounded-2xl border border-slate-100 overflow-hidden bg-white shadow-sm"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-slate-50 transition-colors"
      >
        <span className="text-sm font-medium text-slate-900">{item.question}</span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0"
        >
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="px-5 py-4 border-t border-slate-100 bg-slate-50">
              <p className="text-sm text-slate-600 leading-relaxed">{item.answer}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function PostSaleContent() {
  const content = usePageContent('page_content_post_sale', DEFAULT_CONTENT);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600">
        <div className="pointer-events-none absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-white/10 blur-[120px]" />
        <div className="pointer-events-none absolute top-0 right-1/3 h-64 w-64 rounded-full bg-white/10 blur-[100px]" />

        <div className="relative px-4 pt-20 pb-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/20 px-4 py-1.5 text-xs font-medium text-white mb-6">
              <Shield className="h-3 w-3" />
              Satış Sonrası Destek
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-4">
              {content.hero_title}
            </h1>
            <p className="max-w-xl mx-auto text-base text-white/80">
              {content.hero_description}
            </p>
          </motion.div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 pb-24 pt-12 space-y-20">
        {/* Vertical Timeline */}
        <section>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-10 text-center"
          >
            <h2 className="text-2xl font-bold text-slate-900">Süreç Adımları</h2>
            <p className="mt-2 text-sm text-slate-500">Satış tamamlandıktan sonra süreç bu adımları izler</p>
          </motion.div>

          <div className="relative">
            <div className="absolute left-6 top-8 bottom-8 w-px bg-gradient-to-b from-emerald-400 via-emerald-200 to-transparent" />

            <div className="space-y-4">
              {TIMELINE_STEPS.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="relative flex gap-6"
                >
                  <div className="relative z-10 shrink-0">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl border transition-all ${
                        step.done
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                          : 'bg-white border-slate-200 text-slate-400'
                      }`}
                    >
                      {step.icon}
                    </div>
                    {step.done && (
                      <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 flex items-center justify-center">
                        <CheckCircle2 className="h-2.5 w-2.5 text-white" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 pb-2">
                    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <h3 className="text-sm font-semibold text-slate-900">{step.title}</h3>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium border ${
                            step.done
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                              : 'bg-slate-50 border-slate-200 text-slate-500'
                          }`}
                        >
                          {step.timing}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">{step.detail}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Support Channels */}
        <section>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8 text-center"
          >
            <h2 className="text-2xl font-bold text-slate-900">Destek Kanalları</h2>
            <p className="mt-2 text-sm text-slate-500">Sorularınız için birden fazla kanaldan ulaşabilirsiniz</p>
          </motion.div>
          <div className="grid gap-4 sm:grid-cols-3">
            <SupportCard
              icon={<Phone className="h-6 w-6 text-emerald-600" />}
              title="Telefon"
              channel="0850 XXX XX XX"
              sla="Hafta içi 09:00 – 18:00"
              href="tel:0850XXXXXXX"
              accentClass="bg-emerald-50"
            />
            <SupportCard
              icon={
                <svg className="h-6 w-6 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              }
              title="WhatsApp"
              channel="Mesaj Gönder"
              sla="7/24 yanıt"
              href="https://wa.me/905XXXXXXXXX"
              accentClass="bg-green-50"
            />
            <SupportCard
              icon={<Mail className="h-6 w-6 text-blue-600" />}
              title="E-posta"
              channel="destek@nettapu.com"
              sla="24 saat içinde yanıt"
              href="mailto:destek@nettapu.com"
              accentClass="bg-blue-50"
            />
          </div>
        </section>

        {/* FAQ */}
        <section>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mb-8 text-center"
          >
            <h2 className="text-2xl font-bold text-slate-900">Sık Sorulan Sorular</h2>
            <p className="mt-2 text-sm text-slate-500">Satış sonrası süreçle ilgili merak edilenler</p>
          </motion.div>
          <div className="space-y-3">
            {FAQ_ITEMS.map((item, i) => (
              <FaqRow key={i} item={item} index={i} />
            ))}
          </div>
        </section>

        {/* CTA */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600 p-8 sm:p-10 text-center shadow-lg"
        >
          <h2 className="text-2xl font-bold text-white">Desteğe mi İhtiyacınız Var?</h2>
          <p className="mt-3 text-sm text-white/80 max-w-md mx-auto">
            Satış sonrası her türlü sorunuz için ekibimize ulaşabilirsiniz. 7/24 hizmetinizdeyiz.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors shadow-md"
            >
              İletişime Geç
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/faq"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/20 px-6 py-3 text-sm font-semibold text-white hover:bg-white/30 transition-colors"
            >
              Tüm SSS
            </Link>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
