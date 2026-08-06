import { sessionEventRepository } from "@/lib/db/repositories/session-event-repository";
import { sessionRepository } from "@/lib/db/repositories/session-repository";
import type { SessionWithEvents } from "@/lib/session/types";

export async function getAllSessionsWithEvents(): Promise<SessionWithEvents[]> {
  const sessions = await sessionRepository.getAll();
  return Promise.all(
    sessions.map(async (session) => ({
      session,
      events: await sessionEventRepository.getBySessionId(session.id),
    })),
  );
}
