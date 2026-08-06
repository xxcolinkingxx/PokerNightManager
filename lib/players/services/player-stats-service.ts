import { sessionEventRepository } from "@/lib/db/repositories/session-event-repository";
import { sessionRepository } from "@/lib/db/repositories/session-repository";
import { computePlayerStats, type PlayerStats } from "@/lib/players/player-stats";

export async function getPlayerStats(playerId: string): Promise<PlayerStats> {
  const allSessions = await sessionRepository.getAll();
  const relevantSessions = allSessions.filter((session) => session.playerIds.includes(playerId));

  const sessionsWithEvents = await Promise.all(
    relevantSessions.map(async (session) => ({
      session,
      events: await sessionEventRepository.getBySessionId(session.id),
    })),
  );

  return computePlayerStats(playerId, sessionsWithEvents);
}
