'use client';

import { useEffect, useRef, useState } from 'react';
import { Mail, X, ChevronDown, Loader2 } from 'lucide-react';
import apiClient from '@/lib/api-client';

type UserRow = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
};

type Props = {
  label?: string;
  placeholder?: string;
  /** Selected email (or empty string for none) */
  value: string;
  onChange: (email: string) => void;
  testId?: string;
};

/** Admin autocomplete: type any prefix of name/email; backend searches across both. */
export function UserAutocomplete({ label, placeholder, value, onChange, testId }: Props) {
  const [input, setInput] = useState(value);
  const [results, setResults] = useState<UserRow[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setInput(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchResults = (q: string) => {
    setLoading(true);
    apiClient
      .get<{ data: UserRow[] }>('/admin/users', { params: { search: q || undefined, limit: 15 } })
      .then((res) => {
        const list = Array.isArray((res.data as any).data) ? (res.data as any).data : [];
        setResults(list);
      })
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  };

  const handleInputChange = (val: string) => {
    setInput(val);
    setOpen(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchResults(val), 220);
  };

  const handleSelect = (user: UserRow) => {
    setInput(user.email);
    onChange(user.email);
    setOpen(false);
  };

  const handleFocus = () => {
    setOpen(true);
    if (results.length === 0) fetchResults(input);
  };

  const handleClear = () => {
    setInput('');
    onChange('');
    setResults([]);
    setOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      {label && (
        <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={input}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={handleFocus}
          placeholder={placeholder || 'İsim veya e-posta yazın...'}
          className="w-full pl-9 pr-9 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-ink-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
          data-testid={testId}
          autoComplete="off"
        />
        {input ? (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
            aria-label="Temizle"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : loading ? (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 animate-spin" />
        ) : (
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        )}
      </div>

      {open && (
        <div className="absolute z-50 left-0 right-0 mt-1 max-h-72 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg">
          {loading ? (
            <div className="px-3 py-3 text-sm text-slate-500 flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Aranıyor...
            </div>
          ) : results.length === 0 ? (
            <div className="px-3 py-3 text-sm text-slate-500">Sonuç yok</div>
          ) : (
            results.map((u) => {
              const fullName = `${u.firstName || ''} ${u.lastName || ''}`.trim();
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleSelect(u)}
                  className="w-full text-left px-3 py-2 hover:bg-emerald-50 transition-colors block"
                >
                  <div className="text-sm font-medium text-ink-900">{fullName || u.email}</div>
                  {fullName && <div className="text-xs text-slate-500">{u.email}</div>}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
