import { db } from "../database";
import type { Session, SessionStatus } from "@/lib/session/types";
import { generateId } from "@/lib/session/services/session-engine";

export class SessionRepository {
  async getAll(): Promise<Session[]> {
    return db.sessions.orderBy("createdAt").reverse().toArray();
  }

  async getById(id: string): Promise<Session | undefined> {
    return db.sessions.get(id);
  }

  async getActive(): Promise<Session | undefined> {
    return db.sessions.where("status").equals("active").first();
  }

  async getByStatus(status: SessionStatus): Promise<Session[]> {
    return db.sessions.where("status").equals(status).toArray();
  }

  async create(
    data: Omit<
      Session,
      "id" | "status" | "startedAt" | "endedAt" | "createdAt" | "updatedAt"
    >,
  ): Promise<Session> {
    const now = new Date().toISOString();
    const session: Session = {
      ...data,
      id: generateId(),
      status: "draft",
      startedAt: null,
      endedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    await db.sessions.add(session);
    return session;
  }

  async update(
    id: string,
    partial: Partial<
      Pick<
        Session,
        | "status"
        | "startedAt"
        | "endedAt"
        | "name"
        | "host"
        | "location"
        | "playerIds"
      >
    >,
  ): Promise<Session> {
    const existing = await this.getById(id);
    if (!existing) throw new Error("Session not found");

    const updated: Session = {
      ...existing,
      ...partial,
      updatedAt: new Date().toISOString(),
    };
    await db.sessions.put(updated);
    return updated;
  }
}

export const sessionRepository = new SessionRepository();
