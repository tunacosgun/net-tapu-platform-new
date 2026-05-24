'use client';

import { useState } from 'react';
import { Bookmark, Check, X, AlertCircle, Bell } from 'lucide-react';
import { AxiosError } from 'axios';
import apiClient from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';

type Props = {
  /** Active filter values to persist (only non-empty keys are saved) */
  filters: Record<string, string | number | boolean | undefined>;
  /** Default name suggestion shown in modal */
  suggestedName?: string;
};

export function SaveSearchButton({ filters, suggestedName }: Props) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(suggestedName || '');
  const [notify, setNotify] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cleanFilters = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== undefined && v !== '' && v !== null),
  );

  const hasFilters = Object.keys(cleanFilters).length > 0;

  const handleSave = async () => {
    setError(null);
    setSaving(true);
    try {
      await apiClient.post('/saved-searches', {
        name: name.trim() || 'Kayıtlı Arama',
        filters: cleanFilters,
        notifyOnMatch: notify,
      });
      setSaved(true);
      setTimeout(() => {
        setOpen(false);
        setSaved(false);
      }, 1500);
    } catch (err) {
      if (err instanceof AxiosError) {
        setError(err.response?.data?.message || 'Kaydedilemedi.');
      } else {
        setError('Beklenmeyen bir hata oluştu.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleOpen = () => {
    if (!isAuthenticated) {
      window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname + window.location.search);
      return;
    }
    setName(suggestedName || buildSuggestedName(cleanFilters));
    setOpen(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        disabled={!hasFilters}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        data-testid="save-search-btn"
        title={hasFilters ? 'Bu aramayı kaydet' : 'Önce filtre seçin'}
      >
        <Bookmark className="h-4 w-4" />
        Aramayı Kaydet
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-extrabold text-ink-900">Aramayı Kaydet</h3>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {saved ? (
              <div className="py-6 flex flex-col items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Check className="h-6 w-6 text-emerald-600" />
                </div>
                <p className="text-sm font-semibold text-emerald-700">Arama kaydedildi</p>
              </div>
            ) : (
              <>
                {error && (
                  <div className="mb-3 rounded-md border border-rose-200 bg-rose-50 p-2.5 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-rose-800">{error}</p>
                  </div>
                )}

                <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1.5">
                  Arama Adı
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Örn: Antalya tarla 300m²+"
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-ink-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  data-testid="save-search-name"
                />

                <label className="mt-4 flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notify}
                    onChange={(e) => setNotify(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="flex items-center gap-1.5 text-sm text-slate-700">
                    <Bell className="h-3.5 w-3.5" />
                    Bu kriterlere uyan yeni ilan eklendiğinde bana bildir
                  </span>
                </label>

                <div className="mt-4 rounded-md bg-slate-50 border border-slate-200 p-3">
                  <p className="text-[11px] uppercase font-bold tracking-wider text-slate-500 mb-2">
                    Kaydedilen filtreler
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(cleanFilters).map(([k, v]) => (
                      <span
                        key={k}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[11px] font-medium text-slate-700"
                      >
                        <span className="text-slate-400">{labelFor(k)}:</span>
                        <span>{String(v)}</span>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-5 flex gap-2">
                  <button
                    onClick={() => setOpen(false)}
                    className="flex-1 px-4 py-2.5 rounded-lg text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200"
                  >
                    Vazgeç
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 px-4 py-2.5 rounded-lg text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {saving ? 'Kaydediliyor...' : 'Kaydet'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function labelFor(key: string): string {
  const map: Record<string, string> = {
    city: 'Şehir',
    district: 'İlçe',
    neighborhood: 'Mahalle',
    parcelType: 'Tür',
    minPrice: 'Min ₺',
    maxPrice: 'Max ₺',
    minArea: 'Min m²',
    maxArea: 'Max m²',
    zoningStatus: 'İmar',
    roadAccess: 'Yol',
    isFeatured: 'Öne Çıkan',
    search: 'Anahtar',
  };
  return map[key] || key;
}

function buildSuggestedName(filters: Record<string, unknown>): string {
  const parts: string[] = [];
  if (filters.city) parts.push(String(filters.city));
  if (filters.district) parts.push(String(filters.district));
  if (filters.parcelType) parts.push(String(filters.parcelType));
  if (filters.minArea) parts.push(`${filters.minArea}m²+`);
  return parts.join(' · ') || 'Kayıtlı Arama';
}
