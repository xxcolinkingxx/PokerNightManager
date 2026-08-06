import { getPlayerSummaries } from "@/lib/session/services/session-engine";
import type { Session, SessionType, SessionWithEvents } from "@/lib/session/types";
import { computeRealizedProfitForPlayer } from "@/lib/stats/realized-profit";

export interface PlayerSessionHistoryEntry {
  sessionId: string;
  sessionName: string;
  date: string;
  status: Session["status"];
  buyInTotal: number;
  cashOutTotal: number;
  // For an in-progress session this is cashOutTotal - buyInTotal, i.e.
  // money currently committed to the table, not a realized result. Once
  // completed, this is the actual realized profit (tournament-aware --
  // see computeRealizedProfitForPlayer) -- null if a completed
  // tournament never recorded this player's finish, so there's nothing
  // honest to show.
  profit: number | null;
}

export interface PlayerStats {
  sessionsPlayed: number;
  totalBuyIn: number;
  averageBuyIn: number;
  favoriteGameType: SessionType | null;
  history: PlayerSessionHistoryEntry[];
  // Everything below is derived from completed sessions only, so an
  // in-progress game's unrealized numbers never leak into lifetime totals.
  completedSessionsCount: number;
  profit: number;
  roi: number | null;
  largestWin: number | null;
  largestLoss: number | null;
}

export function computePlayerStats(
  playerId: string,
  sessionsWithEvents: SessionWithEvents[],
): PlayerStats {
  const history: PlayerSessionHistoryEntry[] = [];
  const gameTypeCounts = new Map<SessionType, number>();
  let totalBuyIn = 0;
  let completedSessionsCount = 0;
  let realizedBuyIn = 0;
  let profit = 0;
  let largestWin: number | null = null;
  let largestLoss: number | null = null;

  for (const { session, events } of sessionsWithEvents) {
    const summary = getPlayerSummaries(events).find((p) => p.playerId === playerId);
    if (!summary) continue;

    totalBuyIn += summary.buyInTotal;
    gameTypeCounts.set(session.type, (gameTypeCounts.get(session.type) ?? 0) + 1);

    const isCompleted = session.status === "completed";
    const sessionProfit = isCompleted
      ? computeRealizedProfitForPlayer(session, events, playerId)
      : summary.cashOutTotal - summary.buyInTotal;

    history.push({
      sessionId: session.id,
      sessionName: session.name,
      date: session.createdAt,
      status: session.status,
      buyInTotal: summary.buyInTotal,
      cashOutTotal: summary.cashOutTotal,
      profit: sessionProfit,
    });

    if (isCompleted && sessionProfit !== null) {
      completedSessionsCount += 1;
      realizedBuyIn += summary.buyInTotal;
      profit += sessionProfit;
      if (largestWin === null || sessionProfit > largestWin) largestWin = sessionProfit;
      if (largestLoss === null || sessionProfit < largestLoss) largestLoss = sessionProfit;
    }
  }

  history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  let favoriteGameType: SessionType | null = null;
  let favoriteCount = 0;
  for (const [type, count] of gameTypeCounts) {
    if (count > favoriteCount) {
      favoriteGameType = type;
      favoriteCount = count;
    }
  }

  return {
    sessionsPlayed: history.length,
    totalBuyIn,
    averageBuyIn: history.length > 0 ? totalBuyIn / history.length : 0,
    favoriteGameType,
    history,
    completedSessionsCount,
    profit,
    roi: realizedBuyIn > 0 ? profit / realizedBuyIn : null,
    largestWin,
    largestLoss,
  };
}
