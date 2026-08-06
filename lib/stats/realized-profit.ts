import { getPlayerSummaries } from "@/lib/session/services/session-engine";
import type { Session, SessionEvent } from "@/lib/session/types";
import { computeTournamentSummary } from "@/lib/tournament/tournament-engine";

export interface RealizedProfit {
  playerId: string;
  playerName: string;
  // Null when the session was marked completed without this player's
  // result being knowable yet -- a tournament that ended before they
  // were eliminated or won. Callers should exclude these from
  // aggregates rather than treat them as a loss.
  profit: number | null;
}

// The actual realized profit for every player in a session. For cash
// games this is the plain buy-in/cash-out ledger. Tournament players
// never get a cash_out event -- their money only "leaves the table"
// via the prize pool payout computed by the tournament engine -- so
// using the raw ledger there would show every entrant (including the
// winner) as having lost their full buy-in.
export function computeRealizedProfits(
  session: Session,
  events: SessionEvent[],
): RealizedProfit[] {
  const summaries = getPlayerSummaries(events);

  if (session.type !== "tournament") {
    return summaries.map((s) => ({
      playerId: s.playerId,
      playerName: s.playerName,
      profit: s.cashOutTotal - s.buyInTotal,
    }));
  }

  const payoutByPlayerId = new Map(
    computeTournamentSummary(events).standings.map((standing) => [
      standing.playerId,
      standing.payout,
    ]),
  );

  return summaries.map((s) => ({
    playerId: s.playerId,
    playerName: s.playerName,
    profit: payoutByPlayerId.has(s.playerId)
      ? payoutByPlayerId.get(s.playerId)! - s.buyInTotal
      : null,
  }));
}

export function computeRealizedProfitForPlayer(
  session: Session,
  events: SessionEvent[],
  playerId: string,
): number | null {
  return (
    computeRealizedProfits(session, events).find((p) => p.playerId === playerId)?.profit ?? null
  );
}
