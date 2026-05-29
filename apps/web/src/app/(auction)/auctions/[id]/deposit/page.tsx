'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import apiClient from '@/lib/api-client';
import { formatPrice } from '@/lib/format';
import { Alert, Button, LoadingState } from '@/components/ui';
import { useAuthStore } from '@/stores/auth-store';
import type { Auction, Payment, ApiError } from '@/types';
import { AxiosError } from 'axios';
import {
  CreditCard,
  Building2,
  ShieldCheck,
  Lock,
  Copy,
  Check,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';

type PaymentMethodType = 'credit_card' | 'bank_transfer';

interface BankInfo {
  bankName: string;
  iban: string;
  accountHolder: string;
  swiftCode?: string;
  branch?: string;
}

function CopyableField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
        <p className="mt-0.5 truncate font-mono text-sm text-slate-900">{value}</p>
      </div>
      <button
        type="button"
        onClick={copy}
        className={`shrink-0 rounded-md p-1.5 transition-colors ${copied ? 'bg-emerald-50 text-emerald-600' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
        title="Kopyala"
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </button>
    </div>
  );
}

export default function DepositPage() {
  const params = useParams<{ id: string }>();
  const auctionId = params.id;
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authLoading = useAuthStore((s) => s.isLoading);
  const authReady = !authLoading;

  const [auction, setAuction] = useState<Auction | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [threeDsUrl, setThreeDsUrl] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('credit_card');
  const [bankInfo, setBankInfo] = useState<BankInfo>({
    bankName: '',
    iban: '',
    accountHolder: '',
  });

  // Auth gate: depositing money is the moment we require an account.
  // Watching the auction is free, but committing funds isn't.
  useEffect(() => {
    if (authReady && !isAuthenticated) {
      const returnTo = `/auctions/${auctionId}/deposit`;
      router.replace(`/login?returnTo=${encodeURIComponent(returnTo)}`);
    }
  }, [authReady, isAuthenticated, auctionId, router]);

  useEffect(() => {
    if (!authReady || !isAuthenticated) return;
    let cancelled = false;
    async function fetchData() {
      try {
        const [auctionRes, settingsRes] = await Promise.all([
          apiClient.get<Auction>(`/auctions/${auctionId}`),
          apiClient.get('/content/site-settings').catch(() => ({ data: {} })),
        ]);
        if (!cancelled) {
          setAuction(auctionRes.data);
          const s = settingsRes.data as Record<string, string>;
          setBankInfo({
            bankName: s.bank_name || 'Banka bilgisi girilmemiş',
            iban: s.bank_iban || '-',
            accountHolder: s.bank_account_holder || '-',
            swiftCode: s.bank_swift_code,
            branch: s.bank_branch,
          });
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setError('İhale bilgileri alınamadı. Sayfayı yenileyip tekrar deneyin.');
          setLoading(false);
        }
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, [auctionId, authReady, isAuthenticated]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!auction) return;
    setError(null);
    setSubmitting(true);
    try {
      const idempotencyKey = crypto.randomUUID();
      const { data } = await apiClient.post<Payment>('/payments', {
        parcelId: auction.parcelId,
        auctionId,
        amount: auction.requiredDeposit,
        currency: auction.currency || 'TRY',
        paymentMethod,
        idempotencyKey,
        description: `Depozito: ${auction.title}`,
      });
      if (data.status === 'awaiting_3ds' && data.threeDsRedirectUrl) {
        setThreeDsUrl(data.threeDsRedirectUrl);
      } else {
        setSuccess(true);
        setTimeout(() => router.push(`/auctions/${auctionId}?depositSuccess=1`), 2000);
      }
    } catch (err) {
      if (err instanceof AxiosError) {
        const apiErr = err.response?.data as ApiError | undefined;
        const msg = apiErr?.message;
        setError(Array.isArray(msg) ? msg.join(', ') : msg || 'Ödeme başlatılamadı. Lütfen kart bilgilerinizi kontrol edin.');
      } else {
        setError('Ödeme başlatılamadı. Lütfen tekrar deneyin.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (!authReady || (authReady && !isAuthenticated)) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <LoadingState centered={false} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <LoadingState centered={false} />
      </div>
    );
  }

  if (threeDsUrl) {
    return (
      <div className="mx-auto max-w-lg space-y-4">
        <h1 className="text-xl font-bold">3D Secure Doğrulama</h1>
        <p className="text-sm text-slate-500">
          Ödemenizi tamamlamak için bankanızın 3D Secure sayfasına yönlendiriliyorsunuz.
        </p>
        <iframe
          src={threeDsUrl}
          className="h-[500px] w-full rounded-lg border border-slate-200"
          title="3D Secure"
        />
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex min-h-[400px] items-center justify-center px-4">
        <div className="max-w-md w-full rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600">
            <Check className="h-8 w-8 text-white" />
          </div>
          <p className="text-lg font-bold text-emerald-900">Depozito Yatırıldı</p>
          <p className="mt-2 text-sm text-emerald-700">
            Açık artırma sayfasına yönlendiriliyorsunuz…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 lg:py-10">
      {/* Header / breadcrumb */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <button onClick={() => router.push(`/auctions/${auctionId}`)} className="hover:text-slate-700 transition-colors">
            İhale
          </button>
          <ArrowRight className="h-3 w-3" />
          <span className="text-slate-700 font-medium">Depozito Yatır</span>
        </div>
        <h1 className="mt-2 text-2xl lg:text-3xl font-bold text-slate-900">Depozito Yatır</h1>
        <p className="mt-1 text-sm text-slate-500">
          Açık artırmaya teklif verebilmek için depozito tutarını yatırın. Kazanamazsanız tutar
          işlem sonrası iade edilir.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* LEFT: Order Summary */}
        <aside className="lg:col-span-2 space-y-4">
          {auction && (
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 px-5 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-100">
                  İhale Özeti
                </p>
                <p className="mt-1 text-base font-bold text-white line-clamp-2">
                  {auction.title}
                </p>
              </div>
              <div className="divide-y divide-slate-100">
                <div className="flex items-center justify-between px-5 py-3">
                  <span className="text-sm text-slate-600">Başlangıç Fiyatı</span>
                  <span className="font-mono text-sm text-slate-700">
                    {formatPrice(auction.startingPrice)}
                  </span>
                </div>
                <div className="flex items-center justify-between px-5 py-4 bg-amber-50/50">
                  <span className="text-sm font-semibold text-amber-900">Gerekli Depozito</span>
                  <span className="font-mono text-lg font-bold text-amber-700">
                    {formatPrice(auction.requiredDeposit)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Trust signals */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-slate-800">3D Secure Korumalı</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Kredi kartı ödemeleri bankanız üzerinden onaylanır.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Lock className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-slate-800">SSL Şifreli Bağlantı</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Tüm finansal veriler uçtan uca şifrelenir.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-slate-800">İade Garantisi</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  İhaleyi kazanamazsanız depozito iade edilir.
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* RIGHT: Payment form */}
        <section className="lg:col-span-3 space-y-5">
          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-red-900">İşlem tamamlanamadı</p>
                <p className="text-xs text-red-700 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Payment Method Picker */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-900 mb-4">Ödeme Yöntemi</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('credit_card')}
                  className={`relative flex flex-col items-start gap-2 rounded-xl border-2 p-4 text-left transition-all ${
                    paymentMethod === 'credit_card'
                      ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-100'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${paymentMethod === 'credit_card' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    <CreditCard className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Kredi Kartı</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Anında onay, 3D Secure</p>
                  </div>
                  {paymentMethod === 'credit_card' && (
                    <div className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('bank_transfer')}
                  className={`relative flex flex-col items-start gap-2 rounded-xl border-2 p-4 text-left transition-all ${
                    paymentMethod === 'bank_transfer'
                      ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-100'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${paymentMethod === 'bank_transfer' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Havale / EFT</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Banka transferi, manuel</p>
                  </div>
                  {paymentMethod === 'bank_transfer' && (
                    <div className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  )}
                </button>
              </div>
            </div>

            {/* Method-specific section */}
            {paymentMethod === 'credit_card' ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold text-slate-900">Kredi Kartı ile Öde</p>
                <p className="text-xs text-slate-500 mt-1">
                  Ödeme bankanızın güvenli 3D Secure sayfasında tamamlanacaktır.
                  Depozito tutarı bloke edilir; ihaleyi kazanamazsanız iade edilir.
                </p>
                <div className="mt-4 flex items-center gap-2 text-[11px] text-slate-500">
                  <Lock className="h-3 w-3" />
                  <span>Banka bilgileriniz sunucularımızda saklanmaz</span>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold text-slate-900 mb-3">Havale / EFT Bilgileri</p>
                <div className="space-y-2">
                  <CopyableField label="Banka" value={bankInfo.bankName} />
                  <CopyableField label="IBAN" value={bankInfo.iban} />
                  <CopyableField label="Hesap Sahibi" value={bankInfo.accountHolder} />
                  {bankInfo.branch && <CopyableField label="Şube" value={bankInfo.branch} />}
                  {bankInfo.swiftCode && <CopyableField label="SWIFT" value={bankInfo.swiftCode} />}
                  <CopyableField
                    label="Açıklama"
                    value={`${auction?.title || 'Depozito'} - İhale No: ${auctionId.slice(0, 8).toUpperCase()}`}
                  />
                </div>
                <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <p className="text-xs text-amber-900">
                    <strong>Önemli:</strong> Havale yaptıktan sonra dekontunuzu WhatsApp veya e-posta
                    ile iletmeniz gerekir. Ödemeniz manuel onay sonrası ihaleye katılım hakkı kazandırır.
                  </p>
                </div>
              </div>
            )}

            {/* CTA */}
            <Button type="submit" disabled={submitting} className="w-full py-3.5 text-base font-bold">
              {submitting
                ? 'İşleniyor...'
                : paymentMethod === 'credit_card'
                  ? `${formatPrice(auction?.requiredDeposit ?? null)} Depozito Yatır`
                  : 'Havale Bildirimini Gönder'}
            </Button>
            <p className="text-center text-[11px] text-slate-400">
              &quot;Depozito Yatır&quot; diyerek <span className="underline cursor-pointer hover:text-slate-600">İhale Şartlarını</span> kabul etmiş olursunuz.
            </p>
          </form>
        </section>
      </div>
    </div>
  );
}
