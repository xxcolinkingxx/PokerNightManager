import type { BlindStructure, ChipSet } from "./types";

export const DEFAULT_CHIP_SET: ChipSet = {
  id: "default",
  name: "Standard Set",
  isDefault: true,
  chips: [
    { color: "#F5F5F5", value: 1, label: "White" },
    { color: "#E74C3C", value: 5, label: "Red" },
    { color: "#2ECC71", value: 25, label: "Green" },
    { color: "#3498DB", value: 50, label: "Blue" },
    { color: "#090909", value: 100, label: "Black" },
  ],
};

export const DEFAULT_BLIND_STRUCTURE: BlindStructure = {
  id: "default",
  name: "Standard Home Game",
  isDefault: true,
  levels: [
    { level: 1, smallBlind: 1, bigBlind: 2, ante: 0, durationMinutes: 20 },
    { level: 2, smallBlind: 2, bigBlind: 4, ante: 0, durationMinutes: 20 },
    { level: 3, smallBlind: 3, bigBlind: 6, ante: 0, durationMinutes: 20 },
    { level: 4, smallBlind: 5, bigBlind: 10, ante: 0, durationMinutes: 20 },
    { level: 5, smallBlind: 10, bigBlind: 20, ante: 0, durationMinutes: 20 },
    { level: 6, smallBlind: 15, bigBlind: 30, ante: 0, durationMinutes: 20 },
    { level: 7, smallBlind: 25, bigBlind: 50, ante: 0, durationMinutes: 20 },
  ],
};

export const CHIP_SETS: ChipSet[] = [DEFAULT_CHIP_SET];

export const BLIND_STRUCTURES: BlindStructure[] = [DEFAULT_BLIND_STRUCTURE];

export const WIZARD_STEPS = [
  { id: "details" as const, label: "Details", number: 1 },
  { id: "game-type" as const, label: "Game Type", number: 2 },
  { id: "stakes" as const, label: "Stakes", number: 3 },
  { id: "chip-set" as const, label: "Chip Set", number: 4 },
  { id: "blinds" as const, label: "Blinds", number: 5 },
  { id: "players" as const, label: "Players", number: 6 },
  { id: "summary" as const, label: "Summary", number: 7 },
];
