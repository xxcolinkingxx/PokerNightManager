import { create } from "zustand";

import { playerRepository } from "@/lib/db/repositories/player-repository";
import type { Player } from "@/lib/session/types";

interface PlayerStoreState {
  players: Player[];
  isLoading: boolean;
  loadPlayers: () => Promise<void>;
  addPlayer: (name: string, nickname?: string) => Promise<Player>;
  removePlayer: (id: string) => Promise<void>;
}

export const usePlayerStore = create<PlayerStoreState>((set) => ({
  players: [],
  isLoading: false,

  loadPlayers: async () => {
    set({ isLoading: true });
    const players = await playerRepository.getAll();
    set({ players, isLoading: false });
  },

  addPlayer: async (name, nickname) => {
    const player = await playerRepository.create(name, nickname);
    set((state) => ({
      players: [...state.players, player].sort((a, b) => a.name.localeCompare(b.name)),
    }));
    return player;
  },

  removePlayer: async (id) => {
    await playerRepository.remove(id);
    set((state) => ({ players: state.players.filter((p) => p.id !== id) }));
  },
}));
