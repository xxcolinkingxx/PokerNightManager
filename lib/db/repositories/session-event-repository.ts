import { db } from "../database";
import type {
  SessionEvent,
  SessionEventPayloads,
  SessionEventType,
} from "@/lib/session/types";
import { generateId } from "@/lib/session/services/session-engine";

export class SessionEventRepository {
  async getBySessionId(sessionId: string): Promise<SessionEvent[]> {
    return db.sessionEvents
      .where("sessionId")
      .equals(sessionId)
      .sortBy("sequence");
  }

  async getNextSequence(sessionId: string): Promise<number> {
    const events = await this.getBySessionId(sessionId);
    if (events.length === 0) return 1;
    return events[events.length - 1].sequence + 1;
  }

  async append<T extends SessionEventType>(
    sessionId: string,
    type: T,
    payload: SessionEventPayloads[T],
  ): Promise<SessionEvent<T>> {
    // `type` and `payload` are correlated via T, but TypeScript can't prove
    // that correlation against the distributed SessionEvent<T> union at a
    // generic construction site — this cast is sound by the signature above.
    const event = {
      id: generateId(),
      sessionId,
      type,
      payload,
      timestamp: new Date().toISOString(),
      sequence: await this.getNextSequence(sessionId),
    } as SessionEvent<T>;
    await db.sessionEvents.add(event);
    return event;
  }
}

export const sessionEventRepository = new SessionEventRepository();
