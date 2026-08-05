import Dexie, { type EntityTable } from "dexie";

import type { AppSettings } from "./types";

class PokerNightDatabase extends Dexie {
  settings!: EntityTable<AppSettings, "id">;

  constructor() {
    super("PokerNightManager");

    this.version(1).stores({
      settings: "id",
    });
  }
}

export const db = new PokerNightDatabase();

export async function initializeDatabase(): Promise<void> {
  const existing = await db.settings.get("default");

  if (!existing) {
    const now = new Date().toISOString();
    await db.settings.add({
      id: "default",
      hostName: "",
      defaultLocation: "",
      hapticsEnabled: true,
      createdAt: now,
      updatedAt: now,
    });
  }
}
