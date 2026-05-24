'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { z } from 'zod';
import { AxiosError } from 'axios';
import { Lock, ArrowRight, AlertCircle, Eye, EyeOff, CheckCircle2, ArrowLeft } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { NetTapuLogo } from '@/components/ui/nettapu-logo';
import type { ApiError } from '@/types';

const schema = z
  .object({
    newPassword: z.string().min(8, 'Şifre en az 8 karakter olmalıdır'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Şifreler eşleşmiyor',
    path: ['confirmPassword'],
  });

type FormData = z.infer<typeof schema>;

export default function ResetPasswordClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get('token') ?? '';

  const [serverError, setServerError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setServerError(null);
    if (!token) {
      setServerError('Geçersiz veya eksik sıfırlama bağlantısı.');
      return;
    }
    try {
      await apiClient.post('/auth/reset-password', { token, newPassword: data.newPassword });
      setDone(true);
      setTimeout(() => router.push('/login?reset=success'), 1800);
    } catch (err) {
      if (err instanceof AxiosError) {
        const apiErr = err.response?.data as ApiError | undefined;
        const msg = Array.isArray(apiErr?.message) ? apiErr.message[0] : apiErr?.message;
        setServerError(msg || 'Sıfırlama başarısız. Bağlantının geçerli olduğundan emin olun.');
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

        <span className="overline">Yeni Şifre</span>
        <h1 className="mt-3 font-heading text-3xl sm:text-4xl font-extrabold text-ink-900 tracking-tight leading-tight">
          Şifreni Sıfırla
        </h1>
        <p className="mt-2 text-slate-600">Hesabın için yeni bir şifre belirle.</p>

        {!token && (
          <div className="mt-8 rounded-md border-2 border-amber-200 bg-amber-50 p-3 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-900">
              Sıfırlama bağlantısı eksik veya geçersiz. Lütfen e-postanızdaki bağlantıyı tekrar açın.
            </p>
          </div>
        )}

        {done ? (
          <div className="mt-8 rounded-md border-2 border-emerald-200 bg-emerald-50 p-5 flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-emerald-900">Şifreniz güncellendi</p>
              <p className="mt-1 text-sm text-emerald-800">Giriş sayfasına yönlendiriliyorsunuz...</p>
            </div>
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
              <label htmlFor="newPassword" className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-2">
                Yeni Şifre
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  {...register('newPassword')}
                  id="newPassword"
                  type={showPwd ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-11 py-3.5 bg-white border-2 border-slate-200 rounded-md text-ink-900 text-[15px] placeholder:text-slate-400 focus:outline-none focus:border-brand-600 focus:shadow-brand transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-ink-700"
                  aria-label="Şifreyi göster"
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.newPassword && (
                <p className="mt-1.5 text-xs text-rose-600">{errors.newPassword.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-2">
                Şifre Tekrar
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  {...register('confirmPassword')}
                  id="confirmPassword"
                  type={showPwd ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3.5 bg-white border-2 border-slate-200 rounded-md text-ink-900 text-[15px] placeholder:text-slate-400 focus:outline-none focus:border-brand-600 focus:shadow-brand transition-all"
                />
              </div>
              {errors.confirmPassword && (
                <p className="mt-1.5 text-xs text-rose-600">{errors.confirmPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !token}
              className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-brand-700 hover:bg-brand-800 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-bold rounded-md transition-all"
            >
              {isSubmitting ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
              {!isSubmitting && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
