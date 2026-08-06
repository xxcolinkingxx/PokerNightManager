import type { Session, SessionEvent, SessionType } from "@/lib/session/types";

export interface PlayerSessionHistoryEntry {
  sessionId: string;
  sessionName: string;
  date: string;
  status: Session["status"];
  buyInTotal: number;
}

export interface PlayerStats {
  sessionsPlayed: number;
  totalBuyIn: number;
  averageBuyIn: number;
  favoriteGameType: SessionType | null;
  history: PlayerSessionHistoryEntry[];
}

interface SessionWithEvents {
  session: Session;
  events: SessionEvent[];
}

export function computePlayerStats(
  playerId: string,
  sessionsWithEvents: SessionWithEvents[],
): PlayerStats {
  const history: PlayerSessionHistoryEntry[] = [];
  const gameTypeCounts = new Map<SessionType, number>();
  let totalBuyIn = 0;

  for (const { session, events } of sessionsWithEvents) {
    const playedInSession = events.some(
      (event) => event.type === "player_joined" && event.payload.playerId === playerId,
    );
    if (!playedInSession) continue;

    const buyInTotal = events.reduce((sum, event) => {
      if (
        (event.type === "buy_in" || event.type === "rebuy") &&
        event.payload.playerId === playerId
      ) {
        return sum + event.payload.amount;
      }
      return sum;
    }, 0);

    totalBuyIn += buyInTotal;
    gameTypeCounts.set(session.type, (gameTypeCounts.get(session.type) ?? 0) + 1);

    history.push({
      sessionId: session.id,
      sessionName: session.name,
      date: session.createdAt,
      status: session.status,
      buyInTotal,
    });
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
  };
}
