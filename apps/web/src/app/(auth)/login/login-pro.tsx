'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { useLogin } from '@/providers/auth-provider';
import { loginSchema, type LoginFormData } from '@/lib/validators';
import { useRateLimit } from '@/hooks/use-rate-limit';
import { LoadingState } from '@/components/ui';
import { NetTapuLogo } from '@/components/ui/nettapu-logo';
import type { ApiError } from '@/types';
import { AxiosError } from 'axios';
import { Mail, Lock, ArrowRight, AlertCircle, Eye, EyeOff, CheckCircle2, Shield, Zap, ArrowLeft } from 'lucide-react';

export default function LoginPagePro() {
  return (
    <Suspense fallback={<LoadingState />}>
      <LoginContent />
    </Suspense>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg className="h-[18px] w-[18px]" viewBox="0 0 384 512" fill="currentColor">
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.6 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
    </svg>
  );
}

function LoginContent() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const { cooldown, isLimited, checkRateLimit } = useRateLimit();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

  const login = useLogin();
  const searchParams = useSearchParams();
  const redirectTo = searchParams?.get('redirect') || searchParams?.get('returnTo') || '/';

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    if (isLimited) return;
    try {
      await login(data.email, data.password);
      window.location.href = redirectTo;
    } catch (err) {
      if (checkRateLimit(err)) return;
      if (err instanceof AxiosError) {
        const apiErr = err.response?.data as ApiError | undefined;
        const errorMsg = Array.isArray(apiErr?.message) ? apiErr.message[0] : apiErr?.message;
        setServerError(errorMsg || 'Giriş başarısız. Lütfen bilgilerinizi kontrol edin.');
      } else {
        setServerError('Beklenmeyen bir hata oluştu.');
      }
    }
  };

  const handleGoogleLogin = () => { window.location.href = `/api/v1/auth/google`; };
  const handleAppleLogin = () => { alert('Apple ile Giriş web için yakında eklenecektir.'); };

  return (
    <div className="min-h-screen flex bg-white" data-testid="login-page">
      {/* ═══ Form column ═══ */}
      <div className="flex-1 flex flex-col px-6 py-8 lg:px-14 lg:py-12">
        <div className="flex items-center justify-between mb-10">
          <Link href="/" className="inline-flex items-center" data-testid="login-logo">
            <NetTapuLogo variant="light" width={140} height={34} />
          </Link>
          <Link href="/" className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-brand-700 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Ana sayfaya dön
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md mx-auto my-auto"
        >
          <span className="overline">Giriş</span>
          <h1 className="mt-3 font-heading text-3xl sm:text-4xl font-extrabold text-ink-900 tracking-tight leading-tight">
            Hoş Geldiniz
          </h1>
          <p className="mt-2 text-slate-600">Hesabınıza giriş yapın ve yatırımlarınızı yönetmeye devam edin.</p>

          {/* Social */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleGoogleLogin}
              type="button"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-slate-200 rounded-md text-ink-800 text-sm font-bold hover:bg-slate-50 hover:border-slate-300 transition-all"
              data-testid="google-login-btn"
            >
              <GoogleIcon />
              <span>Google</span>
            </button>
            <button
              onClick={handleAppleLogin}
              type="button"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-ink-900 border-2 border-ink-900 rounded-md text-white text-sm font-bold hover:bg-ink-800 hover:border-ink-800 transition-all"
              data-testid="apple-login-btn"
            >
              <AppleIcon />
              <span>Apple</span>
            </button>
          </div>

          <div className="divider-label my-8">veya e-posta ile</div>

          {serverError && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 flex items-start gap-3 rounded-md border border-red-200 bg-red-50 p-3.5"
              data-testid="login-error"
            >
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 font-medium">{serverError}</p>
            </motion.div>
          )}

          {isLimited && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 flex items-start gap-3 rounded-md border border-amber-200 bg-amber-50 p-3.5"
            >
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800 font-medium">
                Çok fazla deneme yaptınız. Lütfen {cooldown} saniye bekleyin.
              </p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" data-testid="login-form">
            <div>
              <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-2">
                E-posta Adresi
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  {...register('email')}
                  id="email"
                  type="email"
                  placeholder="ornek@email.com"
                  className="w-full pl-11 pr-4 py-3.5 bg-white border-2 border-slate-200 rounded-md text-ink-900 text-[15px] placeholder:text-slate-400 focus:outline-none focus:border-brand-600 focus:shadow-brand transition-all"
                  data-testid="email-input"
                />
              </div>
              {errors.email && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1 font-medium">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-ink-700">
                  Şifre
                </label>
                <Link href="/forgot-password" className="text-xs font-bold text-brand-700 hover:text-brand-800 transition-colors uppercase tracking-wider">
                  Şifremi Unuttum
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  {...register('password')}
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-11 py-3.5 bg-white border-2 border-slate-200 rounded-md text-ink-900 text-[15px] placeholder:text-slate-400 focus:outline-none focus:border-brand-600 focus:shadow-brand transition-all"
                  data-testid="password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-700 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1 font-medium">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {errors.password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || isLimited}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm uppercase tracking-wider rounded-md shadow-brand hover:shadow-brand-lg focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              data-testid="login-submit-btn"
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Giriş Yapılıyor...</span>
                </>
              ) : (
                <>
                  <span>Giriş Yap</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-600">
            Hesabınız yok mu?{' '}
            <Link href="/register" className="font-bold text-brand-700 hover:text-brand-800 transition-colors">
              Hemen Kaydolun →
            </Link>
          </p>
        </motion.div>
      </div>

      {/* ═══ Right side — olive professional panel ═══ */}
      <div className="hidden lg:flex flex-1 items-center justify-center relative overflow-hidden bg-gradient-olive">
        <div className="absolute inset-0 opacity-[0.08]" style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.9) 1.2px, transparent 1.2px)',
          backgroundSize: '24px 24px',
        }} />
        <div className="absolute -top-40 -right-40 w-[460px] h-[460px] rounded-full bg-brand-400/25 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[460px] h-[460px] rounded-full bg-brand-900/40 blur-3xl" />

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative z-10 max-w-md px-10"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm mb-8">
            <CheckCircle2 className="h-3.5 w-3.5 text-gold-300" />
            <span className="text-[11px] font-bold text-white uppercase tracking-widest">Türkiye'nin Güvenilir Platformu</span>
          </div>

          <h2 className="font-heading text-4xl lg:text-5xl font-extrabold text-white mb-5 leading-[1.05] tracking-[-0.03em]">
            Doğrulanmış arsalar,
            <br />
            <span className="text-gold-300">güvenli yatırım.</span>
          </h2>
          <p className="text-[15px] text-brand-100/95 mb-10 leading-relaxed">
            Binlerce tapu kaydıyla doğrulanmış arsa ilanı, canlı açık artırmalar ve 3D Secure güvenli ödeme ile
            Türkiye'nin lider dijital gayrimenkul platformu.
          </p>

          <div className="space-y-3">
            {[
              { icon: Shield,       title: 'Tapu Güvencesi',       desc: 'Her ilan tapu kaydıyla doğrulanmıştır' },
              { icon: Zap,          title: 'Canlı Açık Artırma',   desc: 'Gerçek zamanlı şeffaf teklif sistemi' },
              { icon: CheckCircle2, title: 'KVKK & SSL Uyumlu',    desc: '256-bit uçtan uca şifreleme' },
            ].map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.08 }}
                  className="flex items-start gap-3 p-3.5 rounded-md bg-white/10 backdrop-blur-sm border border-white/10"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white/15 border border-white/10">
                    <Icon className="h-4 w-4 text-gold-300" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{feature.title}</h3>
                    <p className="text-xs text-brand-100/80 mt-0.5">{feature.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
