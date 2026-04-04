'use client';
import { useSiteSettings } from './use-site-settings';

export function usePageContent<T extends object>(settingsKey: string, defaults: T): T {
  const s = useSiteSettings();
  try {
    const raw = (s as Record<string, unknown>)[settingsKey];
    if (raw && typeof raw === 'string') {
      const parsed = JSON.parse(raw);
      return deepMerge(defaults, parsed);
    }
  } catch {}
  return defaults;
}

function deepMerge<T extends object>(defaults: T, overrides: Partial<T>): T {
  const result = { ...defaults };
  for (const key in overrides) {
    const val = overrides[key];
    if (val !== null && val !== undefined && val !== '') {
      (result as any)[key] = val;
    }
  }
  return result;
}
