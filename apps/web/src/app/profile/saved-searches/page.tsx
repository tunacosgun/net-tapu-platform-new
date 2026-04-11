'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, X, ArrowRight, History, Trash2, ChevronLeft } from 'lucide-react';
import { useRecentSearches } from '@/hooks/use-recent-searches';

export default function SavedSearchesPage() {
  const router = useRouter();
  const { searches, remove, clear } = useRecentSearches();

  function goSearch(q: string) {
    router.push(`/parcels?search=${encodeURIComponent(q)}`);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Back */}
        <Link href="/profile" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 mb-6 transition-colors">
          <ChevronLeft className="h-4 w-4" />
          Hesabıma Dön
        </Link>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Kayıtlı Aramalar</h1>
            <p className="text-sm text-slate-500 mt-1">Son yaptığınız aramalar burada görünür.</p>
          </div>
          {searches.length > 0 && (
            <button
              onClick={clear}
              className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 font-medium transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Tümünü Sil
            </button>
          )}
        </div>

        {/* Content */}
        {searches.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center">
            <History className="h-12 w-12 mx-auto mb-3 text-slate-200" />
            <p className="text-slate-500 font-medium">Henüz kayıtlı aramanız yok.</p>
            <p className="text-sm text-slate-400 mt-1 mb-6">Arsalar sayfasında arama yaptığınızda buraya kaydedilir.</p>
            <Link
              href="/parcels"
              className="inline-flex items-center gap-2 bg-emerald-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-emerald-700 transition-colors"
            >
              Arsalara Göz At <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-50">
            {searches.map((q) => (
              <div key={q} className="flex items-center gap-3 px-5 py-4 hover:bg-slate-50 group transition-colors">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Search className="h-4 w-4" />
                </div>
                <button
                  onClick={() => goSearch(q)}
                  className="flex-1 text-left text-sm font-semibold text-slate-800 hover:text-emerald-600 transition-colors"
                >
                  {q}
                </button>
                <button
                  onClick={() => goSearch(q)}
                  className="hidden group-hover:flex items-center gap-1 text-xs text-emerald-600 font-semibold mr-2"
                >
                  Ara <ArrowRight className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => remove(q)}
                  className="p-1.5 text-slate-300 hover:text-red-400 transition-colors rounded-lg hover:bg-red-50"
                  aria-label="Sil"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
