import { db } from "../database";
import type { Player, PlayerProfileFields } from "@/lib/session/types";
import { generateId } from "@/lib/session/services/session-engine";

export class PlayerRepository {
  async getAll(): Promise<Player[]> {
    return db.players.orderBy("name").toArray();
  }

  async getById(id: string): Promise<Player | undefined> {
    return db.players.get(id);
  }

  async getByIds(ids: string[]): Promise<Player[]> {
    return db.players.where("id").anyOf(ids).toArray();
  }

  async create(name: string, nickname = ""): Promise<Player> {
    const now = new Date().toISOString();
    const player: Player = {
      id: generateId(),
      name: name.trim(),
      nickname: nickname.trim() || name.trim(),
      createdAt: now,
      updatedAt: now,
    };
    await db.players.add(player);
    return player;
  }

  async update(id: string, partial: Partial<PlayerProfileFields>): Promise<Player> {
    const existing = await this.getById(id);
    if (!existing) throw new Error("Player not found");

    const updated: Player = {
      ...existing,
      ...partial,
      updatedAt: new Date().toISOString(),
    };
    await db.players.put(updated);
    return updated;
  }

  async count(): Promise<number> {
    return db.players.count();
  }

  async remove(id: string): Promise<void> {
    await db.players.delete(id);
  }
}

export const playerRepository = new PlayerRepository();
