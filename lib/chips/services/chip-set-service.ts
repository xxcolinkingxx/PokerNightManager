import { initializeDatabase } from "@/lib/db/database";
import { chipSetRepository } from "@/lib/db/repositories/chip-set-repository";
import { sessionRepository } from "@/lib/db/repositories/session-repository";
import type { ChipSet } from "@/lib/session/types";

export class ChipSetService {
  async listChipSets(): Promise<ChipSet[]> {
    // Unlike players/sessions (which start legitimately empty), chip sets
    // are seeded with a default row. A page can mount and call this before
    // the root bootstrap's initializeDatabase() has finished seeding on a
    // fresh profile, since each page's load effect fires independently.
    // initializeDatabase() is cheap to re-await once already seeded.
    await initializeDatabase();
    return chipSetRepository.getAll();
  }

  async createChipSet(data: Pick<ChipSet, "name" | "chips">): Promise<ChipSet> {
    return chipSetRepository.create(data);
  }

  async updateChipSet(
    id: string,
    partial: Partial<Pick<ChipSet, "name" | "chips">>,
  ): Promise<ChipSet> {
    return chipSetRepository.update(id, partial);
  }

  async removeChipSet(id: string): Promise<void> {
    const all = await chipSetRepository.getAll();
    if (all.length <= 1) {
      throw new Error("You need at least one chip set");
    }

    const activeSession = await sessionRepository.getActive();
    if (activeSession && activeSession.chipSetId === id) {
      throw new Error("Can't delete the chip set your active session is using");
    }

    await chipSetRepository.remove(id);
  }
}

export const chipSetService = new ChipSetService();
