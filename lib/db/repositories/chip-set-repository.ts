import { db } from "../database";
import type { ChipSet } from "@/lib/session/types";
import { generateId } from "@/lib/session/services/session-engine";

export class ChipSetRepository {
  async getAll(): Promise<ChipSet[]> {
    return db.chipSets.orderBy("name").toArray();
  }

  async getById(id: string): Promise<ChipSet | undefined> {
    return db.chipSets.get(id);
  }

  async create(data: Pick<ChipSet, "name" | "chips">): Promise<ChipSet> {
    const now = new Date().toISOString();
    const chipSet: ChipSet = {
      id: generateId(),
      name: data.name,
      chips: data.chips,
      isDefault: false,
      createdAt: now,
      updatedAt: now,
    };
    await db.chipSets.add(chipSet);
    return chipSet;
  }

  async update(
    id: string,
    partial: Partial<Pick<ChipSet, "name" | "chips">>,
  ): Promise<ChipSet> {
    const existing = await this.getById(id);
    if (!existing) throw new Error("Chip set not found");

    const updated: ChipSet = {
      ...existing,
      ...partial,
      updatedAt: new Date().toISOString(),
    };
    await db.chipSets.put(updated);
    return updated;
  }

  async remove(id: string): Promise<void> {
    await db.chipSets.delete(id);
  }
}

export const chipSetRepository = new ChipSetRepository();
