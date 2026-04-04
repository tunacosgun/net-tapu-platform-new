'use client';

import { useState, useRef, useEffect } from 'react';
import { usePageContent } from '@/hooks/use-page-content';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone,
  MessageCircle,
  Mail,
  MapPin,
  Clock,
  Instagram,
  Twitter,
  Youtube,
  Linkedin,
  Send,
  CheckCircle2,
  Loader2,
  ChevronDown,
} from 'lucide-react';
import Link from 'next/link';

/* ─── defaults ────────────────────────────────────────── */

const DEFAULT_CONTENT = {
  hero_title: 'Bize Ulaşın',
  hero_subtitle: '7/24 Destek',
  address: 'NetTapu Gayrimenkul Teknoloji A.Ş.\nMaslak, Büyükdere Cad. No:123\nSarıyer / İstanbul, 34398',
  working_hours: '',
};

interface FormData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

function FloatingInput({
  id,
  label,
  type = 'text',
  value,
  onChange,
  error,
  textarea = false,
}: {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  textarea?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const raised = focused || value.length > 0;

  const sharedProps = {
    id,
    value,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange(e.target.value),
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
    className:
      'w-full bg-transparent pt-6 pb-2 px-4 text-slate-900 text-sm outline-none resize-none',
  };

  return (
    <div className="relative">
      <div
        className={`relative rounded-xl border transition-all duration-200 overflow-hidden ${
          error
            ? 'border-red-300 bg-red-50'
            : focused
            ? 'border-emerald-400 bg-white'
            : 'border-slate-200 bg-white'
        }`}
      >
        <motion.label
          htmlFor={id}
          animate={{
            y: raised ? -8 : 0,
            scale: raised ? 0.75 : 1,
            color: focused ? '#059669' : '#94a3b8',
          }}
          transition={{ duration: 0.15 }}
          className="absolute left-4 top-4 origin-left text-sm font-medium pointer-events-none"
          style={{ color: '#94a3b8' }}
        >
          {label}
        </motion.label>

        {textarea ? (
          <textarea rows={5} {...sharedProps} />
        ) : (
          <input type={type} {...sharedProps} />
        )}

        <motion.div
          animate={{ scaleX: focused ? 1 : 0 }}
          transition={{ duration: 0.2 }}
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 origin-left"
        />
      </div>
      {error && (
        <p className="mt-1 text-xs text-red-500 pl-1">{error}</p>
      )}
    </div>
  );
}

const SUBJECTS = [
  'Genel Bilgi',
  'Arsa / Gayrimenkul Bilgisi',
  'Açık Artırma / İhale',
  'Ödeme / Depozito',
  'Teknik Destek',
  'İş Birliği / Bayilik',
  'Şikayet / Öneri',
];

function FloatingSelect({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const raised = value.length > 0 || focused;

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setFocused(false);
      }
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <div
        onClick={() => { setOpen(!open); setFocused(true); }}
        className={`relative rounded-xl border transition-all duration-200 cursor-pointer overflow-hidden ${
          error
            ? 'border-red-300 bg-red-50'
            : open
            ? 'border-emerald-400 bg-white'
            : 'border-slate-200 bg-white'
        }`}
      >
        <motion.label
          animate={{
            y: raised ? -8 : 0,
            scale: raised ? 0.75 : 1,
            color: open ? '#059669' : '#94a3b8',
          }}
          transition={{ duration: 0.15 }}
          className="absolute left-4 top-4 origin-left text-sm font-medium pointer-events-none"
          style={{ color: '#94a3b8' }}
        >
          Konu
        </motion.label>
        <div className="pt-6 pb-2 px-4 text-sm text-slate-900 min-h-[56px] flex items-end justify-between pr-10">
          <span className={value ? 'text-slate-900' : 'text-transparent'}>
            {value || 'placeholder'}
          </span>
        </div>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="absolute right-4 top-1/2 -translate-y-1/2"
        >
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </motion.div>
        <motion.div
          animate={{ scaleX: open ? 1 : 0 }}
          transition={{ duration: 0.2 }}
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 origin-left"
        />
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-2 w-full rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden"
          >
            {SUBJECTS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => { onChange(s); setOpen(false); setFocused(false); }}
                className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                  value === s
                    ? 'text-emerald-700 bg-emerald-50'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {s}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      {error && <p className="mt-1 text-xs text-red-500 pl-1">{error}</p>}
    </div>
  );
}

