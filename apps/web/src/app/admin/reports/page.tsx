'use client';

import { useState } from 'react';
import apiClient from '@/lib/api-client';
import { showApiError } from '@/components/api-error-toast';
import { PageHeader, Button, Card } from '@/components/ui';
import { LocationAutocomplete } from '@/components/location-autocomplete';
import { FormattedPriceInput } from '@/components/formatted-price-input';
import { formatPrice } from '@/lib/format';
import { FileDown, Search, Loader2 } from 'lucide-react';

type ReportFilters = {
  startDate: string;
  endDate: string;
  city: string;
  district: string;
  neighborhood: string;
  parcelType: string;
  zoningStatus: string;
  status: string;
  minPrice: string;
  maxPrice: string;
  minArea: string;
  maxArea: string;
};

type ReportRow = {
  id: string;
  listingId: string;
  title: string;
  city: string;
  district: string;
  neighborhood: string | null;
  ada: string | null;
  parsel: string | null;
  areaM2: string | null;
  price: string | null;
  currency: string;
  pricePerM2: string | null;
  zoningStatus: string | null;
  landType: string | null;
  status: string;
  updatedAt: string;
};

type ReportResult = {
  summary: {
    count: number;
    totalValue: number;
    totalArea: number;
    avgPricePerM2: number;
    currency: string;
  };
  data: ReportRow[];
};

const STATUS_LABELS: Record<string, string> = {
  sold: 'Satılan',
  active: 'Yayında',
  draft: 'Taslak',
  deposit_taken: 'Depozito Alındı',
  withdrawn: 'Geri Çekilen',
};

