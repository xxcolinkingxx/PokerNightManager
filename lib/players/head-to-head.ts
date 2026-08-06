import { computeRealizedProfitForPlayer } from "@/lib/stats/realized-profit";
import type { SessionWithEvents } from "@/lib/session/types";

export interface HeadToHeadMeeting {
  sessionId: string;
  sessionName: string;
  date: string;
  playerAProfit: number;
  playerBProfit: number;
}

export interface HeadToHeadStats {
  meetingsCount: number;
  playerAWins: number;
  playerBWins: number;
  ties: number;
  playerATotalProfit: number;
  playerBTotalProfit: number;
  // Newest first.
  meetings: HeadToHeadMeeting[];
}

// Only sessions where BOTH players have a resolved profit count as a
// "meeting" -- same honesty principle as the rest of stats: an unresolved
// tournament finish (or a session either of them isn't actually in) is
// left out rather than guessed at, so it can't skew the record either way.
export function computeHeadToHead(
  playerAId: string,
  playerBId: string,
  sessionsWithEvents: SessionWithEvents[],
): HeadToHeadStats {
  const meetings: HeadToHeadMeeting[] = [];

  for (const { session, events } of sessionsWithEvents) {
    if (session.status !== "completed") continue;
    if (!session.playerIds.includes(playerAId) || !session.playerIds.includes(playerBId)) continue;

    const playerAProfit = computeRealizedProfitForPlayer(session, events, playerAId);
    const playerBProfit = computeRealizedProfitForPlayer(session, events, playerBId);
    if (playerAProfit === null || playerBProfit === null) continue;

    meetings.push({
      sessionId: session.id,
      sessionName: session.name,
      date: session.createdAt,
      playerAProfit,
      playerBProfit,
    });
  }

  meetings.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  let playerAWins = 0;
  let playerBWins = 0;
  let ties = 0;
  let playerATotalProfit = 0;
  let playerBTotalProfit = 0;

  for (const meeting of meetings) {
    playerATotalProfit += meeting.playerAProfit;
    playerBTotalProfit += meeting.playerBProfit;
    if (meeting.playerAProfit > meeting.playerBProfit) playerAWins += 1;
    else if (meeting.playerBProfit > meeting.playerAProfit) playerBWins += 1;
    else ties += 1;
  }

  return {
    meetingsCount: meetings.length,
    playerAWins,
    playerBWins,
    ties,
    playerATotalProfit,
    playerBTotalProfit,
    meetings,
  };
}
