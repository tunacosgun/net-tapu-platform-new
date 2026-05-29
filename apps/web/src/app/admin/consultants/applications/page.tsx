'use client';

import { useEffect, useState, useCallback } from 'react';
import apiClient from '@/lib/api-client';
import { Handshake, MessageSquare, Search } from 'lucide-react';
import type { PaginatedResponse } from '@/types';

type Contact = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  message: string;
  status: string;
  createdAt: string;
};

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  new: { label: 'Yeni', cls: 'bg-blue-100 text-blue-700' },
  assigned: { label: 'Atandı', cls: 'bg-purple-100 text-purple-700' },
  in_progress: { label: 'Görüşmede', cls: 'bg-amber-100 text-amber-700' },
  completed: { label: 'Tamamlandı', cls: 'bg-emerald-100 text-emerald-700' },
  cancelled: { label: 'İptal', cls: 'bg-slate-200 text-slate-600' },
};

/**
 * Consultant applications view.
 *
 * "DANIŞMAN BAŞVURUSU" arrives through the public /contact form with a
 * tag prefix in the message body. There's no dedicated DB type yet — we
 * surface them as a filtered view of contact-requests, then let the
 * admin promote the row into a live-chat ticket with one click.
 */
export default function ConsultantApplicationsPage() {
  const [items, setItems] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Pull a wide page and filter client-side by the [DANIŞMAN BAŞVURUSU]
      // marker. Server-side filtering would require a schema change — this is
      // a thin "rotation queue" that admins drain frequently, so the page is
      // small in practice.
      const { data } = await apiClient.get<PaginatedResponse<Contact>>('/crm/contact-requests', {
        params: { limit: 100, page: 1, status: statusFilter || undefined },
      });
      const all = data.data || [];
      const filtered = all.filter((c) =>
        (c.message || '').toUpperCase().includes('[DANIŞMAN BAŞVURUSU]'),
      );
      setItems(filtered);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const visible = items.filter((c) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      (c.name || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.phone || '').toLowerCase().includes(q) ||
      (c.message || '').toLowerCase().includes(q)
    );
  });

  async function startChat(contactId: string, name: string) {
    const greeting = window.prompt(
      'İlk mesaj (danışman adayına gönderilecek):',
      `Merhaba ${name}, başvurunuz için teşekkür ederiz. Sizi tanıyabilmek için kısa bir görüşme yapmak isteriz.`,
    );
    if (greeting === null) return;
    try {
      const { data } = await apiClient.post<{ id: string }>('/admin/support/tickets/from-contact', {
        contactRequestId: contactId,
        greeting: greeting || undefined,
        subject: `Danışman Başvurusu — ${name}`,
      });
      window.location.href = `/admin/support?ticket=${data.id}`;
    } catch (err) {
      alert('Görüşme başlatılamadı: ' + (err as Error).message);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50">
          <Handshake className="h-5 w-5 text-emerald-700" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-ink-900">Danışman Başvuruları</h1>
          <p className="text-sm text-slate-500">Web sitesinden gelen danışman/bayi başvurularını yönetin.</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ara: isim, e-posta, telefon"
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none"
        >
          <option value="">Tüm Durumlar</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        <span className="text-sm text-slate-500">{visible.length} başvuru</span>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs text-slate-600 uppercase tracking-wider">
            <tr>
              <th className="text-left px-4 py-3">Başvuran</th>
              <th className="text-left px-4 py-3">İletişim</th>
              <th className="text-left px-4 py-3">Mesaj</th>
              <th className="text-left px-4 py-3">Durum</th>
              <th className="text-left px-4 py-3">Tarih</th>
              <th className="text-left px-4 py-3">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Yükleniyor…</td></tr>
            )}
            {!loading && visible.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                  <Handshake className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                  Bekleyen başvuru yok
                </td>
              </tr>
            )}
            {visible.map((c) => {
              const st = STATUS_LABEL[c.status] || { label: c.status, cls: 'bg-slate-100 text-slate-600' };
              return (
                <tr key={c.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-medium text-slate-900">{c.name}</td>
                  <td className="px-4 py-3 text-slate-600">
                    <div>{c.email}</div>
                    <div className="text-xs text-slate-400">{c.phone}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-700 max-w-md">
                    <p className="line-clamp-2 text-xs whitespace-pre-wrap">{c.message.replace('[DANIŞMAN BAŞVURUSU]', '').trim()}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${st.cls}`}>
                      {st.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {new Date(c.createdAt).toLocaleDateString('tr-TR')}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => startChat(c.id, c.name)}
                      className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 text-white px-2.5 py-1 text-xs font-semibold hover:bg-emerald-700"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      Görüşmeyi Başlat
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
