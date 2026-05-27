'use client';

import { useState } from 'react';
import { Mail, Check, AlertCircle } from 'lucide-react';
import { AxiosError } from 'axios';
import apiClient from '@/lib/api-client';

/**
 * Newsletter / mail-listesi abonelik formu.
 * Persisted via /crm/contact-requests with a [MAİL ABONELİĞİ] marker so admins
 * can filter the contacts list and export.
 */
export function NewsletterSubscribe() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setError('Geçerli bir e-posta girin');
      return;
    }
    setStatus('submitting');
    try {
      await apiClient.post('/newsletter/subscribe', { email, source: 'footer' });
      setStatus('success');
      setEmail('');
      setTimeout(() => setStatus('idle'), 4000);
    } catch (err) {
      const msg =
        err instanceof AxiosError
          ? (Array.isArray(err.response?.data?.message)
              ? err.response?.data?.message[0]
              : err.response?.data?.message) || 'Abonelik başarısız.'
          : 'Beklenmeyen bir hata oluştu.';
      setError(msg);
      setStatus('error');
    }
  }

  return (
    <div className="w-full">
      <h3 className="text-xs font-heading font-bold text-white uppercase tracking-widest">
        Bültene Abone Olun
      </h3>
      <div className="h-0.5 w-8 bg-brand-500 mt-3" />
      <p className="mt-4 text-sm text-ink-400 leading-relaxed">
        Yeni ilanlar, fırsatlar ve canlı açık artırma duyurularını e-posta ile alın.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-2">
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-500" />
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(null); }}
            placeholder="ornek@email.com"
            className="w-full pl-9 pr-3 py-2.5 bg-ink-800 border border-ink-700 rounded-md text-sm text-white placeholder:text-ink-500 focus:outline-none focus:border-brand-500"
            data-testid="newsletter-email"
            required
          />
        </div>
        <button
          type="submit"
          disabled={status === 'submitting'}
          className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-md bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-bold transition-colors"
          data-testid="newsletter-submit"
        >
          {status === 'submitting' ? 'Kaydediliyor...' : 'Abone Ol'}
        </button>

        {status === 'success' && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-400">
            <Check className="h-3.5 w-3.5" />
            Aboneliğiniz alındı. Teşekkürler!
          </div>
        )}
        {error && (
          <div className="flex items-center gap-1.5 text-xs text-rose-400">
            <AlertCircle className="h-3.5 w-3.5" />
            {error}
          </div>
        )}
      </form>
    </div>
  );
}
