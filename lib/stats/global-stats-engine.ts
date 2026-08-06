import { computePeakPot } from "@/lib/session/services/session-engine";
import type { SessionWithEvents } from "@/lib/session/types";
import { computeRealizedProfits } from "@/lib/stats/realized-profit";

export type StatsWindow = "month" | "year" | "all";

export interface LeaderboardEntry {
  playerId: string;
  playerName: string;
  profit: number;
  sessionsPlayed: number;
}

export interface GlobalStats {
  sessionsCount: number;
  totalBuyInVolume: number;
  totalRebuyVolume: number;
  biggestPot: number;
  biggestPotSessionName: string | null;
  leaderboard: LeaderboardEntry[];
  // Same entries as `leaderboard`, sorted by attendance instead of
  // profit -- "who shows up" is its own leaderboard, especially useful
  // over the "all time" window.
  attendanceLeaderboard: LeaderboardEntry[];
}

function isWithinWindow(dateIso: string, window: StatsWindow, now: Date): boolean {
  if (window === "all") return true;
  const date = new Date(dateIso);
  if (date.getFullYear() !== now.getFullYear()) return false;
  if (window === "month") return date.getMonth() === now.getMonth();
  return true;
}

export function computeGlobalStats(
  sessionsWithEvents: SessionWithEvents[],
  window: StatsWindow,
  now: Date = new Date(),
): GlobalStats {
  const completed = sessionsWithEvents.filter(
    ({ session }) => session.status === "completed" && isWithinWindow(session.createdAt, window, now),
  );

  let totalBuyInVolume = 0;
  let totalRebuyVolume = 0;
  let biggestPot = 0;
  let biggestPotSessionName: string | null = null;

  const playerAgg = new Map<
    string,
    { playerName: string; profit: number; sessionsPlayed: number }
  >();

  for (const { session, events } of completed) {
    for (const event of events) {
      if (event.type === "buy_in") totalBuyInVolume += event.payload.amount;
      if (event.type === "rebuy") totalRebuyVolume += event.payload.amount;
    }

    const peakPot = computePeakPot(events);
    if (peakPot > biggestPot) {
      biggestPot = peakPot;
      biggestPotSessionName = session.name;
    }

    for (const { playerId, playerName, profit: sessionProfit } of computeRealizedProfits(
      session,
      events,
    )) {
      // Unresolved tournament (marked completed without every player's
      // finish being recorded) -- don't guess, just leave it out.
      if (sessionProfit === null) continue;

      const existing = playerAgg.get(playerId);
      playerAgg.set(playerId, {
        playerName,
        profit: (existing?.profit ?? 0) + sessionProfit,
        sessionsPlayed: (existing?.sessionsPlayed ?? 0) + 1,
      });
    }
  }

  const leaderboard: LeaderboardEntry[] = [...playerAgg.entries()]
    .map(([playerId, agg]) => ({ playerId, ...agg }))
    .sort((a, b) => b.profit - a.profit);

  const attendanceLeaderboard: LeaderboardEntry[] = [...leaderboard].sort(
    (a, b) => b.sessionsPlayed - a.sessionsPlayed,
  );

  return {
    sessionsCount: completed.length,
    totalBuyInVolume,
    totalRebuyVolume,
    biggestPot,
    biggestPotSessionName,
    leaderboard,
    attendanceLeaderboard,
  };
}
