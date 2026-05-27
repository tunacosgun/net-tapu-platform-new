'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import apiClient from '@/lib/api-client';
import { showApiError } from '@/components/api-error-toast';
import { TableSkeleton } from '@/components/skeleton';
import { formatPrice, formatDate } from '@/lib/format';
import { PageHeader, DataTable, Badge, Pagination, Button, Alert, type Column } from '@/components/ui';
import { Map } from 'lucide-react';
import { LocationAutocomplete } from '@/components/location-autocomplete';
import type { Parcel, PaginatedResponse } from '@/types';

const statusLabels: Record<string, string> = {
  draft: 'Taslak',
  active: 'Aktif',
  deposit_taken: 'Depozito Alındı',
  sold: 'Satıldı',
  withdrawn: 'Geri Çekildi',
  reserved: 'Ayırtıldı',
};

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  sold: 'bg-red-100 text-red-700',
  deposit_taken: 'bg-yellow-100 text-yellow-700',
  reserved: 'bg-purple-100 text-purple-700',
  withdrawn: 'bg-gray-100 text-gray-400',
  draft: 'bg-gray-100 text-gray-500',
};

const SESSION_KEY = 'admin_parcels_state';

function restoreState() {
  try {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) return JSON.parse(saved) as { page: number; status: string; search: string };
  } catch {}
  return null;
}

