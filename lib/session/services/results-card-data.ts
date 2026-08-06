import { computeRealizedProfits } from "@/lib/stats/realized-profit";
import type { Session, SessionEvent } from "@/lib/session/types";

export interface ResultsCardRow {
  playerName: string;
  // Null when a completed tournament never recorded this player's finish
  // -- shown as "--" on the card rather than guessed at.
  profit: number | null;
}

export interface ResultsCardData {
  sessionName: string;
  dateLabel: string;
  locationLabel: string;
  rows: ResultsCardRow[];
}

export function buildResultsCardData(session: Session, events: SessionEvent[]): ResultsCardData {
  const rows: ResultsCardRow[] = computeRealizedProfits(session, events)
    .map(({ playerName, profit }) => ({ playerName, profit }))
    .sort((a, b) => {
      // Unresolved results have nothing to rank by -- sink to the bottom
      // instead of implicitly counting as a last-place loss.
      if (a.profit === null && b.profit === null) return 0;
      if (a.profit === null) return 1;
      if (b.profit === null) return -1;
      return b.profit - a.profit;
    });

  return {
    sessionName: session.name,
    dateLabel: new Date(session.createdAt).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    locationLabel: session.location,
    rows,
  };
}