function ContactCard({
  icon,
  label,
  value,
  sub,
  href,
  accentClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  href?: string;
  accentClass: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.01 }}
      className="rounded-2xl border border-slate-100 bg-white p-5 flex items-start gap-4 shadow-sm"
    >
      <div
        className={`shrink-0 flex h-11 w-11 items-center justify-center rounded-xl ${accentClass}`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-0.5">
          {label}
        </p>
        {href ? (
          <a
            href={href}
            target={href.startsWith('http') ? '_blank' : undefined}
            rel="noopener noreferrer"
            className="text-sm font-semibold text-slate-900 hover:text-emerald-600 transition-colors block truncate"
          >
            {value}
          </a>
        ) : (
          <p className="text-sm font-semibold text-slate-900 truncate">{value}</p>
        )}
        <p className="mt-0.5 text-xs text-slate-500">{sub}</p>
      </div>
    </motion.div>
  );
}

function SuccessState({ onReset }: { onReset: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 15 }}
        className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 border border-emerald-200"
      >
        <CheckCircle2 className="h-10 w-10 text-emerald-500" />
      </motion.div>
      <motion.h3
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="text-2xl font-bold text-slate-900"
      >
        Mesajınız Alındı!
      </motion.h3>
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="mt-3 text-sm text-slate-500 max-w-sm"
      >
        En kısa sürede size geri dönüş yapacağız. Teşekkür ederiz.
      </motion.p>
      <motion.button
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        onClick={onReset}
        className="mt-8 rounded-xl border border-slate-200 bg-slate-50 px-6 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
      >
        Yeni Mesaj Gönder
      </motion.button>
    </motion.div>
  );
}

