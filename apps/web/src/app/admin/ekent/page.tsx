'use client';

import { useEffect, useState } from 'react';
import apiClient from '@/lib/api-client';
import { Plus, Trash2, Search, Save, X } from 'lucide-react';

type Provider = {
  id: string;
  city: string;
  district: string;
  name: string;
  url: string;
  active: boolean;
};

type LookupResult = { url: string | null; cached?: boolean; error?: string };

export default function EkentAdminPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({ city: '', district: '', name: '', url: '' });

  // Probe panel
  const [probe, setProbe] = useState({ city: '', district: '', ada: '', parsel: '' });
  const [probeResult, setProbeResult] = useState<LookupResult | null>(null);
  const [probing, setProbing] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const { data } = await apiClient.get<Provider[]>('/admin/ekent/providers');
      setProviders(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function createProvider() {
    if (!draft.city || !draft.district || !draft.name || !draft.url) return;
    await apiClient.post('/admin/ekent/providers', draft);
    setDraft({ city: '', district: '', name: '', url: '' });
    setCreating(false);
    load();
  }

  async function toggleActive(p: Provider) {
    await apiClient.patch(`/admin/ekent/providers/${p.id}`, { active: !p.active });
    load();
  }

  async function deleteProvider(id: string) {
    if (!confirm('Bu sağlayıcıyı silmek istediğine emin misin?')) return;
    await apiClient.delete(`/admin/ekent/providers/${id}`);
    load();
  }

  async function runProbe() {
    setProbing(true);
    setProbeResult(null);
    try {
      const { data } = await apiClient.post<LookupResult>('/admin/ekent/probe', probe);
      setProbeResult(data);
    } catch (err: any) {
      setProbeResult({ url: null, error: err?.response?.data?.message || 'Hata' });
    } finally {
      setProbing(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">E-Kent (Kent Rehberi) Yönetimi</h1>
          <p className="text-sm text-slate-600 mt-1">İl/ilçe bazında imar bilgileri için E-Kent yönlendirme bağlantılarını yönetin.</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-brand-600 text-white text-sm font-bold hover:bg-brand-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Yeni Sağlayıcı
        </button>
      </div>

      {/* Probe panel */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold text-ink-900 uppercase tracking-wide mb-3 flex items-center gap-2">
          <Search className="h-4 w-4" />
          Parsel Sorgu (test / önbellek temizleme)
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {(['city', 'district', 'ada', 'parsel'] as const).map((k) => (
            <input
              key={k}
              placeholder={k === 'city' ? 'İl' : k === 'district' ? 'İlçe' : k}
              value={probe[k]}
              onChange={(e) => setProbe((p) => ({ ...p, [k]: e.target.value }))}
              className="px-3 py-2 rounded-md border border-slate-200 text-sm"
            />
          ))}
          <button
            onClick={runProbe}
            disabled={probing || !probe.city || !probe.district}
            className="px-4 py-2 rounded-md bg-ink-900 text-white text-sm font-bold disabled:opacity-50"
          >
            {probing ? 'Sorgulanıyor…' : 'Sorgula'}
          </button>
        </div>
        {probeResult && (
          <div className={`mt-3 p-3 rounded-md text-sm ${probeResult.error ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
            {probeResult.error ? `Hata: ${probeResult.error}` : (
              <>
                <div className="font-semibold">Bağlantı bulundu:</div>
                <a href={probeResult.url || '#'} target="_blank" rel="noreferrer" className="text-brand-700 underline break-all">
                  {probeResult.url}
                </a>
              </>
            )}
          </div>
        )}
      </div>

      {/* Create form */}
      {creating && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold uppercase tracking-wide">Yeni E-Kent Sağlayıcı</h3>
            <button onClick={() => setCreating(false)} className="text-slate-400 hover:text-slate-600">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <input placeholder="İl (ör. İstanbul)" value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value })} className="px-3 py-2 rounded-md border border-slate-200 text-sm" />
            <input placeholder="İlçe" value={draft.district} onChange={(e) => setDraft({ ...draft, district: e.target.value })} className="px-3 py-2 rounded-md border border-slate-200 text-sm" />
            <input placeholder="Belediye Adı" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="px-3 py-2 rounded-md border border-slate-200 text-sm" />
            <input placeholder="https://..." value={draft.url} onChange={(e) => setDraft({ ...draft, url: e.target.value })} className="px-3 py-2 rounded-md border border-slate-200 text-sm" />
          </div>
          <button onClick={createProvider} className="mt-3 flex items-center gap-2 px-4 py-2 rounded-md bg-brand-600 text-white text-sm font-bold hover:bg-brand-700">
            <Save className="h-4 w-4" />
            Kaydet
          </button>
        </div>
      )}

      {/* Providers table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-600">
            <tr>
              <th className="text-left px-4 py-3">İl</th>
              <th className="text-left px-4 py-3">İlçe</th>
              <th className="text-left px-4 py-3">Belediye</th>
              <th className="text-left px-4 py-3">URL</th>
              <th className="text-center px-4 py-3">Aktif</th>
              <th className="text-right px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Yükleniyor…</td></tr>
            )}
            {!loading && providers.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Henüz sağlayıcı yok.</td></tr>
            )}
            {providers.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium">{p.city}</td>
                <td className="px-4 py-3">{p.district}</td>
                <td className="px-4 py-3">{p.name}</td>
                <td className="px-4 py-3"><a href={p.url} target="_blank" rel="noreferrer" className="text-brand-700 hover:underline truncate inline-block max-w-xs">{p.url}</a></td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => toggleActive(p)}
                    className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${p.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}
                  >
                    {p.active ? 'Aktif' : 'Pasif'}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => deleteProvider(p.id)} className="text-slate-400 hover:text-red-600 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
