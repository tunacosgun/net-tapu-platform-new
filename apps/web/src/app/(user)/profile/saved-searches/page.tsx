'use client';

import { useRouter } from 'next/navigation';
import { useRecentSearches } from '@/hooks/use-recent-searches';
import { Search, Trash2, ArrowRight, History } from 'lucide-react';

export default function SavedSearchesPage() {
  const router = useRouter();
  const { searches, remove, clear } = useRecentSearches();

  function handleGoToSearch(query: string) {
    router.push(`/parcels?search=${encodeURIComponent(query)}`);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Kayıtlı Aramalarım</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-[var(--muted-foreground)]">{searches.length} arama</span>
          {searches.length > 0 && (
            <button
              onClick={() => { if (confirm('Tüm aramalar silinecek. Emin misiniz?')) clear(); }}
              className="text-xs text-red-400 hover:text-red-600 transition-colors"
            >
              Tümünü Sil
            </button>
          )}
        </div>
      </div>

      {searches.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] p-12 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
            <History className="h-7 w-7 text-slate-400" />
          </div>
          <h3 className="text-sm font-semibold text-[var(--foreground)]">Kayıtlı arama yok</h3>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Arsalar sayfasında arama yaptıktan sonra aramalar burada görünür.
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
          {searches.map((query) => (
            <div
              key={query}
              className="flex items-center gap-4 rounded-xl border border-[var(--border)] bg-white px-5 py-4 hover:shadow-sm transition-shadow group"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 shrink-0">
                <Search className="h-4 w-4 text-slate-500" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-slate-800 truncate">{query}</p>
                <p className="text-xs text-slate-400 mt-0.5">Arsalar sayfasında ara</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleGoToSearch(query)}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
                >
                  Ara
                  <ArrowRight className="h-3 w-3" />
                </button>
                <button
                  onClick={() => remove(query)}
                  className="rounded-lg border border-red-200 p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
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
        Aramalar bu cihazda yerel olarak saklanır.
      </p>
    </div>
  );
}
