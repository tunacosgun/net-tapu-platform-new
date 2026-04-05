import { create } from 'zustand';
import apiClient from '../api/client';

export interface SiteSettings {
  site_logo?: string;
  site_favicon?: string;
  watermark_logo?: string;
  site_title?: string;
  site_description?: string;
  contact_phone?: string;
  contact_email?: string;
  whatsapp_number?: string;
  [key: string]: string | undefined;
}

interface SettingsState {
  settings: SiteSettings;
  isLoading: boolean;
  fetchSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: {},
  isLoading: true,
  fetchSettings: async () => {
    try {
      const { data } = await apiClient.get<SiteSettings>('/content/site-settings');
      set({ settings: data || {}, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },
}));