export function ContactPageContent() {
  const content = usePageContent('page_content_contact', DEFAULT_CONTENT);
  const [form, setForm] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  function set(key: keyof FormData) {
    return (v: string) => {
      setForm((f) => ({ ...f, [key]: v }));
      if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
    };
  }

  function validate(): boolean {
    const errs: Partial<FormData> = {};
    if (form.name.trim().length < 2) errs.name = 'Ad en az 2 karakter olmalıdır';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = 'Geçerli bir e-posta giriniz';
    if (!/^[0-9+\-\s()]{10,}$/.test(form.phone))
      errs.phone = 'Geçerli bir telefon numarası giriniz';
    if (!form.subject) errs.subject = 'Konu seçiniz';
    if (form.message.trim().length < 10)
      errs.message = 'Mesaj en az 10 karakter olmalıdır';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 1400));
    setSubmitting(false);
    setSuccess(true);
  }

  const SOCIAL = [
    { icon: <Instagram className="h-4 w-4" />, href: 'https://instagram.com/nettapu', label: 'Instagram', hover: 'hover:text-pink-600 hover:border-pink-200 hover:bg-pink-50' },
    { icon: <Twitter className="h-4 w-4" />, href: 'https://twitter.com/nettapu', label: 'X', hover: 'hover:text-slate-900 hover:border-slate-300 hover:bg-slate-50' },
    { icon: <Youtube className="h-4 w-4" />, href: 'https://youtube.com/@nettapu', label: 'YouTube', hover: 'hover:text-red-600 hover:border-red-200 hover:bg-red-50' },
    { icon: <Linkedin className="h-4 w-4" />, href: 'https://linkedin.com/company/nettapu', label: 'LinkedIn', hover: 'hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600">
        <div className="pointer-events-none absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-white/10 blur-[120px]" />
        <div className="pointer-events-none absolute -top-20 right-1/4 h-72 w-72 rounded-full bg-white/10 blur-[100px]" />

        <div className="relative px-4 pt-20 pb-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/20 px-4 py-1.5 text-xs font-medium text-white mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
              {content.hero_subtitle}
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-4">
              {content.hero_title}
            </h1>
            <p className="max-w-xl mx-auto text-base sm:text-lg text-white/80">
              Sorularınız, önerileriniz veya destek talepleriniz için bir mesaj bırakın.
              En kısa sürede yanıt vereceğiz.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-12 pb-24">
        <div className="grid gap-8 lg:grid-cols-5">
          {/* Left: Form */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-3"
          >
            <div className="rounded-2xl border border-slate-100 bg-white p-6 sm:p-8 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900 mb-1">Mesaj Gönderin</h2>
              <p className="text-sm text-slate-500 mb-8">Tüm alanları doldurun, ekibimiz size ulaşsın.</p>

              <AnimatePresence mode="wait">
                {success ? (
                  <SuccessState key="success" onReset={() => { setSuccess(false); setForm({ name: '', email: '', phone: '', subject: '', message: '' }); }} />
                ) : (
                  <motion.form
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onSubmit={handleSubmit}
                    className="space-y-4"
                  >
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FloatingInput id="name" label="Ad Soyad *" value={form.name} onChange={set('name')} error={errors.name} />
                      <FloatingInput id="phone" label="Telefon *" type="tel" value={form.phone} onChange={set('phone')} error={errors.phone} />
                    </div>
                    <FloatingInput id="email" label="E-posta *" type="email" value={form.email} onChange={set('email')} error={errors.email} />
                    <FloatingSelect value={form.subject} onChange={set('subject')} error={errors.subject} />
                    <FloatingInput id="message" label="Mesajınız *" value={form.message} onChange={set('message')} error={errors.message} textarea />

                    <motion.button
                      type="submit"
                      disabled={submitting}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className="w-full sm:w-auto inline-flex items-center gap-2.5 rounded-xl bg-emerald-600 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-200 transition-opacity hover:bg-emerald-700 disabled:opacity-60"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Gönderiliyor...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          Mesaj Gönder
                        </>
                      )}
                    </motion.button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Right: Info Panel */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-2 space-y-4"
          >
            <ContactCard
              icon={<Phone className="h-5 w-5 text-emerald-600" />}
              label="Telefon"
              value="0850 XXX XX XX"
              sub="Hafta içi 09:00 – 18:00"
              href="tel:0850XXXXXXX"
              accentClass="bg-emerald-50"
            />
            <ContactCard
              icon={
                <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              }
              label="WhatsApp"
              value="Mesaj Gönder"
              sub="7/24 hızlı yanıt"
              href="https://wa.me/905XXXXXXXXX?text=Merhaba%2C%20NetTapu%20hakk%C4%B1nda%20bilgi%20almak%20istiyorum."
              accentClass="bg-green-50"
            />
            <ContactCard
              icon={<Mail className="h-5 w-5 text-blue-600" />}
              label="E-posta"
              value="info@nettapu.com"
              sub="7/24 yanıt"
              href="mailto:info@nettapu.com"
              accentClass="bg-blue-50"
            />

            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="h-4 w-4 text-emerald-600" />
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Adres</p>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {content.address || DEFAULT_CONTENT.address}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-amber-500" />
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Çalışma Saatleri</p>
              </div>
              <div className="space-y-2 text-sm">
                {[
                  { day: 'Pazartesi – Cuma', time: '09:00 – 18:00', open: true },
                  { day: 'Cumartesi', time: '10:00 – 14:00', open: true },
                  { day: 'Pazar', time: 'Kapalı', open: false },
                ].map((r) => (
                  <div key={r.day} className="flex items-center justify-between">
                    <span className="text-slate-500">{r.day}</span>
                    <span className={r.open ? 'text-slate-900 font-medium' : 'text-red-500 font-medium'}>{r.time}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-4">Sosyal Medya</p>
              <div className="flex gap-3">
                {SOCIAL.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className={`flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-400 transition-all duration-200 ${s.hover}`}
                  >
                    {s.icon}
                  </a>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Map Placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8"
        >
          <div className="rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100 bg-white flex items-center gap-2">
              <MapPin className="h-4 w-4 text-emerald-600" />
              <h3 className="text-sm font-semibold text-slate-900">Konum</h3>
            </div>
            <div
              className="relative h-64 overflow-hidden bg-slate-100"
            >
              <svg className="absolute inset-0 w-full h-full opacity-30" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#94a3b8" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                  <motion.div
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    className="relative"
                  >
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                      <MapPin className="h-6 w-6 text-white" />
                    </div>
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-2 w-2 rounded-full bg-emerald-400 opacity-60 blur-sm" />
                  </motion.div>
                  <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-center shadow-sm">
                    <p className="text-xs font-semibold text-slate-900">NetTapu Genel Merkez</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Maslak, İstanbul</p>
                  </div>
                </div>
              </div>
              <div className="absolute bottom-4 right-4 text-[10px] text-slate-400">Harita gösterimi (illüstrasyon)</div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
