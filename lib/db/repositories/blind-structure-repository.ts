import { db } from "../database";
import type { BlindStructure } from "@/lib/session/types";
import { generateId } from "@/lib/session/services/session-engine";

export class BlindStructureRepository {
  async getAll(): Promise<BlindStructure[]> {
    return db.blindStructures.orderBy("name").toArray();
  }

  async getById(id: string): Promise<BlindStructure | undefined> {
    return db.blindStructures.get(id);
  }

  async create(data: Pick<BlindStructure, "name" | "levels">): Promise<BlindStructure> {
    const structure: BlindStructure = {
      id: generateId(),
      name: data.name,
      levels: data.levels,
      isDefault: false,
    };
    await db.blindStructures.add(structure);
    return structure;
  }

  async update(
    id: string,
    partial: Partial<Pick<BlindStructure, "name" | "levels">>,
  ): Promise<BlindStructure> {
    const existing = await this.getById(id);
    if (!existing) throw new Error("Blind structure not found");

    const updated: BlindStructure = { ...existing, ...partial };
    await db.blindStructures.put(updated);
    return updated;
  }

  async remove(id: string): Promise<void> {
    await db.blindStructures.delete(id);
  }
}

export const blindStructureRepository = new BlindStructureRepository();
