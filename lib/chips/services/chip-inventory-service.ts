import { sessionEventRepository } from "@/lib/db/repositories/session-event-repository";
import { sessionRepository } from "@/lib/db/repositories/session-repository";
import { computePot, getPlayerSummaries } from "@/lib/session/services/session-engine";

// Chips "in play" = the real dollar total currently sitting in front of
// active players plus the pot, for whatever active session(s) use this
// chip set. There's normally at most one active session (the app only
// allows one at a time), but this stays correct if that ever changes.
export async function getInPlayAmountForChipSet(chipSetId: string): Promise<number> {
  const activeSessions = await sessionRepository.getByStatus("active");
  const relevantSessions = activeSessions.filter((session) => session.chipSetId === chipSetId);

  let total = 0;
  for (const session of relevantSessions) {
    const events = await sessionEventRepository.getBySessionId(session.id);
    const players = getPlayerSummaries(events);
    const playersTotal = players
      .filter((player) => !player.isCashedOut)
      .reduce((sum, player) => sum + player.total, 0);
    total += playersTotal + computePot(events);
  }

  return total;
}
