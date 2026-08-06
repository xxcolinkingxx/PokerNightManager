import { beforeEach, describe, expect, it } from "vitest";

import { computeSessionSettlement, computeSettlementTransactions } from "./settlement-engine";
import { buyIn, cashOut, playerJoined, resetEventSequence } from "@/lib/testing/fixtures";

beforeEach(() => {
  resetEventSequence();
});

describe("computeSettlementTransactions", () => {
  it("matches a single debtor to a single creditor", () => {
    const nets = [
      { playerId: "p1", playerName: "Alice", amount: 30 },
      { playerId: "p2", playerName: "Bob", amount: -30 },
    ];
    const txns = computeSettlementTransactions(nets);
    expect(txns).toEqual([
      { fromPlayerId: "p2", fromPlayerName: "Bob", toPlayerId: "p1", toPlayerName: "Alice", amount: 30 },
    ]);
  });

  it("produces at most N-1 transactions for N participants", () => {
    const nets = [
      { playerId: "p1", playerName: "Alice", amount: 50 },
      { playerId: "p2", playerName: "Bob", amount: 30 },
      { playerId: "p3", playerName: "Cara", amount: -40 },
      { playerId: "p4", playerName: "Dee", amount: -40 },
    ];
    const txns = computeSettlementTransactions(nets);
    expect(txns.length).toBeLessThanOrEqual(nets.length - 1);

    // Every transaction should net out exactly against the original amounts.
    const paidByDebtor = new Map<string, number>();
    const receivedByCreditor = new Map<string, number>();
    for (const t of txns) {
      paidByDebtor.set(t.fromPlayerId, (paidByDebtor.get(t.fromPlayerId) ?? 0) + t.amount);
      receivedByCreditor.set(t.toPlayerId, (receivedByCreditor.get(t.toPlayerId) ?? 0) + t.amount);
    }
    expect(paidByDebtor.get("p3")).toBeCloseTo(40);
    expect(paidByDebtor.get("p4")).toBeCloseTo(40);
    expect(receivedByCreditor.get("p1")).toBeCloseTo(50);
    expect(receivedByCreditor.get("p2")).toBeCloseTo(30);
  });

  it("ignores players who are already settled (net ~0)", () => {
    const nets = [
      { playerId: "p1", playerName: "Alice", amount: 0 },
      { playerId: "p2", playerName: "Bob", amount: 20 },
      { playerId: "p3", playerName: "Cara", amount: -20 },
    ];
    const txns = computeSettlementTransactions(nets);
    expect(txns).toHaveLength(1);
    expect(txns[0].fromPlayerId).toBe("p3");
    expect(txns[0].toPlayerId).toBe("p2");
  });

  it("returns no transactions when everyone is already even", () => {
    const nets = [
      { playerId: "p1", playerName: "Alice", amount: 0 },
      { playerId: "p2", playerName: "Bob", amount: 0 },
    ];
    expect(computeSettlementTransactions(nets)).toEqual([]);
  });
});

describe("computeSessionSettlement", () => {
  it("only settles cashed-out players and lists the rest as pending", () => {
    const events = [
      playerJoined("p1", "Alice"),
      playerJoined("p2", "Bob"),
      playerJoined("p3", "Cara"),
      buyIn("p1", 50),
      buyIn("p2", 50),
      buyIn("p3", 50),
      cashOut("p1", 100),
      cashOut("p2", 20),
      // p3 never cashed out -- still at the table.
    ];

    const plan = computeSessionSettlement(events);
    expect(plan.pendingPlayerNames).toEqual(["Cara"]);
    expect(plan.nets.map((n) => n.playerId).sort()).toEqual(["p1", "p2"]);

    const alice = plan.nets.find((n) => n.playerId === "p1")!;
    expect(alice.amount).toBe(50);
    const bob = plan.nets.find((n) => n.playerId === "p2")!;
    expect(bob.amount).toBe(-30);

    expect(plan.transactions).toEqual([
      {
        fromPlayerId: "p2",
        fromPlayerName: "Bob",
        toPlayerId: "p1",
        toPlayerName: "Alice",
        amount: 30,
      },
    ]);
  });

  it("returns no nets or transactions when nobody has cashed out yet", () => {
    const events = [playerJoined("p1", "Alice"), buyIn("p1", 50)];
    const plan = computeSessionSettlement(events);
    expect(plan.nets).toEqual([]);
    expect(plan.transactions).toEqual([]);
    expect(plan.pendingPlayerNames).toEqual(["Alice"]);
  });
});
