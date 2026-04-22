'use client';

import { Suspense, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { z } from 'zod';
import apiClient from '@/lib/api-client';
import { LoadingState } from '@/components/ui';
import { NetTapuLogo } from '@/components/ui/nettapu-logo';
import type { ApiError } from '@/types';
import { AxiosError } from 'axios';
import { Mail, Lock, User, ArrowRight, AlertCircle, Eye, EyeOff, CheckCircle2, Shield, Phone, ArrowLeft, TrendingUp, Gift } from 'lucide-react';

const registerSchema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi girin'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır'),
  confirmPassword: z.string(),
  firstName: z.string().min(2, 'Ad en az 2 karakter olmalıdır'),
  lastName: z.string().min(2, 'Soyad en az 2 karakter olmalıdır'),
  phone: z.string().optional(),
  acceptTerms: z.boolean().refine(val => val === true, 'Kullanım koşullarını kabul etmelisiniz'),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Şifreler eşleşmiyor',
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPagePro() {
  return (
    <Suspense fallback={<LoadingState />}>
      <RegisterContent />
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

function RegisterContent() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (data: RegisterFormData) => {
    setServerError(null);
    try {
      await apiClient.post('/auth/register', {
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
      });
      router.push('/login?registered=true');
    } catch (err) {
      if (err instanceof AxiosError) {
        const apiErr = err.response?.data as ApiError | undefined;
        const errorMsg = Array.isArray(apiErr?.message) ? apiErr.message[0] : apiErr?.message;
        setServerError(errorMsg || 'Kayıt başarısız. Lütfen bilgilerinizi kontrol edin.');
      } else {
        setServerError('Beklenmeyen bir hata oluştu.');
      }
    }
  };

  const handleGoogleRegister = () => { window.location.href = `/api/v1/auth/google`; };

  return (
    <div className="min-h-screen flex bg-white" data-testid="register-page">
      {/* ═══ Form column ═══ */}
      <div className="flex-1 flex flex-col px-6 py-8 lg:px-14 lg:py-10 overflow-y-auto">
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="inline-flex items-center" data-testid="register-logo">
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
          className="w-full max-w-md mx-auto"
        >
          <span className="overline">Kayıt Ol</span>
          <h1 className="mt-3 font-heading text-3xl sm:text-4xl font-extrabold text-ink-900 tracking-tight leading-tight">
            Hesap Oluştur
          </h1>
          <p className="mt-2 text-slate-600">NetTapu'ya katılın — arsa yatırımı yolculuğunuza başlayın.</p>

          <button
            onClick={handleGoogleRegister}
            type="button"
            className="mt-7 w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-slate-200 rounded-md text-ink-800 text-sm font-bold hover:bg-slate-50 hover:border-slate-300 transition-all"
            data-testid="google-register-btn"
          >
            <GoogleIcon />
            <span>Google ile Kayıt Ol</span>
          </button>

          <div className="divider-label my-6">veya e-posta ile</div>

          {serverError && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 flex items-start gap-3 rounded-md border border-red-200 bg-red-50 p-3.5"
              data-testid="register-error"
            >
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 font-medium">{serverError}</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" data-testid="register-form">
            {/* Name row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="firstName" className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-2">
                  Ad
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    {...register('firstName')}
                    id="firstName"
                    type="text"
                    placeholder="Adınız"
                    className="w-full pl-10 pr-4 py-3 bg-white border-2 border-slate-200 rounded-md text-ink-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-brand-600 focus:shadow-brand transition-all"
                    data-testid="firstName-input"
                  />
                </div>
                {errors.firstName && (
                  <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.firstName.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="lastName" className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-2">
                  Soyad
                </label>
                <input
                  {...register('lastName')}
                  id="lastName"
                  type="text"
                  placeholder="Soyadınız"
                  className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-md text-ink-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-brand-600 focus:shadow-brand transition-all"
                  data-testid="lastName-input"
                />
                {errors.lastName && (
                  <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            {/* Email */}
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
                  className="w-full pl-10 pr-4 py-3 bg-white border-2 border-slate-200 rounded-md text-ink-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-brand-600 focus:shadow-brand transition-all"
                  data-testid="email-input"
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.email.message}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-2">
                Telefon <span className="text-slate-400 normal-case tracking-normal">(İsteğe bağlı)</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  {...register('phone')}
                  id="phone"
                  type="tel"
                  placeholder="+90 5XX XXX XX XX"
                  className="w-full pl-10 pr-4 py-3 bg-white border-2 border-slate-200 rounded-md text-ink-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-brand-600 focus:shadow-brand transition-all"
                  data-testid="phone-input"
                />
              </div>
            </div>

            {/* Password row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-2">
                  Şifre
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    {...register('password')}
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-3 bg-white border-2 border-slate-200 rounded-md text-ink-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-brand-600 focus:shadow-brand transition-all"
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
                  <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.password.message}</p>
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
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-3 bg-white border-2 border-slate-200 rounded-md text-ink-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-brand-600 focus:shadow-brand transition-all"
                    data-testid="confirmPassword-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-700 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            {/* Terms */}
            <label className="flex items-start gap-2.5 p-3 rounded-md border border-slate-200 bg-slate-50 cursor-pointer hover:bg-white hover:border-brand-300 transition-all">
              <input
                {...register('acceptTerms')}
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded-sm border-slate-300 text-brand-600 focus:ring-brand-500 focus:ring-offset-0 accent-brand-600"
                data-testid="acceptTerms-checkbox"
              />
              <span className="text-xs text-slate-700 leading-relaxed">
                <Link href="/legal" className="font-bold text-brand-700 hover:underline">Kullanım Koşulları</Link>{' '}
                ve{' '}
                <Link href="/legal" className="font-bold text-brand-700 hover:underline">KVKK Aydınlatma Metni</Link>'ni
                okudum, kabul ediyorum.
              </span>
            </label>
            {errors.acceptTerms && (
              <p className="-mt-2 text-xs text-red-600 font-medium flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.acceptTerms.message}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm uppercase tracking-wider rounded-md shadow-brand hover:shadow-brand-lg focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              data-testid="register-submit-btn"
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Kayıt Yapılıyor...</span>
                </>
              ) : (
                <>
                  <span>Ücretsiz Hesap Oluştur</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Zaten bir hesabınız var mı?{' '}
            <Link href="/login" className="font-bold text-brand-700 hover:text-brand-800 transition-colors">
              Giriş Yapın →
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
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold-500/15 border border-gold-400/30 backdrop-blur-sm mb-8">
            <Gift className="h-3.5 w-3.5 text-gold-300" />
            <span className="text-[11px] font-bold text-gold-200 uppercase tracking-widest">Hoş Geldin Bonusu</span>
          </div>

          <h2 className="font-heading text-4xl lg:text-5xl font-extrabold text-white mb-5 leading-[1.05] tracking-[-0.03em]">
            Üye olun,
            <br />
            <span className="text-gold-300">fırsatları yakalayın.</span>
          </h2>
          <p className="text-[15px] text-brand-100/95 mb-10 leading-relaxed">
            Ücretsiz üyelikle canlı ihalelere katılın, favori arsalarınızı takip edin ve size özel fırsatlardan ilk siz haberdar olun.
          </p>

          <div className="space-y-3">
            {[
              { icon: Shield,       title: 'Ücretsiz & Güvenli',    desc: 'Üyelik tamamen ücretsiz — KVKK uyumlu' },
              { icon: TrendingUp,   title: 'Özel Fırsatlar',        desc: 'Yalnızca üyelere açık ihaleler ve indirimler' },
              { icon: CheckCircle2, title: 'Dakikalar İçinde Hazır', desc: 'Sadece 60 saniyede hesabınız aktif' },
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
