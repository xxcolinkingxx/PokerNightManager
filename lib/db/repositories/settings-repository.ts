import { db } from "../database";
import type { AppSettings } from "../types";

export class SettingsRepository {
  async get(): Promise<AppSettings | undefined> {
    return db.settings.get("default");
  }

  async update(
    partial: Partial<Omit<AppSettings, "id" | "createdAt">>,
  ): Promise<AppSettings> {
    const existing = await this.get();

    if (!existing) {
      throw new Error("Settings not initialized");
    }

    const updated: AppSettings = {
      ...existing,
      ...partial,
      updatedAt: new Date().toISOString(),
    };

    await db.settings.put(updated);
    return updated;
  }
}

export const settingsRepository = new SettingsRepository();
