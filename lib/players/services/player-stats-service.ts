import { getAllSessionsWithEvents } from "@/lib/session/services/session-history-service";
import { computePlayerStats, type PlayerStats } from "@/lib/players/player-stats";

export async function getPlayerStats(playerId: string): Promise<PlayerStats> {
  const allSessions = await getAllSessionsWithEvents();
  const relevantSessions = allSessions.filter(({ session }) =>
    session.playerIds.includes(playerId),
  );

  return computePlayerStats(playerId, relevantSessions);
}
