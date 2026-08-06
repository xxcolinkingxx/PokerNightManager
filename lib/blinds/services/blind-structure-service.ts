import { initializeDatabase } from "@/lib/db/database";
import { blindStructureRepository } from "@/lib/db/repositories/blind-structure-repository";
import { sessionRepository } from "@/lib/db/repositories/session-repository";
import type { BlindStructure } from "@/lib/session/types";

export class BlindStructureService {
  async listBlindStructures(): Promise<BlindStructure[]> {
    // Same race-safe pattern as chip sets -- structures are seeded with
    // default rows, and a page can call this before the root bootstrap's
    // initializeDatabase() has finished seeding on a fresh profile.
    await initializeDatabase();
    return blindStructureRepository.getAll();
  }

  async createBlindStructure(
    data: Pick<BlindStructure, "name" | "levels">,
  ): Promise<BlindStructure> {
    return blindStructureRepository.create(data);
  }

  async updateBlindStructure(
    id: string,
    partial: Partial<Pick<BlindStructure, "name" | "levels">>,
  ): Promise<BlindStructure> {
    return blindStructureRepository.update(id, partial);
  }

  async removeBlindStructure(id: string): Promise<void> {
    const all = await blindStructureRepository.getAll();
    if (all.length <= 1) {
      throw new Error("You need at least one blind structure");
    }

    const activeSession = await sessionRepository.getActive();
    if (activeSession && activeSession.blindStructureId === id) {
      throw new Error("Can't delete the blind structure your active session is using");
    }

    await blindStructureRepository.remove(id);
  }
}

export const blindStructureService = new BlindStructureService();
