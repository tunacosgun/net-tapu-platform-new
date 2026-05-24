'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { z } from 'zod';
import { AxiosError } from 'axios';
import { Mail, ArrowRight, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { NetTapuLogo } from '@/components/ui/nettapu-logo';
import type { ApiError } from '@/types';

const schema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi girin'),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordClient() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setServerError(null);
    try {
      await apiClient.post('/auth/forgot-password', { email: data.email });
      setSent(true);
    } catch (err) {
      if (err instanceof AxiosError) {
        const apiErr = err.response?.data as ApiError | undefined;
        const msg = Array.isArray(apiErr?.message) ? apiErr.message[0] : apiErr?.message;
        setServerError(msg || 'İşlem başarısız. Lütfen tekrar deneyin.');
      } else {
        setServerError('Beklenmeyen bir hata oluştu.');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="flex items-center justify-between mb-10">
          <Link href="/" className="inline-flex items-center">
            <NetTapuLogo variant="light" width={140} height={34} />
          </Link>
          <Link href="/login" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-brand-700 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Girişe dön
          </Link>
        </div>

        <span className="overline">Şifre Sıfırlama</span>
        <h1 className="mt-3 font-heading text-3xl sm:text-4xl font-extrabold text-ink-900 tracking-tight leading-tight">
          Şifremi Unuttum
        </h1>
        <p className="mt-2 text-slate-600">
          E-posta adresinizi girin, size sıfırlama bağlantısı gönderelim.
        </p>

        {sent ? (
          <div className="mt-8 rounded-md border-2 border-emerald-200 bg-emerald-50 p-5">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-emerald-900">Bağlantı gönderildi</p>
                <p className="mt-1 text-sm text-emerald-800">
                  E-posta adresinize sıfırlama bağlantısı gönderdik. Gelen kutunuzu (ve spam klasörünüzü) kontrol edin.
                </p>
              </div>
            </div>
            <Link
              href="/login"
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-brand-700 hover:text-brand-800"
            >
              <ArrowLeft className="h-4 w-4" />
              Giriş sayfasına dön
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
            {serverError && (
              <div className="rounded-md border-2 border-rose-200 bg-rose-50 p-3 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-rose-800">{serverError}</p>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-2">
                E-posta
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  {...register('email')}
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="ornek@email.com"
                  className="w-full pl-11 pr-4 py-3.5 bg-white border-2 border-slate-200 rounded-md text-ink-900 text-[15px] placeholder:text-slate-400 focus:outline-none focus:border-brand-600 focus:shadow-brand transition-all"
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs text-rose-600">{errors.email.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-brand-700 hover:bg-brand-800 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-bold rounded-md transition-all"
            >
              {isSubmitting ? 'Gönderiliyor...' : 'Sıfırlama Bağlantısı Gönder'}
              {!isSubmitting && <ArrowRight className="h-4 w-4" />}
            </button>

            <p className="text-center text-sm text-slate-600">
              Şifrenizi hatırladınız mı?{' '}
              <Link href="/login" className="font-bold text-brand-700 hover:text-brand-800">
                Giriş yapın
              </Link>
            </p>
          </form>
        )}
      </motion.div>
    </div>
  );
}
