'use client';

import { useEffect, useRef, useState } from 'react';
import apiClient from '@/lib/api-client';
import { Search, X } from 'lucide-react';

interface Item { id: string; label: string; sub?: string }

interface Props {
  label: string;
  required?: boolean;
  value: string;
  onChange: (id: string) => void;
  /** API endpoint to search — must accept ?q=<text>&limit=10 and return array of {id, ...} */
  searchUrl: string;
  /** Convert API row to display label */
  toItem: (row: any) => Item;
  placeholder?: string;
}

/**
 * Inline search picker — admin types a name/title and selects from a dropdown
 * instead of pasting a raw UUID. Used on /admin/mail-order for user/parcel pickers.
 */
export function EntityPicker({ label, required, value, onChange, searchUrl, toItem, placeholder }: Props) {
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Item | null>(null);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  // Resolve initial value (when editing) — fetch the label for the given id
  useEffect(() => {
    if (!value) { setSelected(null); return; }
    if (selected?.id === value) return;
    setSelected({ id: value, label: value.slice(0, 8) + '…' });
  }, [value, selected?.id]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) { setItems([]); return; }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const { data } = await apiClient.get<any>(searchUrl, { params: { search: query.trim(), q: query.trim(), limit: 10 } });
        const rows: any[] = Array.isArray(data) ? data : (data?.data ?? data?.items ?? []);
        setItems(rows.map(toItem));
      } catch { setItems([]); }
      finally { setLoading(false); }
    }, 250);
    return () => clearTimeout(t);
  }, [query, searchUrl, toItem]);

  function pick(item: Item) {
    setSelected(item);
    onChange(item.id);
    setOpen(false);
    setQuery('');
  }

  function clear() {
    setSelected(null);
    onChange('');
    setQuery('');
  }

  return (
    <div ref={boxRef} className="relative">
      <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
        {label}{required && <span className="text-red-500"> *</span>}
      </label>
      {selected ? (
        <div className="flex items-center gap-2 rounded-md border border-[var(--input)] bg-[var(--background)] px-3 py-2.5">
          <Search className="h-4 w-4 text-slate-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate">{selected.label}</div>
            {selected.sub && <div className="text-xs text-slate-500 truncate">{selected.sub}</div>}
          </div>
          <button type="button" onClick={clear} className="rounded p-1 hover:bg-slate-100" title="Değiştir">
            <X className="h-4 w-4 text-slate-400" />
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 rounded-md border border-[var(--input)] bg-[var(--background)] px-3 py-2.5">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder={placeholder || 'Aramak için yazmaya başlayın…'}
              value={query}
              onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
              onFocus={() => setOpen(true)}
              className="flex-1 bg-transparent text-sm focus:outline-none"
            />
          </div>
          {open && (query.length >= 2) && (
            <div className="absolute z-20 mt-1 w-full max-h-64 overflow-y-auto rounded-md border border-slate-200 bg-white shadow-lg">
              {loading && <div className="px-3 py-2 text-xs text-slate-500">Aranıyor…</div>}
              {!loading && items.length === 0 && <div className="px-3 py-2 text-xs text-slate-500">Sonuç yok</div>}
              {items.map((it) => (
                <button
                  key={it.id}
                  type="button"
                  onClick={() => pick(it)}
                  className="w-full text-left px-3 py-2 hover:bg-emerald-50 border-b border-slate-100 last:border-b-0"
                >
                  <div className="text-sm font-medium truncate">{it.label}</div>
                  {it.sub && <div className="text-xs text-slate-500 truncate">{it.sub}</div>}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