export default function AdminReportsPage() {
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: '',
    endDate: '',
    city: '',
    district: '',
    neighborhood: '',
    parcelType: '',
    zoningStatus: '',
    status: 'sold',
    minPrice: '',
    maxPrice: '',
    minArea: '',
    maxArea: '',
  });
  const [result, setResult] = useState<ReportResult | null>(null);
  const [loading, setLoading] = useState(false);

  function buildParams(): Record<string, string> {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(filters)) {
      if (v && String(v).trim()) out[k] = String(v);
    }
    return out;
  }

  async function runReport() {
    setLoading(true);
    try {
      const { data } = await apiClient.get<ReportResult>('/admin/reports/sales', {
        params: buildParams(),
      });
      setResult(data);
    } catch (err) {
      showApiError(err);
    } finally {
      setLoading(false);
    }
  }

  async function download(format: 'csv' | 'xlsx') {
    try {
      const { data: blob } = await apiClient.get('/admin/reports/sales', {
        params: { ...buildParams(), format },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(blob as Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `satis-raporu-${new Date().toISOString().slice(0, 10)}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      showApiError(err);
    }
  }

  function setField<K extends keyof ReportFilters>(key: K, value: ReportFilters[K]) {
    setFilters((f) => ({ ...f, [key]: value }));
  }

  function reset() {
    setFilters({
      startDate: '',
      endDate: '',
      city: '',
      district: '',
      neighborhood: '',
      parcelType: '',
      zoningStatus: '',
      status: 'sold',
      minPrice: '',
      maxPrice: '',
      minArea: '',
      maxArea: '',
    });
    setResult(null);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Satış Raporları" subtitle="Tarih, konum, fiyat ve diğer kriterlere göre satış raporu üretin." />

      <Card className="p-5 space-y-5">
        {/* Date range */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1.5">Başlangıç Tarihi</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setField('startDate', e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1.5">Bitiş Tarihi</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setField('endDate', e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1.5">Durum</label>
            <select
              value={filters.status}
              onChange={(e) => setField('status', e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm"
            >
              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Location */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <LocationAutocomplete
            label="Şehir"
            type="city"
            value={filters.city}
            onChange={(v) => {
              setField('city', v);
              setField('district', '');
              setField('neighborhood', '');
            }}
          />
          <LocationAutocomplete
            label="İlçe"
            type="district"
            city={filters.city}
            value={filters.district}
            onChange={(v) => {
              setField('district', v);
              setField('neighborhood', '');
            }}
          />
          <LocationAutocomplete
            label="Mahalle / Köy"
            type="neighborhood"
            city={filters.city}
            district={filters.district}
            value={filters.neighborhood}
            onChange={(v) => setField('neighborhood', v)}
          />
        </div>

        {/* Type / Zoning */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1.5">Arazi Türü</label>
            <select
              value={filters.parcelType}
              onChange={(e) => setField('parcelType', e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm"
            >
              <option value="">Tümü</option>
              <option value="arsa">Arsa</option>
              <option value="tarla">Tarla</option>
              <option value="bağ">Bağ</option>
              <option value="bahçe">Bahçe</option>
              <option value="zeytinlik">Zeytinlik</option>
              <option value="orman">Orman</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1.5">İmar Durumu</label>
            <select
              value={filters.zoningStatus}
              onChange={(e) => setField('zoningStatus', e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm"
            >
              <option value="">Tümü</option>
              <option value="İmarlı">İmarlı</option>
              <option value="İmarsız">İmarsız</option>
              <option value="Konut İmarlı">Konut İmarlı</option>
              <option value="Ticari İmarlı">Ticari İmarlı</option>
              <option value="Tarla">Tarla</option>
            </select>
          </div>
        </div>

        {/* Price + Area ranges */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <FormattedPriceInput
            label="Min Fiyat"
            value={filters.minPrice}
            onChange={(v) => setField('minPrice', v)}
            placeholder="örn 100.000"
          />
          <FormattedPriceInput
            label="Max Fiyat"
            value={filters.maxPrice}
            onChange={(v) => setField('maxPrice', v)}
            placeholder="örn 2.000.000"
          />
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1.5">Min m²</label>
            <input
              type="number"
              value={filters.minArea}
              onChange={(e) => setField('minArea', e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm"
              placeholder="örn 300"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1.5">Max m²</label>
            <input
              type="number"
              value={filters.maxArea}
              onChange={(e) => setField('maxArea', e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm"
              placeholder="örn 10000"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200">
          <Button onClick={runReport} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Rapor Üret
          </Button>
          <Button variant="secondary" onClick={() => download('xlsx')} disabled={!result || loading}>
            <FileDown className="h-4 w-4" /> Excel (.xlsx)
          </Button>
          <Button variant="secondary" onClick={() => download('csv')} disabled={!result || loading}>
            <FileDown className="h-4 w-4" /> CSV
          </Button>
          <Button variant="ghost" onClick={reset}>Sıfırla</Button>
        </div>
      </Card>

      {/* Summary + Table */}
      {result && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <SummaryCard label="Toplam Kayıt" value={result.summary.count.toLocaleString('tr-TR')} />
            <SummaryCard
              label="Toplam Tutar"
              value={`${result.summary.totalValue.toLocaleString('tr-TR')} ${result.summary.currency}`}
            />
            <SummaryCard
              label="Toplam Alan"
              value={`${Math.round(result.summary.totalArea).toLocaleString('tr-TR')} m²`}
            />
            <SummaryCard
              label="Ort. m² Fiyatı"
              value={`${Math.round(result.summary.avgPricePerM2).toLocaleString('tr-TR')} ${result.summary.currency}/m²`}
            />
          </div>

          <Card className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-600">
                  <tr>
                    <th className="px-3 py-2 text-left">İlan No</th>
                    <th className="px-3 py-2 text-left">Başlık</th>
                    <th className="px-3 py-2 text-left">Konum</th>
                    <th className="px-3 py-2 text-left">Ada/Parsel</th>
                    <th className="px-3 py-2 text-right">Alan</th>
                    <th className="px-3 py-2 text-right">Fiyat</th>
                    <th className="px-3 py-2 text-left">İmar</th>
                    <th className="px-3 py-2 text-left">Tarih</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {result.data.length === 0 && (
                    <tr><td colSpan={8} className="px-3 py-8 text-center text-slate-500">Filtrelere uyan kayıt yok</td></tr>
                  )}
                  {result.data.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2 font-mono text-xs">#{p.listingId}</td>
                      <td className="px-3 py-2 max-w-[260px] truncate" title={p.title}>{p.title}</td>
                      <td className="px-3 py-2">{[p.city, p.district, p.neighborhood].filter(Boolean).join(' / ')}</td>
                      <td className="px-3 py-2 font-mono text-xs">{p.ada || '-'}/{p.parsel || '-'}</td>
                      <td className="px-3 py-2 text-right font-mono">{p.areaM2 ? `${Number(p.areaM2).toLocaleString('tr-TR')} m²` : '-'}</td>
                      <td className="px-3 py-2 text-right font-mono font-semibold">{p.price ? formatPrice(p.price) : '-'}</td>
                      <td className="px-3 py-2 text-xs">{p.zoningStatus || '-'}</td>
                      <td className="px-3 py-2 text-xs text-slate-500">{new Date(p.updatedAt).toLocaleDateString('tr-TR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1.5 text-xl font-extrabold text-ink-900">{value}</p>
    </Card>
  );
}
