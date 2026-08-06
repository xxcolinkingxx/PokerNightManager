import { getAllSessionsWithEvents } from "@/lib/session/services/session-history-service";
import { computeHeadToHead, type HeadToHeadStats } from "@/lib/players/head-to-head";

export async function getHeadToHeadStats(
  playerAId: string,
  playerBId: string,
): Promise<HeadToHeadStats> {
  const allSessions = await getAllSessionsWithEvents();
  const shared = allSessions.filter(
    ({ session }) => session.playerIds.includes(playerAId) && session.playerIds.includes(playerBId),
  );

  return computeHeadToHead(playerAId, playerBId, shared);
}
