import Dexie, { type EntityTable } from "dexie";

import type { AppSettings } from "./types";
import type { Player, Session, SessionEvent } from "@/lib/session/types";

class PokerNightDatabase extends Dexie {
  settings!: EntityTable<AppSettings, "id">;
  players!: EntityTable<Player, "id">;
  sessions!: EntityTable<Session, "id">;
  sessionEvents!: EntityTable<SessionEvent, "id">;

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
  }
}

export const db = new PokerNightDatabase();

export async function initializeDatabase(): Promise<void> {
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