export default function AdminParcelsPage() {
  const saved = restoreState();
  const [data, setData] = useState<PaginatedResponse<Parcel> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(saved?.page ?? 1);
  const [statusFilter, setStatusFilter] = useState(saved?.status ?? '');
  const [searchInput, setSearchInput] = useState(saved?.search ?? '');
  const [search, setSearch] = useState(saved?.search ?? '');
  const [cityFilter, setCityFilter] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [neighborhoodFilter, setNeighborhoodFilter] = useState('');
  const [parcelTypeFilter, setParcelTypeFilter] = useState('');
  const [zoningFilter, setZoningFilter] = useState('');
  const [minAreaFilter, setMinAreaFilter] = useState('');
  const [maxAreaFilter, setMaxAreaFilter] = useState('');
  const [minPriceFilter, setMinPriceFilter] = useState('');
  const [maxPriceFilter, setMaxPriceFilter] = useState('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'price' | 'areaM2'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkPrice, setShowBulkPrice] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const editRef = useRef<HTMLInputElement>(null);

  const fetchParcels = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {
        page,
        limit: 20,
        sortBy,
        sortOrder,
      };
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;
      if (cityFilter) params.city = cityFilter;
      if (districtFilter) params.district = districtFilter;
      if (neighborhoodFilter) params.neighborhood = neighborhoodFilter;
      if (parcelTypeFilter) params.parcelType = parcelTypeFilter;
      if (zoningFilter) params.zoningStatus = zoningFilter;
      if (minAreaFilter) params.minArea = minAreaFilter;
      if (maxAreaFilter) params.maxArea = maxAreaFilter;
      if (minPriceFilter) params.minPrice = minPriceFilter;
      if (maxPriceFilter) params.maxPrice = maxPriceFilter;
      const { data: res } = await apiClient.get<PaginatedResponse<Parcel>>('/admin/parcels', { params });
      setData(res);
    } catch (err) {
      showApiError(err);
    } finally {
      setLoading(false);
    }
  }, [
    page, statusFilter, search,
    cityFilter, districtFilter, neighborhoodFilter, parcelTypeFilter,
    zoningFilter, minAreaFilter, maxAreaFilter, minPriceFilter, maxPriceFilter,
    sortBy, sortOrder,
  ]);

  useEffect(() => {
    fetchParcels();
  }, [fetchParcels]);

  // Persist list state so "back" from edit page restores position
  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ page, status: statusFilter, search }));
    } catch {}
  }, [page, statusFilter, search]);

  useEffect(() => {
    if (editRef.current) editRef.current.focus();
  }, [editingCell]);

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (!data) return;
    if (selectedIds.size === data.data.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(data.data.map((p) => p.id)));
    }
  }

  function startEdit(parcel: Parcel, field: string) {
    setEditingCell({ id: parcel.id, field });
    if (field === 'price') setEditValue(parcel.price || '');
    else if (field === 'status') setEditValue(parcel.status);
    else if (field === 'title') setEditValue(parcel.title);
    else if (field === 'ada') setEditValue(parcel.ada || '');
    else if (field === 'parsel') setEditValue(parcel.parsel || '');
  }

  async function saveEdit() {
    if (!editingCell) return;
    try {
      await apiClient.patch(`/parcels/${editingCell.id}`, {
        [editingCell.field]: editingCell.field === 'price' ? parseFloat(editValue) : editValue,
      });
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          data: prev.data.map((p) =>
            p.id === editingCell.id ? { ...p, [editingCell.field]: editValue } : p,
          ),
        };
      });
      setEditingCell(null);
    } catch (err) {
      showApiError(err);
    }
  }

  function cancelEdit() {
    setEditingCell(null);
    setEditValue('');
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') saveEdit();
    if (e.key === 'Escape') cancelEdit();
  }

  async function handleExport(format: 'xlsx' | 'csv') {
    try {
      const { data: blob } = await apiClient.get('/admin/parcels/export', {
        params: { format },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `arsalar-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      showApiError(err);
    }
  }

  const columns: Column<Parcel>[] = [
    {
      header: '',
      className: 'w-10',
      accessor: (p) => (
        <input
          type="checkbox"
          checked={selectedIds.has(p.id)}
          onChange={() => toggleSelect(p.id)}
          className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
        />
      ),
    },
    {
      header: 'İlan',
      accessor: (p) => (
        <div className="flex items-center gap-3">
          {p.images && p.images.length > 0 ? (
            <img
              src={typeof p.images[0] === 'string' ? p.images[0] : (p.images[0].thumbnailUrl || p.images[0].watermarkedUrl || p.images[0].originalUrl || p.images[0].url)}
              alt=""
              className="h-10 w-14 rounded object-cover shrink-0 bg-gray-100"
            />
          ) : (
            <div className="h-10 w-14 rounded bg-gray-100 flex items-center justify-center shrink-0">
              <Map className="h-4 w-4 text-gray-400" />
            </div>
          )}
          <div className="min-w-0">
            {editingCell?.id === p.id && editingCell.field === 'title' ? (
              <input
                ref={editRef}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={saveEdit}
                className="w-full rounded border border-brand-500 px-2 py-1 text-sm focus:outline-none"
              />
            ) : (
              <span
                className="font-medium cursor-pointer hover:text-brand-500 line-clamp-2 text-sm"
                onDoubleClick={() => startEdit(p, 'title')}
                title={p.title}
              >
                {p.title}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      header: 'Şehir',
      accessor: (p) => (
        <span className="text-[var(--muted-foreground)]">
          {p.city}, {p.district}
        </span>
      ),
    },
    {
      header: 'Fiyat',
      accessor: (p) =>
        editingCell?.id === p.id && editingCell.field === 'price' ? (
          <input
            ref={editRef}
            type="number"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={saveEdit}
            className="w-28 rounded border border-brand-500 px-2 py-1 text-sm font-mono focus:outline-none"
          />
        ) : (
          <span
            className="font-mono cursor-pointer hover:text-brand-500"
            onDoubleClick={() => startEdit(p, 'price')}
            title="Düzenlemek için çift tıklayın"
          >
            {formatPrice(p.price)}
          </span>
        ),
    },
    {
      header: 'Alan',
      accessor: (p) => (
        <span className="text-sm text-[var(--muted-foreground)]">
          {p.areaM2 ? `${Number(p.areaM2).toLocaleString('tr-TR')} m²` : '—'}
        </span>
      ),
    },
    {
      header: 'Ada',
      className: 'w-20',
      accessor: (p) =>
        editingCell?.id === p.id && editingCell.field === 'ada' ? (
          <input
            ref={editRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={saveEdit}
            className="w-16 rounded border border-brand-500 px-2 py-1 text-sm focus:outline-none"
          />
        ) : (
          <span
            className="cursor-pointer hover:text-brand-500 text-sm"
            onDoubleClick={() => startEdit(p, 'ada')}
            title="Düzenlemek için çift tıklayın"
          >
            {p.ada || '—'}
          </span>
        ),
    },
    {
      header: 'Parsel',
      className: 'w-20',
      accessor: (p) =>
        editingCell?.id === p.id && editingCell.field === 'parsel' ? (
          <input
            ref={editRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={saveEdit}
            className="w-16 rounded border border-brand-500 px-2 py-1 text-sm focus:outline-none"
          />
        ) : (
          <span
            className="cursor-pointer hover:text-brand-500 text-sm"
            onDoubleClick={() => startEdit(p, 'parsel')}
            title="Düzenlemek için çift tıklayın"
          >
            {p.parsel || '—'}
          </span>
        ),
    },
    {
      header: 'Durum',
      accessor: (p) =>
        editingCell?.id === p.id && editingCell.field === 'status' ? (
          <select
            value={editValue}
            onChange={(e) => {
              const newStatus = e.target.value;
              setEditValue(newStatus);
              apiClient
                .patch(`/parcels/${p.id}/status`, { status: newStatus })
                .then(() => {
                  setData((prev) => {
                    if (!prev) return prev;
                    return {
                      ...prev,
                      data: prev.data.map((parcel) =>
                        parcel.id === p.id ? { ...parcel, status: newStatus } : parcel,
                      ),
                    };
                  });
                  setEditingCell(null);
                })
                .catch(showApiError);
            }}
            onBlur={cancelEdit}
            autoFocus
            className="rounded border border-brand-500 px-2 py-1 text-xs focus:outline-none"
          >
            {Object.entries(statusLabels).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        ) : (
          <span
            className={`cursor-pointer inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[p.status] || 'bg-gray-100 text-gray-700'}`}
            onClick={() => startEdit(p, 'status')}
            title="Durumu değiştirmek için tıklayın"
          >
            {statusLabels[p.status] || p.status}
          </span>
        ),
    },
    {
      header: 'Tarih',
      accessor: (p) => (
        <span className="text-xs text-[var(--muted-foreground)]">
          {formatDate(p.createdAt, 'date')}
        </span>
      ),
    },
    {
      header: '',
      accessor: (p) => (
        <Link href={`/admin/parcels/${p.id}`} className="text-brand-500 hover:underline text-xs">
          Düzenle
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Arsalar"
        subtitle={data ? `${data.meta.total} arsa` : undefined}
        action={
          <Link
            href="/admin/parcels/new"
            className="rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
          >
            Yeni Arsa
          </Link>
        }
      />

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSearch(searchInput);
            setPage(1);
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            placeholder="Ara... (başlık, şehir)"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="rounded-md border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-sm w-56"
          />
          <Button type="submit" size="sm">
            Ara
          </Button>
        </form>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-md border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-sm"
        >
          <option value="">Tüm Durumlar</option>
          {Object.entries(statusLabels).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>

        <Button
          size="sm"
          variant={showAdvancedFilters ? 'primary' : 'secondary'}
          onClick={() => setShowAdvancedFilters((v) => !v)}
        >
          {showAdvancedFilters ? 'Filtreleri Gizle' : 'Gelişmiş Filtreler'}
        </Button>

        {/* Sort controls */}
        <div className="flex items-center gap-1 rounded-md border border-slate-200 bg-slate-100 p-1">
          <span className="px-2 text-xs font-semibold text-slate-500">Sırala:</span>
          <button
            type="button"
            onClick={() => { setSortBy('price'); setSortOrder('ASC'); setPage(1); }}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${sortBy === 'price' && sortOrder === 'ASC' ? 'bg-emerald-600 text-white' : 'text-slate-700 hover:bg-white'}`}
          >
            Fiyat ↑
          </button>
          <button
            type="button"
            onClick={() => { setSortBy('price'); setSortOrder('DESC'); setPage(1); }}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${sortBy === 'price' && sortOrder === 'DESC' ? 'bg-emerald-600 text-white' : 'text-slate-700 hover:bg-white'}`}
          >
            Fiyat ↓
          </button>
          <button
            type="button"
            onClick={() => { setSortBy('areaM2'); setSortOrder('DESC'); setPage(1); }}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${sortBy === 'areaM2' ? 'bg-emerald-600 text-white' : 'text-slate-700 hover:bg-white'}`}
          >
            Alan
          </button>
          <button
            type="button"
            onClick={() => { setSortBy('createdAt'); setSortOrder('DESC'); setPage(1); }}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${sortBy === 'createdAt' ? 'bg-emerald-600 text-white' : 'text-slate-700 hover:bg-white'}`}
          >
            En Yeni
          </button>
        </div>

        <div className="flex-1" />

        {selectedIds.size > 0 && (
          <div className="flex gap-2 items-center">
            <span className="text-sm text-[var(--muted-foreground)]">{selectedIds.size} seçili</span>
            <Button size="sm" variant="secondary" onClick={() => setShowBulkPrice(true)}>
              Toplu Fiyat Güncelle
            </Button>
          </div>
        )}

        <div className="flex gap-2">
          <div className="relative group">
            <Button size="sm" variant="secondary">
              Dışa Aktar ▾
            </Button>
            <div className="absolute right-0 top-full z-10 mt-1 hidden w-36 rounded-md border border-[var(--border)] bg-[var(--background)] shadow-lg group-hover:block">
              <button
                onClick={() => handleExport('xlsx')}
                className="block w-full px-4 py-2 text-left text-sm hover:bg-[var(--muted)]"
              >
                Excel (.xlsx)
              </button>
              <button
                onClick={() => handleExport('csv')}
                className="block w-full px-4 py-2 text-left text-sm hover:bg-[var(--muted)]"
              >
                CSV (.csv)
              </button>
            </div>
          </div>
          <Button size="sm" variant="secondary" onClick={() => setShowImport(true)}>
            İçe Aktar
          </Button>
        </div>
      </div>

      {showAdvancedFilters && (
        <div className="rounded-lg border border-[var(--input)] bg-[var(--background)] p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <LocationAutocomplete
              label="Şehir"
              type="city"
              value={cityFilter}
              onChange={(v) => {
                setCityFilter(v);
                setDistrictFilter('');
                setNeighborhoodFilter('');
                setPage(1);
              }}
            />
            <LocationAutocomplete
              label="İlçe"
              type="district"
              city={cityFilter}
              value={districtFilter}
              onChange={(v) => {
                setDistrictFilter(v);
                setNeighborhoodFilter('');
                setPage(1);
              }}
            />
            <LocationAutocomplete
              label="Mahalle / Köy"
              type="neighborhood"
              city={cityFilter}
              district={districtFilter}
              value={neighborhoodFilter}
              onChange={(v) => {
                setNeighborhoodFilter(v);
                setPage(1);
              }}
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1.5">Arazi Türü</label>
              <select
                value={parcelTypeFilter}
                onChange={(e) => { setParcelTypeFilter(e.target.value); setPage(1); }}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm"
              >
                <option value="">Tümü</option>
                <option value="arsa">Arsa</option>
                <option value="tarla">Tarla</option>
                <option value="bağ">Bağ</option>
                <option value="bahçe">Bahçe</option>
                <option value="zeytinlik">Zeytinlik</option>
                <option value="orman">Orman</option>
                <option value="diğer">Diğer</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1.5">İmar Durumu</label>
              <select
                value={zoningFilter}
                onChange={(e) => { setZoningFilter(e.target.value); setPage(1); }}
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
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1.5">Min m²</label>
              <input
                type="number" value={minAreaFilter}
                onChange={(e) => { setMinAreaFilter(e.target.value); setPage(1); }}
                placeholder="örn 300"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1.5">Max m²</label>
              <input
                type="number" value={maxAreaFilter}
                onChange={(e) => { setMaxAreaFilter(e.target.value); setPage(1); }}
                placeholder="örn 5000"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1.5">Min Fiyat ₺</label>
              <input
                type="number" value={minPriceFilter}
                onChange={(e) => { setMinPriceFilter(e.target.value); setPage(1); }}
                placeholder="örn 100000"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1.5">Max Fiyat ₺</label>
              <input
                type="number" value={maxPriceFilter}
                onChange={(e) => { setMaxPriceFilter(e.target.value); setPage(1); }}
                placeholder="örn 2000000"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm"
              />
            </div>
            <div className="col-span-2 flex items-end">
              <Button
                size="sm" variant="secondary"
                onClick={() => {
                  setCityFilter(''); setDistrictFilter(''); setNeighborhoodFilter('');
                  setParcelTypeFilter(''); setZoningFilter('');
                  setMinAreaFilter(''); setMaxAreaFilter('');
                  setMinPriceFilter(''); setMaxPriceFilter('');
                  setPage(1);
                }}
              >
                Filtreleri Temizle
              </Button>
            </div>
          </div>
        </div>
      )}

      <p className="text-xs text-[var(--muted-foreground)]">
        Başlık, fiyat veya duruma çift tıklayarak satır içi düzenleme yapabilirsiniz.
      </p>

      {loading ? (
        <TableSkeleton rows={8} cols={7} />
      ) : (
        data && (
          <>
            <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
              <input
                type="checkbox"
                checked={data.data.length > 0 && selectedIds.size === data.data.length}
                onChange={toggleAll}
                className="h-4 w-4 rounded border-gray-300 text-brand-500"
              />
              <span>Tümünü Seç</span>
            </div>
            <DataTable columns={columns} data={data.data} keyExtractor={(p) => p.id} />
            <Pagination page={page} totalPages={data.meta.totalPages} onPageChange={setPage} />
          </>
        )
      )}

      {showBulkPrice && (
        <BulkPriceModal
          selectedIds={[...selectedIds]}
          filters={{
            city: cityFilter || undefined,
            district: districtFilter || undefined,
            neighborhood: neighborhoodFilter || undefined,
            status: statusFilter || undefined,
            zoningStatus: zoningFilter || undefined,
            parcelType: parcelTypeFilter || undefined,
            minPrice: minPriceFilter ? Number(minPriceFilter) : undefined,
            maxPrice: maxPriceFilter ? Number(maxPriceFilter) : undefined,
            minArea: minAreaFilter ? Number(minAreaFilter) : undefined,
            maxArea: maxAreaFilter ? Number(maxAreaFilter) : undefined,
          }}
          totalMatching={data?.meta?.total ?? 0}
          onClose={() => setShowBulkPrice(false)}
          onSuccess={() => {
            setShowBulkPrice(false);
            setSelectedIds(new Set());
            fetchParcels();
          }}
        />
      )}

      {showImport && (
        <ImportModal
          onClose={() => setShowImport(false)}
          onSuccess={() => {
            setShowImport(false);
            fetchParcels();
          }}
        />
      )}
    </div>
  );
}

/* ═══ Bulk Price Update Modal ═══ */
function BulkPriceModal({
  selectedIds,
  filters,
  totalMatching,
  onClose,
  onSuccess,
}: {
  selectedIds: string[];
  filters: Record<string, string | number | undefined>;
  totalMatching: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [percentage, setPercentage] = useState('');
  const [roundTo, setRoundTo] = useState('1000');
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  // 'selected' = only checked rows; 'filtered' = all rows matching current filters
  const [mode, setMode] = useState<'selected' | 'filtered'>(selectedIds.length > 0 ? 'selected' : 'filtered');

  const activeFilters = Object.entries(filters).filter(([, v]) => v !== undefined && v !== '');
  const target = mode === 'selected' ? selectedIds.length : totalMatching;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!percentage || target === 0) return;
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        percentageIncrease: parseFloat(percentage),
        roundUpTo: parseInt(roundTo, 10),
      };
      if (mode === 'selected') {
        payload.parcelIds = selectedIds;
      } else {
        payload.filters = Object.fromEntries(activeFilters);
      }
      await apiClient.post('/admin/parcels/bulk-price-update', payload);
      setResult(`${target} arsa fiyatı güncellendi.`);
      setTimeout(onSuccess, 1500);
    } catch (err) {
      showApiError(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900">Toplu Fiyat Güncelleme</h3>

        {/* Target selection */}
        <div className="mt-3 space-y-2">
          <label className={`flex items-start gap-2 p-2 rounded border cursor-pointer ${mode === 'selected' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200'} ${selectedIds.length === 0 ? 'opacity-50' : ''}`}>
            <input
              type="radio"
              checked={mode === 'selected'}
              onChange={() => setMode('selected')}
              disabled={selectedIds.length === 0}
              className="mt-0.5"
            />
            <div className="text-sm">
              <div className="font-semibold">Seçili arsalar ({selectedIds.length})</div>
              <div className="text-xs text-slate-500">Sadece listede işaretlediğiniz arsalar.</div>
            </div>
          </label>
          <label className={`flex items-start gap-2 p-2 rounded border cursor-pointer ${mode === 'filtered' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200'}`}>
            <input
              type="radio"
              checked={mode === 'filtered'}
              onChange={() => setMode('filtered')}
              className="mt-0.5"
            />
            <div className="text-sm">
              <div className="font-semibold">Filtreye uyan TÜM arsalar ({totalMatching})</div>
              <div className="text-xs text-slate-500">
                {activeFilters.length === 0 ? 'Tüm arsalar — filtre eklemek için sayfada filtre kullanın.' : `Aktif filtreler: ${activeFilters.map(([k, v]) => `${k}=${v}`).join(', ')}`}
              </div>
            </div>
          </label>
        </div>

        {result ? (
          <Alert variant="success" className="mt-4">
            {result}
          </Alert>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Yüzde Değişim (%)</label>
              <input
                type="number"
                step="0.1"
                value={percentage}
                onChange={(e) => setPercentage(e.target.value)}
                placeholder="Örn: 10 (artış) veya -5 (indirim)"
                className="mt-1 w-full rounded-md border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-sm"
                required
              />
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                Pozitif değer fiyat artışı, negatif değer indirim uygular.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Yuvarlama (TL)</label>
              <select
                value={roundTo}
                onChange={(e) => setRoundTo(e.target.value)}
                className="mt-1 w-full rounded-md border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-sm"
              >
                <option value="1">1 TL</option>
                <option value="100">100 TL</option>
                <option value="1000">1.000 TL</option>
                <option value="5000">5.000 TL</option>
                <option value="10000">10.000 TL</option>
              </select>
            </div>
            <div className="flex gap-3">
              <Button type="submit" disabled={saving}>
                {saving ? 'Güncelleniyor...' : 'Güncelle'}
              </Button>
              <Button type="button" variant="secondary" onClick={onClose}>
                İptal
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

/* ═══ Import Modal ═══ */
function ImportModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ success: number; errors: string[] } | null>(null);
  const [dragOver, setDragOver] = useState(false);

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await apiClient.post('/admin/parcels/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(data);
      if (!data.errors || data.errors.length === 0) {
        setTimeout(onSuccess, 1500);
      }
    } catch (err) {
      showApiError(err);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900">Excel / CSV İçe Aktar</h3>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Excel (.xlsx) veya CSV dosyasından arsa verilerini içe aktarın.
        </p>

        <div className="mt-3 flex gap-2">
          <a
            href="/api/v1/admin/parcels/import-template?format=xlsx"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:text-brand-800 underline"
          >
            📄 Örnek Excel şablonunu indir
          </a>
          <a
            href="/api/v1/admin/parcels/import-template?format=csv"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:text-brand-800 underline"
          >
            📄 Örnek CSV şablonunu indir
          </a>
        </div>

        {result ? (
          <div className="mt-4 space-y-3">
            <Alert variant="success">{result.success} arsa başarıyla içe aktarıldı.</Alert>
            {result.errors && result.errors.length > 0 && (
              <div>
                <p className="text-sm font-medium text-red-600">
                  Hatalar ({result.errors.length}):
                </p>
                <ul className="mt-1 max-h-40 overflow-y-auto space-y-1">
                  {result.errors.map((err, i) => (
                    <li key={i} className="text-xs text-red-500">
                      {err}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <Button onClick={onClose}>Kapat</Button>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const dropped = e.dataTransfer.files[0];
                if (dropped) setFile(dropped);
              }}
              className={`rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                dragOver
                  ? 'border-brand-500 bg-brand-50'
                  : 'border-[var(--border)] hover:border-brand-300'
              }`}
            >
              {file ? (
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                  <button
                    onClick={() => setFile(null)}
                    className="mt-2 text-xs text-red-500 hover:underline"
                  >
                    Değiştir
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    Dosyayı sürükleyin veya{' '}
                    <label className="cursor-pointer text-brand-500 hover:underline">
                      seçin
                      <input
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        className="hidden"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                      />
                    </label>
                  </p>
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                    Desteklenen formatlar: .xlsx, .xls, .csv
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button onClick={handleUpload} disabled={!file || uploading}>
                {uploading ? 'Yükleniyor...' : 'İçe Aktar'}
              </Button>
              <Button variant="secondary" onClick={onClose}>
                İptal
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
