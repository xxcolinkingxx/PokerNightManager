import { PAYMENT_METHODS } from "@/lib/session/constants";
import type { PaymentMethod, SessionEvent } from "@/lib/session/types";

export interface MethodTotals {
  method: PaymentMethod;
  collected: number;
  paidOut: number;
}

export interface OutstandingPayment {
  playerId: string;
  playerName: string;
  method: PaymentMethod;
  amount: number;
}

export interface BankerSummary {
  // Cash collected minus cash paid out, from events explicitly tagged
  // "cash". This is what should physically be in the box right now.
  expectedCash: number;
  // Most recent manual count, if the host has ever recorded one.
  actualCash: number | null;
  difference: number | null;
  byMethod: MethodTotals[];
  outstanding: OutstandingPayment[];
  // Buy-ins/rebuys/cash-outs from before Banker Mode existed have no
  // method recorded. Rather than guessing they were cash, their dollar
  // amount is called out here so the totals above stay honest.
  untaggedAmount: number;
}

export function computeBankerSummary(events: SessionEvent[]): BankerSummary {
  const names = new Map<string, string>();
  const collected = new Map<PaymentMethod, number>();
  const paidOut = new Map<PaymentMethod, number>();
  const outstandingByKey = new Map<string, OutstandingPayment>();
  let actualCash: number | null = null;
  let untaggedAmount = 0;

  for (const event of events) {
    if (event.type === "player_joined") {
      names.set(event.payload.playerId, event.payload.playerName);
      continue;
    }

    if (event.type === "buy_in" || event.type === "rebuy") {
      const { amount, method } = event.payload;
      if (!method) {
        untaggedAmount += amount;
        continue;
      }
      collected.set(method, (collected.get(method) ?? 0) + amount);
      continue;
    }

    if (event.type === "cash_out") {
      const { playerId, amount, method } = event.payload;
      if (!method) {
        untaggedAmount += amount;
        continue;
      }
      paidOut.set(method, (paidOut.get(method) ?? 0) + amount);
      if (method !== "cash") {
        const key = `${playerId}:${method}`;
        const existing = outstandingByKey.get(key);
        outstandingByKey.set(key, {
          playerId,
          playerName: names.get(playerId) ?? "Unknown",
          method,
          amount: (existing?.amount ?? 0) + amount,
        });
      }
      continue;
    }

    if (event.type === "payment_settled") {
      const { playerId, amount, method } = event.payload;
      const key = `${playerId}:${method}`;
      const existing = outstandingByKey.get(key);
      if (existing) {
        outstandingByKey.set(key, { ...existing, amount: existing.amount - amount });
      }
      continue;
    }

    if (event.type === "cash_recounted") {
      actualCash = event.payload.amount;
    }
  }

  const expectedCash = (collected.get("cash") ?? 0) - (paidOut.get("cash") ?? 0);

  const byMethod: MethodTotals[] = PAYMENT_METHODS.map((method) => ({
    method,
    collected: collected.get(method) ?? 0,
    paidOut: paidOut.get(method) ?? 0,
  }));

  // Floating point dust from repeated add/subtract shouldn't read as a
  // real outstanding balance.
  const outstanding = [...outstandingByKey.values()].filter((o) => o.amount > 0.005);

  return {
    expectedCash,
    actualCash,
    difference: actualCash === null ? null : actualCash - expectedCash,
    byMethod,
    outstanding,
    untaggedAmount,
  };
}
