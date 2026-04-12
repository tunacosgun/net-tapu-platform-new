'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import apiClient from '@/lib/api-client';
import { showApiError } from '@/components/api-error-toast';
import { TableSkeleton } from '@/components/skeleton';
import { PageHeader, Button } from '@/components/ui';
import type { CmsPage, PaginatedResponse } from '@/types';

const CATEGORIES = [
  'Arsa Yatırımı',
  'İmar & Hukuk',
  'Satın Alma Süreci',
  'Finansman',
  'İhale & Açık Artırma',
  'Genel Rehber',
];

function slugify(text: string) {
  return 'rehber-' + text
    .toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const statusConfig: Record<string, { label: string; dot: string; badge: string }> = {
  published: { label: 'Yayında', dot: 'bg-green-500', badge: 'bg-green-100 text-green-700 border border-green-200' },
  draft:     { label: 'Taslak',  dot: 'bg-yellow-500', badge: 'bg-yellow-100 text-yellow-700 border border-yellow-200' },
  archived:  { label: 'Arşiv',  dot: 'bg-slate-400', badge: 'bg-slate-100 text-slate-500 border border-slate-200' },
};

export default function AdminRealEstateGuidePage() {
  const [articles, setArticles] = useState<CmsPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('published');

  const fetchArticles = useCallback(async () => {
    try {
      const { data } = await apiClient.get<PaginatedResponse<CmsPage>>('/admin/pages', {
        params: { limit: 100, pageType: 'real_estate_concepts' },
      });
      // Filter out the main guide page, keep only articles
      setArticles(data.data.filter((p) => p.slug !== 'gayrimenkul-rehberi'));
    } catch (err) {
      showApiError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchArticles(); }, [fetchArticles]);

  function resetForm() {
    setTitle(''); setContent(''); setCategory(''); setStatus('published');
    setShowForm(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      await apiClient.post('/admin/pages', {
        title: title.trim(),
        slug: slugify(title.trim()) + '-' + Date.now().toString(36),
        pageType: 'real_estate_concepts',
        content: content.trim(),
        metaTitle: title.trim(),
        metaDescription: content.trim().slice(0, 160),
        status,
        sortOrder: articles.length,
      });
      resetForm();
      fetchArticles();
    } catch (err) {
      showApiError(err);
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(id: string, current: string) {
    try {
      const next = current === 'published' ? 'draft' : 'published';
      await apiClient.patch(`/admin/pages/${id}`, { status: next });
      fetchArticles();
    } catch (err) { showApiError(err); }
  }

  async function handleDelete(id: string, articleTitle: string) {
    if (!confirm(`"${articleTitle}" makalesini silmek istediğinize emin misiniz?`)) return;
    try {
      await apiClient.delete(`/admin/pages/${id}`);
      fetchArticles();
    } catch (err) { showApiError(err); }
  }

  const filtered = articles.filter((a) => {
    const matchSearch = !search || a.title.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  const publishedCount = articles.filter((a) => a.status === 'published').length;
  const draftCount = articles.filter((a) => a.status === 'draft').length;

  if (loading) return <TableSkeleton />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <PageHeader
            title="📖 Gayrimenkul Rehberi"
            subtitle="Makale ve rehber içeriklerini yönetin"
          />
          <div className="mt-2 flex items-center gap-2">
            <Link href="/real-estate-guide" target="_blank" className="text-xs text-emerald-600 hover:underline flex items-center gap-1">
              Sayfayı Gör ↗
            </Link>
            <span className="text-slate-300">·</span>
            <Link href="/admin/pages" className="text-xs text-slate-400 hover:text-slate-600">
              ← İçerik Yönetimi
            </Link>
          </div>
        </div>
        <Button onClick={() => setShowForm(true)}>+ Yeni Makale</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-slate-200 p-4 text-center">
          <p className="text-2xl font-bold text-slate-900">{articles.length}</p>
          <p className="text-xs text-slate-500">Toplam Makale</p>
        </div>
        <div className="rounded-xl border border-green-200 bg-green-50/60 p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{publishedCount}</p>
          <p className="text-xs text-green-600">Yayında</p>
        </div>
        <div className="rounded-xl border border-yellow-200 bg-yellow-50/60 p-4 text-center">
          <p className="text-2xl font-bold text-yellow-600">{draftCount}</p>
          <p className="text-xs text-yellow-600">Taslak</p>
        </div>
      </div>

      {/* New Article Form */}
      {showForm && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/30 p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-4">Yeni Makale Ekle</h3>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Makale Başlığı *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="örn. Arsa Alırken Nelere Dikkat Edilmeli?"
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Kategori</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Kategori seçin</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Durum</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="published">Yayında</option>
                  <option value="draft">Taslak</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">İçerik</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={8}
                placeholder="Makale içeriğini buraya yazın..."
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              />
              <p className="mt-1 text-xs text-slate-400">Kaydettikten sonra blok editörle daha detaylı düzenleyebilirsiniz.</p>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={saving || !title.trim()}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Kaydediliyor...' : 'Makaleyi Kaydet'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                İptal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Makale ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Articles list */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 py-16 text-center bg-slate-50/50">
          <p className="text-4xl mb-3">📖</p>
          <h3 className="text-base font-semibold text-slate-700">Henüz makale yok</h3>
          <p className="text-sm text-slate-400 mt-1 mb-4">
            {search ? 'Arama kriterine uygun makale bulunamadı.' : '"Yeni Makale" butonu ile başlayın.'}
          </p>
          {!showForm && !search && (
            <button
              onClick={() => setShowForm(true)}
              className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 transition-colors"
            >
              + İlk Makaleyi Ekle
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((article) => {
            const st = statusConfig[article.status] || statusConfig.draft;
            return (
              <div key={article.id} className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4 hover:shadow-sm transition-shadow group">
                {/* Status dot */}
                <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${st.dot}`} />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold text-slate-800 group-hover:text-emerald-600 transition-colors truncate">
                      {article.title}
                    </h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.badge}`}>
                      {st.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-slate-400">/{article.slug}</span>
                    {article.updatedAt && (
                      <span className="text-xs text-slate-400">
                        {new Date(article.updatedAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={`/real-estate-guide`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50 transition-colors"
                  >
                    Önizle ↗
                  </a>
                  <button
                    onClick={() => toggleStatus(article.id, article.status)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      article.status === 'published'
                        ? 'border border-slate-200 text-slate-500 hover:bg-slate-50'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {article.status === 'published' ? 'Taslağa Al' : 'Yayınla'}
                  </button>
                  <Link
                    href={`/admin/pages/${article.id}`}
                    className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-colors"
                  >
                    Düzenle
                  </Link>
                  <button
                    onClick={() => handleDelete(article.id, article.title)}
                    className="rounded-lg border border-red-200 p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                    title="Sil"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info box */}
      <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
        <p className="text-xs font-semibold text-blue-700 mb-1">💡 Detaylı Düzenleme</p>
        <p className="text-xs text-blue-600">
          Her makale için <strong>Düzenle</strong> butonuna tıklayarak blok editörüne geçebilirsiniz.
          Başlık, alt başlık, görsel, alıntı, liste gibi zengin içerik blokları ekleyebilirsiniz.
        </p>
      </div>
    </div>
  );
}
