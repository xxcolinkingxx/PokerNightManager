import type { BlindStructure, ChipDefinition, PaymentMethod } from "./types";

export const PAYMENT_METHODS: PaymentMethod[] = [
  "cash",
  "venmo",
  "cash_app",
  "apple_cash",
  "zelle",
];

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  cash: "Cash",
  venmo: "Venmo",
  cash_app: "Cash App",
  apple_cash: "Apple Cash",
  zelle: "Zelle",
};

// Seed denominations for the default chip set created on first run.
// quantityOwned is deliberately not included here -- how many chips
// someone actually owns is never a default, it's set in the chip
// set editor.
export const DEFAULT_CHIP_DENOMINATIONS: Array<Omit<ChipDefinition, "quantityOwned">> = [
  { color: "#F5F5F5", value: 1, label: "White" },
  { color: "#E74C3C", value: 5, label: "Red" },
  { color: "#2ECC71", value: 25, label: "Green" },
  { color: "#3498DB", value: 50, label: "Blue" },
  { color: "#090909", value: 100, label: "Black" },
];

// A palette of common physical poker chip colors, offered as quick-pick
// swatches when editing a chip set's denominations.
export const CHIP_COLOR_PALETTE: string[] = [
  "#F5F5F5",
  "#E74C3C",
  "#2ECC71",
  "#3498DB",
  "#090909",
  "#9B59B6",
  "#F1C40F",
  "#E67E22",
  "#EC407A",
  "#1ABC9C",
];

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

// A gentler, sub-dollar progression for lower-stakes home games (e.g. a
// 0.25/0.50 start) -- seeded alongside the standard structure so there's
// a sensible option out of the box, on top of whatever custom structures
// get created in Settings.
export const MICRO_STAKES_BLIND_STRUCTURE: BlindStructure = {
  id: "micro-stakes",
  name: "Micro Stakes",
  isDefault: false,
  levels: [
    { level: 1, smallBlind: 0.25, bigBlind: 0.5, ante: 0, durationMinutes: 20 },
    { level: 2, smallBlind: 0.5, bigBlind: 1, ante: 0, durationMinutes: 20 },
    { level: 3, smallBlind: 1, bigBlind: 2, ante: 0, durationMinutes: 20 },
    { level: 4, smallBlind: 2, bigBlind: 4, ante: 0, durationMinutes: 20 },
    { level: 5, smallBlind: 3, bigBlind: 6, ante: 0, durationMinutes: 20 },
  ],
};

export const WIZARD_STEPS = [
  { id: "details" as const, label: "Details", number: 1 },
  { id: "game-type" as const, label: "Game Type", number: 2 },
  { id: "stakes" as const, label: "Stakes", number: 3 },
  { id: "chip-set" as const, label: "Chip Set", number: 4 },
  { id: "blinds" as const, label: "Blinds", number: 5 },
  { id: "players" as const, label: "Players", number: 6 },
  { id: "summary" as const, label: "Summary", number: 7 },
];
