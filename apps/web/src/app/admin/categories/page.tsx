'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Edit2, Trash2, ChevronDown, ChevronRight, Folder, FolderOpen, Save, X } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { showApiError } from '@/components/api-error-toast';
import { PageHeader, Button, Card } from '@/components/ui';

type CategoryNode = {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  children: CategoryNode[];
};

export default function AdminCategoriesPage() {
  const [tree, setTree] = useState<CategoryNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<CategoryNode | null>(null);
  const [creatingUnder, setCreatingUnder] = useState<{ parentId: string | null; parentName: string } | null>(null);

  const fetchTree = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get<CategoryNode[]>('/admin/categories/tree?includeInactive=true');
      setTree(data);
      // Expand all top level
      setExpanded(new Set(data.map((n) => n.id)));
    } catch (err) {
      showApiError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTree(); }, [fetchTree]);

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleDelete(node: CategoryNode) {
    if (!confirm(`"${node.name}" kategorisini ve TÜM alt kategorilerini silmek istediğinize emin misiniz?\n\nİlanlardaki kategori atamaları kaldırılacak ama ilanlar silinmeyecek.`)) return;
    try {
      await apiClient.delete(`/admin/categories/${node.id}`);
      fetchTree();
    } catch (err) {
      showApiError(err);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kategoriler"
        subtitle="Sahibinden tarzı hiyerarşik kategori ağacı. İlanlar bu kategorilere atanır ve filtrelenir."
        actions={
          <Button onClick={() => setCreatingUnder({ parentId: null, parentName: 'Üst seviye' })}>
            <Plus className="h-4 w-4" /> Yeni Kök Kategori
          </Button>
        }
      />

      <Card className="p-4">
        {loading ? (
          <p className="py-6 text-center text-sm text-slate-500">Yükleniyor...</p>
        ) : tree.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">Henüz kategori yok. "Yeni Kök Kategori" ile başlayın.</p>
        ) : (
          <Tree
            nodes={tree}
            depth={0}
            expanded={expanded}
            onToggle={toggle}
            onEdit={setEditing}
            onAddChild={(parent) => setCreatingUnder({ parentId: parent.id, parentName: parent.name })}
            onDelete={handleDelete}
          />
        )}
      </Card>

      {(editing || creatingUnder) && (
        <CategoryModal
          editing={editing}
          parentId={creatingUnder?.parentId ?? null}
          parentName={creatingUnder?.parentName}
          onClose={() => { setEditing(null); setCreatingUnder(null); }}
          onSaved={() => { setEditing(null); setCreatingUnder(null); fetchTree(); }}
        />
      )}
    </div>
  );
}

function Tree({
  nodes, depth, expanded, onToggle, onEdit, onAddChild, onDelete,
}: {
  nodes: CategoryNode[];
  depth: number;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  onEdit: (n: CategoryNode) => void;
  onAddChild: (parent: CategoryNode) => void;
  onDelete: (n: CategoryNode) => void;
}) {
  return (
    <ul className="space-y-1">
      {nodes.map((node) => {
        const isOpen = expanded.has(node.id);
        const hasChildren = node.children.length > 0;
        return (
          <li key={node.id}>
            <div
              className="group flex items-center gap-2 px-2 py-2 rounded hover:bg-slate-50 transition-colors"
              style={{ paddingLeft: `${depth * 20 + 8}px` }}
            >
              {hasChildren ? (
                <button onClick={() => onToggle(node.id)} className="flex h-5 w-5 items-center justify-center text-slate-500">
                  {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
              ) : (
                <span className="w-5" />
              )}
              {hasChildren ? (
                isOpen ? <FolderOpen className="h-4 w-4 text-amber-500" /> : <Folder className="h-4 w-4 text-amber-500" />
              ) : (
                <span className="w-4 h-4 flex items-center justify-center"><span className="w-2 h-2 rounded-full bg-emerald-400" /></span>
              )}
              <div className="flex-1 flex items-center gap-2">
                <span className={`text-sm font-medium ${!node.isActive ? 'line-through text-slate-400' : 'text-ink-900'}`}>{node.name}</span>
                <span className="text-xs text-slate-400 font-mono">/{node.slug}</span>
                {!node.isActive && <span className="text-[10px] uppercase font-bold text-rose-500">pasif</span>}
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => onAddChild(node)}
                  className="p-1.5 rounded text-slate-500 hover:bg-emerald-100 hover:text-emerald-700"
                  title="Alt kategori ekle"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => onEdit(node)}
                  className="p-1.5 rounded text-slate-500 hover:bg-slate-100"
                  title="Düzenle"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => onDelete(node)}
                  className="p-1.5 rounded text-slate-500 hover:bg-rose-100 hover:text-rose-700"
                  title="Sil"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            {hasChildren && isOpen && (
              <Tree
                nodes={node.children}
                depth={depth + 1}
                expanded={expanded}
                onToggle={onToggle}
                onEdit={onEdit}
                onAddChild={onAddChild}
                onDelete={onDelete}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}

function CategoryModal({
  editing,
  parentId,
  parentName,
  onClose,
  onSaved,
}: {
  editing: CategoryNode | null;
  parentId: string | null;
  parentName?: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(editing?.name || '');
  const [slug, setSlug] = useState(editing?.slug || '');
  const [description, setDescription] = useState(editing?.description || '');
  const [sortOrder, setSortOrder] = useState(editing?.sortOrder ?? 0);
  const [isActive, setIsActive] = useState(editing?.isActive ?? true);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const body = {
        name: name.trim(),
        slug: slug.trim() || undefined,
        description: description.trim() || undefined,
        sortOrder,
        isActive,
        ...(editing ? {} : { parentId }),
      };
      if (editing) {
        await apiClient.patch(`/admin/categories/${editing.id}`, body);
      } else {
        await apiClient.post('/admin/categories', body);
      }
      onSaved();
    } catch (err) {
      showApiError(err);
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
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-ink-900">
            {editing ? 'Kategori Düzenle' : `Yeni Kategori${parentName ? ` (${parentName} altında)` : ''}`}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1.5">Ad *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="örn: Arsa, Tarla, Konut"
              required
              className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1.5">Slug (URL)</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-'))}
              placeholder="otomatik üretilir"
              className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1.5">Açıklama</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1.5">Sıra No</label>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm"
              />
            </div>
            <label className="flex items-center gap-2 mt-6">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-emerald-600"
              />
              <span className="text-sm text-slate-700">Aktif</span>
            </label>
          </div>

          <div className="flex gap-2 pt-3 border-t border-slate-200">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>İptal</Button>
            <Button type="submit" className="flex-1" disabled={saving || !name.trim()}>
              {saving ? 'Kaydediliyor...' : (<><Save className="h-4 w-4" />Kaydet</>)}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
