'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { z } from 'zod';
import { AxiosError } from 'axios';
import { Handshake, Mail, Phone, MapPin, Briefcase, Send, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { NetTapuLogo } from '@/components/ui/nettapu-logo';
import type { ApiError } from '@/types';

const schema = z.object({
  fullName: z.string().min(3, 'Ad Soyad en az 3 karakter olmalı'),
  phone: z.string().min(10, 'Geçerli bir telefon girin'),
  email: z.string().email('Geçerli bir e-posta girin'),
  city: z.string().min(2, 'Şehir bilgisi gerekli'),
  experience: z.string().min(20, 'Deneyiminizi en az 20 karakterle açıklayın'),
});

type FormData = z.infer<typeof schema>;

export default function BecomeConsultantClient() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setServerError(null);
    try {
      const message = [
        '[DANIŞMAN BAŞVURUSU]',
        `Şehir/Bölge: ${data.city}`,
        '',
        'Deneyim & Tanıtım:',
        data.experience,
      ].join('\n');

      await apiClient.post('/crm/contact-requests', {
        type: 'general',
        name: data.fullName,
        phone: data.phone,
        email: data.email,
        message,
      });
      setDone(true);
    } catch (err) {
      if (err instanceof AxiosError) {
        const apiErr = err.response?.data as ApiError | undefined;
        const msg = Array.isArray(apiErr?.message) ? apiErr.message[0] : apiErr?.message;
        setServerError(msg || 'Başvuru gönderilemedi. Lütfen tekrar deneyin.');
      } else {
        setServerError('Beklenmeyen bir hata oluştu.');
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <div className="flex items-center justify-between mb-10">
          <Link href="/" className="inline-flex items-center">
            <NetTapuLogo variant="light" width={140} height={34} />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-brand-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Ana sayfaya dön
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-emerald-100 mb-4">
            <Handshake className="h-7 w-7 text-emerald-700" />
          </div>
          <h1 className="font-heading text-4xl font-extrabold text-ink-900 tracking-tight">
            NetTapu Danışmanı Olun
          </h1>
          <p className="mt-3 text-slate-600 max-w-xl mx-auto">
            Bölgenizde NetTapu'yu temsil edin. Kendi portföyünüzü yönetin, alıcı ile satıcıyı
            buluşturun, komisyon kazanın. Başvurunuz incelendikten sonra ekibimiz sizinle iletişime
            geçecektir.
          </p>
        </motion.div>

        {done ? (
          <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50 p-6 text-center">
            <div className="mx-auto h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
              <CheckCircle2 className="h-7 w-7 text-emerald-700" />
            </div>
            <h2 className="text-xl font-bold text-emerald-900">Başvurunuz alındı</h2>
            <p className="mt-2 text-sm text-emerald-800">
              Ekibimiz başvurunuzu inceleyip 2-3 iş günü içinde size dönecektir.
            </p>
            <Link href="/" className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-emerald-700 hover:text-emerald-800">
              <ArrowLeft className="h-4 w-4" /> Ana sayfaya dön
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
            {serverError && (
              <div className="rounded-md border-2 border-rose-200 bg-rose-50 p-3 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-rose-800">{serverError}</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Ad Soyad *" error={errors.fullName?.message}>
                <input
                  {...register('fullName')}
                  placeholder="Ali Yılmaz"
                  className={inputCls}
                />
              </Field>
              <Field label="Telefon *" error={errors.phone?.message}>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    {...register('phone')}
                    placeholder="05XX XXX XX XX"
                    className={`${inputCls} pl-9`}
                  />
                </div>
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="E-posta *" error={errors.email?.message}>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    {...register('email')}
                    type="email"
                    placeholder="ornek@email.com"
                    className={`${inputCls} pl-9`}
                  />
                </div>
              </Field>
              <Field label="Şehir / Bölge *" error={errors.city?.message}>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    {...register('city')}
                    placeholder="Antalya / Manavgat"
                    className={`${inputCls} pl-9`}
                  />
                </div>
              </Field>
            </div>

            <Field label="Deneyim & Kendinizden Bahsedin *" error={errors.experience?.message}>
              <div className="relative">
                <Briefcase className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <textarea
                  {...register('experience')}
                  rows={5}
                  placeholder="Emlak/gayrimenkul deneyiminizi, çalıştığınız bölgeleri ve neden NetTapu danışmanı olmak istediğinizi anlatın..."
                  className={`${inputCls} pl-9`}
                />
              </div>
            </Field>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-md bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 disabled:opacity-60"
            >
              {isSubmitting ? 'Gönderiliyor...' : 'Başvuruyu Gönder'}
              <Send className="h-4 w-4" />
            </button>

            <p className="text-xs text-center text-slate-500">
              Başvurunuz NetTapu CRM ekibine iletilir ve KVKK kapsamında işlenir.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

const inputCls =
  'w-full px-3 py-2.5 bg-white border border-slate-200 rounded-md text-sm text-ink-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100';

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1.5">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </div>
  );
}
