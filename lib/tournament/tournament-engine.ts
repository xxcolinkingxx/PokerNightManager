import { getPlayerSummaries } from "@/lib/session/services/session-engine";
import type { SessionEvent } from "@/lib/session/types";

// A home-game final table is a small enough field that hitting it is
// actually a milestone worth flagging -- but only for tournaments big
// enough that reaching it means something (no point flagging it in a
// 4-player freezeout that's a final table from the first hand).
export const FINAL_TABLE_SIZE = 6;

// Standard percentage-of-prize-pool payout tables, indexed by how many
// places get paid. Kept simple (top-heavy, easy to explain out loud) --
// the same shape most home tournaments already use.
const PAYOUT_PERCENTAGES: Record<number, number[]> = {
  1: [100],
  2: [65, 35],
  3: [50, 30, 20],
};

function paidPlacesForEntrants(entrantCount: number): number {
  if (entrantCount <= 4) return 1;
  if (entrantCount <= 8) return 2;
  return 3;
}

export interface PayoutSlot {
  position: number;
  percentage: number;
  amount: number;
}

export interface TournamentStanding {
  playerId: string;
  playerName: string;
  position: number;
  payout: number;
  isPaid: boolean;
}

export interface TournamentSummary {
  entrantCount: number;
  prizePool: number;
  payoutStructure: PayoutSlot[];
  standings: TournamentStanding[];
  activePlayerNames: string[];
  remainingCount: number;
  isFinalTable: boolean;
}

export function computeTournamentPayoutStructure(
  entrantCount: number,
  prizePool: number,
): PayoutSlot[] {
  if (entrantCount === 0 || prizePool <= 0) return [];

  const paidPlaces = Math.min(paidPlacesForEntrants(entrantCount), entrantCount);
  const percentages = PAYOUT_PERCENTAGES[paidPlaces] ?? PAYOUT_PERCENTAGES[3];

  const slots: PayoutSlot[] = [];
  let allocated = 0;
  percentages.forEach((percentage, index) => {
    const isLast = index === percentages.length - 1;
    // The last paid place absorbs the rounding remainder so every dollar
    // in the pool is actually accounted for across the payouts.
    const amount = isLast
      ? Math.round(prizePool) - allocated
      : Math.round(prizePool * (percentage / 100));
    allocated += amount;
    slots.push({ position: index + 1, percentage, amount });
  });

  return slots;
}

export function isFinalTable(remainingCount: number, entrantCount: number): boolean {
  return (
    remainingCount > 0 && remainingCount <= FINAL_TABLE_SIZE && entrantCount > FINAL_TABLE_SIZE
  );
}

export function computeTournamentSummary(events: SessionEvent[]): TournamentSummary {
  const summaries = getPlayerSummaries(events);
  const entrantCount = summaries.length;
  const prizePool = summaries.reduce((sum, s) => sum + s.buyInTotal, 0);
  const payoutStructure = computeTournamentPayoutStructure(entrantCount, prizePool);
  const payoutByPosition = new Map(payoutStructure.map((slot) => [slot.position, slot]));

  const eliminated = summaries.filter((s) => s.isEliminated);
  const notYetEliminated = summaries.filter((s) => !s.isEliminated);
  // Decided the moment exactly one entrant is left standing -- they're
  // the winner and finish 1st, with no explicit elimination event of
  // their own.
  const isDecided = entrantCount >= 2 && notYetEliminated.length === 1;

  const standings: TournamentStanding[] = eliminated.map((s) => {
    const slot = payoutByPosition.get(s.finishPosition ?? -1);
    return {
      playerId: s.playerId,
      playerName: s.playerName,
      position: s.finishPosition ?? 0,
      payout: slot?.amount ?? 0,
      isPaid: slot !== undefined,
    };
  });

  if (isDecided) {
    const winner = notYetEliminated[0];
    const slot = payoutByPosition.get(1);
    standings.push({
      playerId: winner.playerId,
      playerName: winner.playerName,
      position: 1,
      payout: slot?.amount ?? 0,
      isPaid: slot !== undefined,
    });
  }

  standings.sort((a, b) => a.position - b.position);

  const remainingCount = isDecided ? 0 : notYetEliminated.length;

  return {
    entrantCount,
    prizePool,
    payoutStructure,
    standings,
    activePlayerNames: isDecided ? [] : notYetEliminated.map((s) => s.playerName),
    remainingCount,
    isFinalTable: isFinalTable(remainingCount, entrantCount),
  };
}
