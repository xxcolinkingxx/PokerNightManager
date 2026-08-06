import { create } from "zustand";

import { chipSetService } from "@/lib/chips/services/chip-set-service";
import type { ChipSet } from "@/lib/session/types";

interface ChipStoreState {
  chipSets: ChipSet[];
  isLoading: boolean;
  loadChipSets: () => Promise<void>;
  createChipSet: (data: Pick<ChipSet, "name" | "chips">) => Promise<ChipSet>;
  updateChipSet: (
    id: string,
    partial: Partial<Pick<ChipSet, "name" | "chips">>,
  ) => Promise<ChipSet>;
  removeChipSet: (id: string) => Promise<void>;
}

export const useChipStore = create<ChipStoreState>((set) => ({
  chipSets: [],
  isLoading: false,

  loadChipSets: async () => {
    set({ isLoading: true });
    const chipSets = await chipSetService.listChipSets();
    set({ chipSets, isLoading: false });
  },

  createChipSet: async (data) => {
    const chipSet = await chipSetService.createChipSet(data);
    set((state) => ({
      chipSets: [...state.chipSets, chipSet].sort((a, b) => a.name.localeCompare(b.name)),
    }));
    return chipSet;
  },

  updateChipSet: async (id, partial) => {
    const updated = await chipSetService.updateChipSet(id, partial);
    set((state) => ({
      chipSets: state.chipSets
        .map((c) => (c.id === id ? updated : c))
        .sort((a, b) => a.name.localeCompare(b.name)),
    }));
    return updated;
  },

  removeChipSet: async (id) => {
    await chipSetService.removeChipSet(id);
    set((state) => ({ chipSets: state.chipSets.filter((c) => c.id !== id) }));
  },
}));
