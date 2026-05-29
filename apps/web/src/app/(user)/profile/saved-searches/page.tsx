'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api-client';
import { Search, Trash2, ArrowRight, History, Bell, BellOff } from 'lucide-react';

type SavedSearch = {
  id: string;
  name: string | null;
  filters: Record<string, unknown>;
  notifyOnMatch: boolean;
  createdAt: string;
};

function buildQueryString(filters: Record<string, unknown>): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) {
    if (v === undefined || v === null || v === '') continue;
    params.set(k, String(v));
  }
  return params.toString();
}

function describeFilters(filters: Record<string, unknown>): string {
  const parts: string[] = [];
  if (filters.search) parts.push(`"${filters.search}"`);
  if (filters.city) parts.push(String(filters.city));
  if (filters.district) parts.push(String(filters.district));
  if (filters.landType) parts.push(`Tür: ${filters.landType}`);
  if (filters.minPrice || filters.maxPrice) {
    parts.push(`Fiyat: ${filters.minPrice || '0'}–${filters.maxPrice || '∞'}`);
  }
  if (filters.minArea || filters.maxArea) {
    parts.push(`Alan: ${filters.minArea || '0'}–${filters.maxArea || '∞'} m²`);
  }
  return parts.join(' · ') || 'Tüm ilanlar';
}

export default function SavedSearchesPage() {
  const router = useRouter();
  const [items, setItems] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const { data } = await apiClient.get<SavedSearch[]>('/saved-searches');
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function remove(id: string) {
    if (!confirm('Bu aramayı silmek istediğine emin misin?')) return;
    await apiClient.delete(`/saved-searches/${id}`);
    load();
  }

  async function toggleNotify(s: SavedSearch) {
    await apiClient.patch(`/saved-searches/${s.id}`, { notifyOnMatch: !s.notifyOnMatch });
    load();
  }

  function goToSearch(s: SavedSearch) {
    router.push(`/parcels?${buildQueryString(s.filters)}`);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Kayıtlı Aramalarım</h1>
        <span className="text-sm text-[var(--muted-foreground)]">{items.length} arama</span>
      </div>

      {loading ? (
        <div className="rounded-xl border border-[var(--border)] p-8 text-center text-sm text-slate-400">
          Yükleniyor…
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] p-12 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
            <History className="h-7 w-7 text-slate-400" />
          </div>
          <h3 className="text-sm font-semibold text-[var(--foreground)]">Kayıtlı arama yok</h3>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Arsalar sayfasında filtre uyguladıktan sonra &quot;Aramayı Kaydet&quot; butonuna basın — uygun yeni ilanlarda size bildirim göndereceğiz.
          </p>
          <button
            onClick={() => router.push('/parcels')}
            className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
          >
            Arsalara Git
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((s) => (
            <div
              key={s.id}
              className="flex items-center gap-4 rounded-xl border border-[var(--border)] bg-white px-5 py-4 hover:shadow-sm transition-shadow group"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 shrink-0">
                <Search className="h-4 w-4 text-slate-500" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-slate-800 truncate">
                  {s.name || describeFilters(s.filters)}
                </p>
                {s.name && (
                  <p className="text-xs text-slate-400 mt-0.5 truncate">{describeFilters(s.filters)}</p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => toggleNotify(s)}
                  className={`rounded-lg border p-1.5 transition-colors ${s.notifyOnMatch ? 'border-emerald-200 text-emerald-600 bg-emerald-50' : 'border-slate-200 text-slate-400 hover:bg-slate-50'}`}
                  title={s.notifyOnMatch ? 'Bildirimler açık' : 'Bildirimler kapalı'}
                >
                  {s.notifyOnMatch ? <Bell className="h-3.5 w-3.5" /> : <BellOff className="h-3.5 w-3.5" />}
                </button>
                <button
                  onClick={() => goToSearch(s)}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
                >
                  Ara
                  <ArrowRight className="h-3 w-3" />
                </button>
                <button
                  onClick={() => remove(s.id)}
                  className="rounded-lg border border-red-200 p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                  title="Sil"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="mt-6 text-xs text-slate-400 text-center">
        Bildirim açık aramalar için uygun yeni ilanlar geldiğinde size mail ve push bildirim göndeririz.
      </p>
    </div>
  );
}
