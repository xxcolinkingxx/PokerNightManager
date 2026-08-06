import { getPlayerSummaries } from "@/lib/session/services/session-engine";
import type { SessionEvent } from "@/lib/session/types";

export interface SettlementTransaction {
  fromPlayerId: string;
  fromPlayerName: string;
  toPlayerId: string;
  toPlayerName: string;
  amount: number;
}

export interface PlayerNet {
  playerId: string;
  playerName: string;
  // Positive = they're owed money (creditor), negative = they owe money
  // (debtor). Same sign convention as session profit.
  amount: number;
}

// Below this, a leftover cent is floating-point dust from repeated
// add/subtract, not a real discrepancy worth flagging.
const IMBALANCE_EPSILON = 0.005;

export interface SettlementPlan {
  nets: PlayerNet[];
  transactions: SettlementTransaction[];
  pendingPlayerNames: string[];
  // Total cash-outs minus total buy-ins, across cashed-out players only.
  // Chips don't appear or vanish -- once everyone's cashed out this
  // should be (near) zero, so a nonzero value means some buy-in or
  // cash-out amount was very likely entered wrong.
  imbalance: number;
  // Only meaningful once nobody's pending -- a nonzero imbalance while
  // players are still mid-session just means their money hasn't left
  // the table yet, which is normal and not an error.
  hasImbalance: boolean;
}

// Greedy largest-debtor-to-largest-creditor matching. Not always the
// theoretical minimum number of transactions (that's NP-hard in general),
// but it's simple, correct, and produces at most N-1 payments for N
// participants -- the same practical approach apps like Splitwise use.
export function computeSettlementTransactions(nets: PlayerNet[]): SettlementTransaction[] {
  const creditors = nets
    .filter((n) => n.amount > 0.005)
    .map((n) => ({ ...n }))
    .sort((a, b) => b.amount - a.amount);
  const debtors = nets
    .filter((n) => n.amount < -0.005)
    .map((n) => ({ ...n, amount: -n.amount }))
    .sort((a, b) => b.amount - a.amount);

  const transactions: SettlementTransaction[] = [];
  let ci = 0;
  let di = 0;

  while (ci < creditors.length && di < debtors.length) {
    const creditor = creditors[ci];
    const debtor = debtors[di];
    const amount = Math.min(creditor.amount, debtor.amount);

    if (amount > 0.005) {
      transactions.push({
        fromPlayerId: debtor.playerId,
        fromPlayerName: debtor.playerName,
        toPlayerId: creditor.playerId,
        toPlayerName: creditor.playerName,
        amount: Math.round(amount * 100) / 100,
      });
    }

    creditor.amount -= amount;
    debtor.amount -= amount;

    if (creditor.amount <= 0.005) ci++;
    if (debtor.amount <= 0.005) di++;
  }

  return transactions;
}

export function computeSessionSettlement(events: SessionEvent[]): SettlementPlan {
  const summaries = getPlayerSummaries(events);
  const settled = summaries.filter((s) => s.isCashedOut);
  const pending = summaries.filter((s) => !s.isCashedOut);

  const nets: PlayerNet[] = settled.map((s) => ({
    playerId: s.playerId,
    playerName: s.playerName,
    amount: s.cashOutTotal - s.buyInTotal,
  }));

  const imbalance = Math.round(nets.reduce((sum, n) => sum + n.amount, 0) * 100) / 100;

  return {
    nets: nets.sort((a, b) => b.amount - a.amount),
    transactions: computeSettlementTransactions(nets),
    pendingPlayerNames: pending.map((p) => p.playerName),
    imbalance,
    hasImbalance: pending.length === 0 && Math.abs(imbalance) > IMBALANCE_EPSILON,
  };
}
