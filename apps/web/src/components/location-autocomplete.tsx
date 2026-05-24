'use client';

import { useEffect, useRef, useState } from 'react';
import { MapPin, X, ChevronDown } from 'lucide-react';
import apiClient from '@/lib/api-client';

type Props = {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  /** 'city' lists all cities; 'district' requires city; 'neighborhood' requires both */
  type: 'city' | 'district' | 'neighborhood';
  city?: string;
  district?: string;
  disabled?: boolean;
  testId?: string;
};

export function LocationAutocomplete({
  label,
  placeholder,
  value,
  onChange,
  type,
  city,
  district,
  disabled,
  testId,
}: Props) {
  const [input, setInput] = useState(value);
  const [results, setResults] = useState<string[]>([]);
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
    if (disabled) return;
    if (type === 'district' && !city) return;
    if (type === 'neighborhood' && (!city || !district)) return;

    setLoading(true);
    const params: Record<string, string | number> = { limit: 15 };
    if (q.trim()) params.q = q.trim();
    if (type === 'district' && city) params.city = city;
    if (type === 'neighborhood' && city && district) {
      params.city = city;
      params.district = district;
    }

    const endpoint =
      type === 'city'
        ? '/locations/cities'
        : type === 'district'
        ? '/locations/districts'
        : '/locations/neighborhoods';

    apiClient
      .get<string[]>(endpoint, { params })
      .then((res) => setResults(res.data))
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  };

  const handleInputChange = (val: string) => {
    setInput(val);
    setOpen(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchResults(val), 180);
  };

  const handleFocus = () => {
    setOpen(true);
    if (results.length === 0) fetchResults(input);
  };

  const handleSelect = (val: string) => {
    setInput(val);
    onChange(val);
    setOpen(false);
  };

  const handleClear = () => {
    setInput('');
    onChange('');
    setResults([]);
    setOpen(false);
  };

  const isDisabled =
    disabled ||
    (type === 'district' && !city) ||
    (type === 'neighborhood' && (!city || !district));

  return (
    <div className="relative" ref={containerRef}>
      {label && (
        <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={input}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={handleFocus}
          placeholder={placeholder || (isDisabled ? 'Önce üst alanı seçin' : 'Yazmaya başlayın...')}
          disabled={isDisabled}
          className="w-full pl-9 pr-9 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-ink-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed transition-all"
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
        ) : (
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        )}
      </div>

      {open && !isDisabled && (
        <div className="absolute z-50 left-0 right-0 mt-1 max-h-64 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg">
          {loading ? (
            <div className="px-3 py-3 text-sm text-slate-500">Yükleniyor...</div>
          ) : results.length === 0 ? (
            <div className="px-3 py-3 text-sm text-slate-500">Sonuç yok</div>
          ) : (
            results.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => handleSelect(r)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-emerald-50 transition-colors ${
                  r === value ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-slate-700'
                }`}
              >
                {r}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
