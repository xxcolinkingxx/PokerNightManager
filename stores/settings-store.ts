import { create } from "zustand";

import { settingsRepository } from "@/lib/db/repositories/settings-repository";
import type { AppSettings } from "@/lib/db/types";

interface SettingsState {
  settings: AppSettings | null;
  isLoading: boolean;
  loadSettings: () => Promise<void>;
  updateSettings: (
    partial: Partial<Omit<AppSettings, "id" | "createdAt">>,
  ) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: null,
  isLoading: true,

  loadSettings: async () => {
    set({ isLoading: true });
    const settings = await settingsRepository.get();
    set({ settings: settings ?? null, isLoading: false });
  },

  updateSettings: async (partial) => {
    const updated = await settingsRepository.update(partial);
    set({ settings: updated });
  },
}));
