'use client';

import { useEffect, useState, useCallback } from 'react';
import apiClient from '@/lib/api-client';
import { showApiError } from '@/components/api-error-toast';
import { TableSkeleton } from '@/components/skeleton';
import { formatPrice, formatDate } from '@/lib/format';
import { PageHeader, DataTable, Badge, Pagination, Button, type Column } from '@/components/ui';
import { FormattedPriceInput } from '@/components/formatted-price-input';
import type { Offer, PaginatedResponse } from '@/types';

type EnrichedOffer = Offer & {
  userName?: string;
  userEmail?: string | null;
  parcelTitle?: string | null;
  parcelListingId?: string | null;
  parcelPrice?: string | null;
};

const statusLabels: Record<string, string> = {
  pending: 'Bekliyor', accepted: 'Kabul Edildi', rejected: 'Reddedildi',
  countered: 'Karşı Teklif', expired: 'Süresi Doldu', withdrawn: 'Geri Çekildi',
};
const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700', accepted: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700', countered: 'bg-blue-100 text-blue-700',
  expired: 'bg-gray-100 text-gray-700', withdrawn: 'bg-gray-100 text-gray-700',
};

export default function AdminOffersPage() {
  const [data, setData] = useState<PaginatedResponse<EnrichedOffer> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [responding, setResponding] = useState<string | null>(null);
  const [counterTarget, setCounterTarget] = useState<EnrichedOffer | null>(null);

  const fetchOffers = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;
      const { data: res } = await apiClient.get<PaginatedResponse<EnrichedOffer>>('/crm/offers', { params });
      setData(res);
    } catch (err) { showApiError(err); }
    finally { setLoading(false); }
  }, [page, statusFilter, search]);

  useEffect(() => { fetchOffers(); }, [fetchOffers]);

  async function respondToOffer(offerId: string, responseType: 'accept' | 'reject' | 'counter', counterAmount?: string) {
    setResponding(offerId);
    try {
      await apiClient.post(`/crm/offers/${offerId}/respond`, {
        responseType,
        counterAmount: counterAmount || undefined,
      });
      await fetchOffers();
    } catch (err) { showApiError(err); }
    finally { setResponding(null); }
  }

  const columns: Column<EnrichedOffer>[] = [
    {
      header: 'Kullanıcı',
      accessor: (o) => (
        <div className="text-sm">
          <div className="font-medium text-ink-900">{o.userName || '—'}</div>
          {o.userEmail && <div className="text-xs text-slate-500">{o.userEmail}</div>}
        </div>
      ),
    },
    {
      header: 'Arsa',
      accessor: (o) => (
        <div className="text-sm">
          <div className="font-medium text-ink-900 max-w-[260px] truncate" title={o.parcelTitle || ''}>
            {o.parcelTitle || '—'}
          </div>
          {o.parcelListingId && <div className="text-xs text-slate-500 font-mono">#{o.parcelListingId}</div>}
        </div>
      ),
    },
    {
      header: 'Teklif',
      accessor: (o) => (
        <div className="font-mono">
          <div className="font-semibold text-ink-900">{formatPrice(o.amount)}</div>
          {o.parcelPrice && (
            <div className="text-xs text-slate-500">
              İlan: {formatPrice(o.parcelPrice)}
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Durum',
      accessor: (o) => (
        <Badge className={statusColors[o.status] || ''}>
          {statusLabels[o.status] || o.status}
        </Badge>
      ),
    },
    { header: 'Mesaj', accessor: (o) => <span className="text-xs text-[var(--muted-foreground)] max-w-[200px] truncate block">{o.message || '—'}</span> },
    { header: 'Tarih', accessor: (o) => <span className="text-xs text-[var(--muted-foreground)]">{formatDate(o.createdAt)}</span> },
    {
      header: '',
      accessor: (o) => o.status === 'pending' ? (
        <div className="flex flex-wrap gap-1">
          <button onClick={() => respondToOffer(o.id, 'accept')} disabled={responding === o.id}
            className="rounded bg-green-500 px-2 py-1 text-xs font-semibold text-white hover:bg-green-600 disabled:opacity-50">
            Kabul
          </button>
          <button onClick={() => setCounterTarget(o)} disabled={responding === o.id}
            className="rounded bg-blue-500 px-2 py-1 text-xs font-semibold text-white hover:bg-blue-600 disabled:opacity-50">
            Karşı Teklif
          </button>
          <button onClick={() => respondToOffer(o.id, 'reject')} disabled={responding === o.id}
            className="rounded bg-red-500 px-2 py-1 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-50">
            Reddet
          </button>
        </div>
      ) : null,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Teklifler" />

      <div className="flex flex-wrap gap-3 items-center">
        <form onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); setPage(1); }} className="flex gap-2">
          <input
            type="text"
            placeholder="Kullanıcı adı, e-posta veya arsa başlığı..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="rounded-md border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-sm w-72"
          />
          <Button type="submit" size="sm">Ara</Button>
          {search && (
            <Button type="button" size="sm" variant="secondary" onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }}>
              Temizle
            </Button>
          )}
        </form>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="rounded-md border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-sm">
          <option value="">Tüm Durumlar</option>
          {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {loading ? <TableSkeleton rows={8} cols={7} /> : data && (
        <>
          <DataTable
            columns={columns}
            data={data.data}
            keyExtractor={(o) => o.id}
          />
          <Pagination page={page} totalPages={data.meta.totalPages} onPageChange={setPage} />
        </>
      )}

      {counterTarget && (
        <CounterOfferModal
          offer={counterTarget}
          onClose={() => setCounterTarget(null)}
          onSubmit={async (amount) => {
            await respondToOffer(counterTarget.id, 'counter', amount);
            setCounterTarget(null);
          }}
        />
      )}
    </div>
  );
}

function CounterOfferModal({
  offer,
  onClose,
  onSubmit,
}: {
  offer: EnrichedOffer;
  onClose: () => void;
  onSubmit: (amount: string) => Promise<void>;
}) {
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount) return;
    setSaving(true);
    try {
      await onSubmit(amount);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <h3 className="text-lg font-bold text-ink-900">Karşı Teklif Gönder</h3>
        <div className="mt-2 text-sm text-slate-600 space-y-1">
          <div><span className="text-slate-400">Kullanıcı:</span> <span className="font-medium">{offer.userName || offer.userEmail || '—'}</span></div>
          <div><span className="text-slate-400">Arsa:</span> <span className="font-medium">{offer.parcelTitle || '—'}</span></div>
          <div><span className="text-slate-400">Kullanıcının teklifi:</span> <span className="font-mono font-semibold">{formatPrice(offer.amount)}</span></div>
          {offer.parcelPrice && <div><span className="text-slate-400">İlan fiyatı:</span> <span className="font-mono">{formatPrice(offer.parcelPrice)}</span></div>}
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <FormattedPriceInput
            label="Karşı Teklif Tutarı *"
            value={amount}
            onChange={setAmount}
            placeholder="örn 420.000"
          />
          <div className="flex gap-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
              Vazgeç
            </Button>
            <Button type="submit" className="flex-1" disabled={saving || !amount}>
              {saving ? 'Gönderiliyor...' : 'Karşı Teklif Gönder'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
