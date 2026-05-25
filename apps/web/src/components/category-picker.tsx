'use client';

import { useEffect, useState } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen, X } from 'lucide-react';
import apiClient from '@/lib/api-client';

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

type Props = {
  label?: string;
  value: string | null;
  onChange: (id: string | null) => void;
  /** if true, use admin endpoint (includes inactive). default false (public tree) */
  admin?: boolean;
};

/** Sahibinden-style cascading category picker with an inline tree. */
export function CategoryPicker({ label, value, onChange, admin }: Props) {
  const [tree, setTree] = useState<CategoryNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const url = admin ? '/admin/categories/tree' : '/categories/tree';
    apiClient
      .get<CategoryNode[]>(url)
      .then((res) => {
        setTree(res.data);
        // Expand path to currently selected
        if (value) {
          const path = findPath(res.data, value);
          if (path.length > 0) {
            setExpanded(new Set(path.slice(0, -1).map((n) => n.id)));
          }
        } else {
          // Default: expand top-level
          setExpanded(new Set(res.data.map((n) => n.id)));
        }
      })
      .catch(() => setTree([]))
      .finally(() => setLoading(false));
  }, [admin]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedNode = value ? findNode(tree, value) : null;
  const breadcrumb = selectedNode ? buildBreadcrumb(tree, selectedNode.id) : [];

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div>
      {label && (
        <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1.5">{label}</label>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-left focus:outline-none focus:border-emerald-500 hover:border-slate-300"
      >
        <span className={`${selectedNode ? 'text-ink-900' : 'text-slate-400'}`}>
          {selectedNode
            ? breadcrumb.map((b) => b.name).join(' › ')
            : loading ? 'Yükleniyor...' : 'Kategori seçin'}
        </span>
        {selectedNode ? (
          <X
            className="h-4 w-4 text-slate-400 hover:text-slate-700"
            onClick={(e) => { e.stopPropagation(); onChange(null); }}
          />
        ) : (
          <ChevronRight className={`h-4 w-4 text-slate-400 transition-transform ${open ? 'rotate-90' : ''}`} />
        )}
      </button>

      {open && (
        <div className="mt-2 max-h-72 overflow-y-auto rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
          {tree.length === 0 ? (
            <p className="px-3 py-4 text-sm text-slate-500">Kategori yok</p>
          ) : (
            <TreeView
              nodes={tree}
              depth={0}
              expanded={expanded}
              selectedId={value}
              onToggle={toggle}
              onSelect={(id) => { onChange(id); setOpen(false); }}
            />
          )}
        </div>
      )}
    </div>
  );
}

function TreeView({
  nodes, depth, expanded, selectedId, onToggle, onSelect,
}: {
  nodes: CategoryNode[];
  depth: number;
  expanded: Set<string>;
  selectedId: string | null;
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
}) {
  return (
    <ul className="space-y-0.5">
      {nodes.map((node) => {
        const isOpen = expanded.has(node.id);
        const hasChildren = node.children.length > 0;
        const isSelected = selectedId === node.id;
        return (
          <li key={node.id}>
            <div
              className={`flex items-center gap-1 px-2 py-1.5 rounded text-sm cursor-pointer ${
                isSelected ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'hover:bg-slate-50 text-ink-900'
              }`}
              style={{ paddingLeft: `${depth * 14 + 8}px` }}
            >
              {hasChildren ? (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onToggle(node.id); }}
                  className="flex h-4 w-4 items-center justify-center text-slate-500 hover:text-slate-700"
                >
                  {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                </button>
              ) : (
                <span className="w-4" />
              )}
              {hasChildren ? (
                isOpen ? <FolderOpen className="h-4 w-4 text-amber-500" /> : <Folder className="h-4 w-4 text-amber-500" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              )}
              <span onClick={() => onSelect(node.id)} className="flex-1">{node.name}</span>
            </div>
            {hasChildren && isOpen && (
              <TreeView
                nodes={node.children}
                depth={depth + 1}
                expanded={expanded}
                selectedId={selectedId}
                onToggle={onToggle}
                onSelect={onSelect}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}

function findNode(nodes: CategoryNode[], id: string): CategoryNode | null {
  for (const n of nodes) {
    if (n.id === id) return n;
    const found = findNode(n.children, id);
    if (found) return found;
  }
  return null;
}

function findPath(nodes: CategoryNode[], id: string): CategoryNode[] {
  for (const n of nodes) {
    if (n.id === id) return [n];
    const sub = findPath(n.children, id);
    if (sub.length > 0) return [n, ...sub];
  }
  return [];
}

function buildBreadcrumb(tree: CategoryNode[], id: string): CategoryNode[] {
  return findPath(tree, id);
}
