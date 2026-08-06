import { create } from "zustand";

import { blindStructureService } from "@/lib/blinds/services/blind-structure-service";
import type { BlindStructure } from "@/lib/session/types";

interface BlindStructureStoreState {
  blindStructures: BlindStructure[];
  isLoading: boolean;
  loadBlindStructures: () => Promise<void>;
  createBlindStructure: (
    data: Pick<BlindStructure, "name" | "levels">,
  ) => Promise<BlindStructure>;
  updateBlindStructure: (
    id: string,
    partial: Partial<Pick<BlindStructure, "name" | "levels">>,
  ) => Promise<BlindStructure>;
  removeBlindStructure: (id: string) => Promise<void>;
}

export const useBlindStructureStore = create<BlindStructureStoreState>((set) => ({
  blindStructures: [],
  isLoading: false,

  loadBlindStructures: async () => {
    set({ isLoading: true });
    const blindStructures = await blindStructureService.listBlindStructures();
    set({ blindStructures, isLoading: false });
  },

  createBlindStructure: async (data) => {
    const structure = await blindStructureService.createBlindStructure(data);
    set((state) => ({
      blindStructures: [...state.blindStructures, structure].sort((a, b) =>
        a.name.localeCompare(b.name),
      ),
    }));
    return structure;
  },

  updateBlindStructure: async (id, partial) => {
    const updated = await blindStructureService.updateBlindStructure(id, partial);
    set((state) => ({
      blindStructures: state.blindStructures
        .map((s) => (s.id === id ? updated : s))
        .sort((a, b) => a.name.localeCompare(b.name)),
    }));
    return updated;
  },

  removeBlindStructure: async (id) => {
    await blindStructureService.removeBlindStructure(id);
    set((state) => ({
      blindStructures: state.blindStructures.filter((s) => s.id !== id),
    }));
  },
}));
