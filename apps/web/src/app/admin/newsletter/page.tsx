'use client';

import { useEffect, useState } from 'react';
import apiClient from '@/lib/api-client';
import { showApiError } from '@/components/api-error-toast';
import { PageHeader } from '@/components/ui';
import { Mail, Search, Download } from 'lucide-react';

interface Subscriber {
  id: string;
  email: string;
  name: string | null;
  source: string;
  is_active: boolean;
  subscribed_at: string;
}

export default function NewsletterAdminPage() {
  const [items, setItems] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const { data } = await apiClient.get<{ data: Subscriber[] }>('/newsletter/admin', { params: { q, limit: 500 } });
        if (!cancelled) setItems(data.data || []);
      } catch (err) {
        if (!cancelled) showApiError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);
    return () => { cancelled = true; clearTimeout(t); };
  }, [q]);

  function exportCsv() {
    const header = 'E-posta,İsim,Kaynak,Durum,Abone Tarihi\n';
    const rows = items.map((s) =>
      [s.email, s.name || '', s.source, s.is_active ? 'Aktif' : 'Pasif', new Date(s.subscribed_at).toLocaleDateString('tr-TR')]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','),
    ).join('\n');
    const blob = new Blob(['﻿' + header + rows], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nettapu-aboneler-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="E-Bülten Aboneleri"
        subtitle="Footer'dan abone olan e-posta adresleri."
      />

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 flex-1 max-w-md">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="E-posta veya isim ara…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="flex-1 bg-transparent text-sm focus:outline-none"
          />
        </div>
        <button
          type="button"
          onClick={exportCsv}
          disabled={items.length === 0}
          className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-40"
        >
          <Download className="h-4 w-4" />
          CSV İndir ({items.length})
        </button>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-2.5 font-semibold text-slate-600"><Mail className="h-4 w-4 inline mr-1.5" />E-posta</th>
              <th className="text-left px-4 py-2.5 font-semibold text-slate-600">İsim</th>
              <th className="text-left px-4 py-2.5 font-semibold text-slate-600">Kaynak</th>
              <th className="text-left px-4 py-2.5 font-semibold text-slate-600">Durum</th>
              <th className="text-left px-4 py-2.5 font-semibold text-slate-600">Abone Tarihi</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-500">Yükleniyor…</td></tr>}
            {!loading && items.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-500">Henüz abone yok.</td></tr>}
            {items.map((s) => (
              <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-2.5 font-medium">{s.email}</td>
                <td className="px-4 py-2.5 text-slate-600">{s.name || '—'}</td>
                <td className="px-4 py-2.5 text-slate-600">{s.source}</td>
                <td className="px-4 py-2.5">
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${s.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {s.is_active ? 'Aktif' : 'Pasif'}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-slate-600">{new Date(s.subscribed_at).toLocaleDateString('tr-TR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
