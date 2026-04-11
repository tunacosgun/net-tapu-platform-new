'use client';

import { useState, useEffect, useCallback } from 'react';

const KEY = 'nt_recent_searches';
const MAX = 5;

function readFromStorage(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeToStorage(searches: string[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEY, JSON.stringify(searches));
  } catch {}
}

export function useRecentSearches() {
  const [searches, setSearches] = useState<string[]>([]);

  useEffect(() => {
    setSearches(readFromStorage());

    function onStorage(e: StorageEvent) {
      if (e.key === KEY) setSearches(readFromStorage());
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const save = useCallback((q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setSearches((prev) => {
      const next = [trimmed, ...prev.filter((s) => s !== trimmed)].slice(0, MAX);
      writeToStorage(next);
      return next;
    });
  }, []);

  const remove = useCallback((q: string) => {
    setSearches((prev) => {
      const next = prev.filter((s) => s !== q);
      writeToStorage(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    writeToStorage([]);
    setSearches([]);
  }, []);

  return { searches, save, remove, clear };
}
