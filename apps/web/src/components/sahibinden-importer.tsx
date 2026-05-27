'use client';

import { useState } from 'react';
import apiClient from '@/lib/api-client';
import { Download } from 'lucide-react';

export interface ScrapedListing {
  title: string | null;
  description: string | null;
  price: number | null;
  city: string | null;
  district: string | null;
  neighborhood: string | null;
  ada: string | null;
  parsel: string | null;
  paftaNo: string | null;
  areaM2: number | null;
  zoningStatus: string | null;
  deedType: string | null;
  kaksEmsal: string | null;
  gabari: string | null;
  creditEligible: boolean | null;
  tradeAccepted: boolean | null;
  imageUrls: string[];
}

/**
 * "Sahibinden.com'dan İçe Aktar" — admin pastes a sahibinden listing URL,
 * presses 'Veri Al' and the form below is auto-filled. Listing is NOT
 * published automatically; admin reviews then clicks Kaydet.
 */
export function SahibindenImporter({ onImport }: { onImport: (data: ScrapedListing) => void }) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleImport() {
    setError(null);
    setSuccess(null);
    if (!/^https?:\/\/(www\.)?sahibinden\.com\//i.test(url.trim())) {
      setError('Lütfen geçerli bir sahibinden.com bağlantısı girin.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await apiClient.post<ScrapedListing>('/admin/sahibinden-import', { url: url.trim() });
      onImport(data);
      const filled: string[] = [];
      if (data.title) filled.push('başlık');
      if (data.price != null) filled.push('fiyat');
      if (data.areaM2 != null) filled.push('m²');
      if (data.ada) filled.push('ada');
      if (data.parsel) filled.push('parsel');
      if (data.imageUrls?.length) filled.push(`${data.imageUrls.length} görsel link`);
      setSuccess(`Veri alındı: ${filled.join(', ') || 'kısmi'}. Form dolduruldu, kontrol edip kaydedin.`);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'İlan alınamadı. Sahibinden engellemiş olabilir.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/60 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Download className="h-4 w-4 text-amber-700" />
        <h3 className="text-sm font-bold text-amber-900">Sahibinden.com'dan İçe Aktar</h3>
      </div>
      <p className="text-xs text-amber-800/80 mb-3">
        Sahibinden.com ilan linkini yapıştırın, <b>Veri Al</b>'a basın. Form aşağıda otomatik dolacak;
        kontrol edip <b>Kaydet</b>'e basana kadar yayınlanmaz.
      </p>
      <div className="flex gap-2">
        <input
          type="url"
          placeholder="https://www.sahibinden.com/ilan/..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1 rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          disabled={loading}
        />
        <button
          type="button"
          onClick={handleImport}
          disabled={loading || !url.trim()}
          className="rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2 text-sm font-bold text-white whitespace-nowrap transition-colors"
        >
          {loading ? 'Alınıyor…' : 'Veri Al'}
        </button>
      </div>
      {error && <p className="mt-2 text-xs font-medium text-red-700">{error}</p>}
      {success && <p className="mt-2 text-xs font-medium text-emerald-700">{success}</p>}
    </div>
  );
}
