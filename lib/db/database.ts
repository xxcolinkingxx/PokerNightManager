import Dexie, { type EntityTable } from "dexie";

import type { AppSettings } from "./types";
import { DEFAULT_CHIP_DENOMINATIONS } from "@/lib/session/constants";
import type {
  ChipSet,
  Player,
  Session,
  SessionEvent,
  SessionTemplate,
} from "@/lib/session/types";

class PokerNightDatabase extends Dexie {
  settings!: EntityTable<AppSettings, "id">;
  players!: EntityTable<Player, "id">;
  sessions!: EntityTable<Session, "id">;
  sessionEvents!: EntityTable<SessionEvent, "id">;
  chipSets!: EntityTable<ChipSet, "id">;
  sessionTemplates!: EntityTable<SessionTemplate, "id">;

  constructor() {
    super("PokerNightManager");

    this.version(1).stores({
      settings: "id",
    });

    this.version(2).stores({
      settings: "id",
      players: "id, name, updatedAt",
      sessions: "id, status, createdAt, updatedAt",
      sessionEvents: "id, sessionId, sequence, timestamp, type",
    });

    this.version(3).stores({
      settings: "id",
      players: "id, name, updatedAt",
      sessions: "id, status, createdAt, updatedAt",
      sessionEvents: "id, sessionId, sequence, timestamp, type",
      chipSets: "id, name, isDefault, updatedAt",
    });

    this.version(4).stores({
      settings: "id",
      players: "id, name, updatedAt",
      sessions: "id, status, createdAt, updatedAt",
      sessionEvents: "id, sessionId, sequence, timestamp, type",
      chipSets: "id, name, isDefault, updatedAt",
      sessionTemplates: "id, templateName, updatedAt",
    });
  }
}

export const db = new PokerNightDatabase();

export async function initializeDatabase(): Promise<void> {
  await Promise.all([seedDefaultSettings(), seedDefaultChipSet()]);
}

async function seedDefaultSettings(): Promise<void> {
  const existing = await db.settings.get("default");
  if (existing) return;

  const now = new Date().toISOString();
  try {
    await db.settings.add({
      id: "default",
      hostName: "",
      defaultLocation: "",
      hapticsEnabled: true,
      createdAt: now,
      updatedAt: now,
    });
  } catch (error) {
    // Two callers can both pass the `existing` check before either commits
    // (e.g. React effects double-invoking in dev) — the loser's add() races
    // harmlessly against the winner's, so a duplicate-key error here just
    // means the default row already exists, which is what we wanted anyway.
    if (error instanceof Error && error.name === "ConstraintError") return;
    throw error;
  }
}

async function seedDefaultChipSet(): Promise<void> {
  const existing = await db.chipSets.get("default");
  if (existing) return;

  const now = new Date().toISOString();
  try {
    await db.chipSets.add({
      id: "default",
      name: "Standard Set",
      isDefault: true,
      chips: DEFAULT_CHIP_DENOMINATIONS.map((chip) => ({ ...chip, quantityOwned: 0 })),
      createdAt: now,
      updatedAt: now,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "ConstraintError") return;
    throw error;
  }
}
