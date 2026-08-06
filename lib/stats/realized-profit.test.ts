import { beforeEach, describe, expect, it } from "vitest";

import { computeRealizedProfitForPlayer, computeRealizedProfits } from "./realized-profit";
import { buyIn, cashOut, eliminated, makeSession, playerJoined, resetEventSequence } from "@/lib/testing/fixtures";

beforeEach(() => {
  resetEventSequence();
});

describe("computeRealizedProfits -- cash games", () => {
  it("is the plain cash-out minus buy-in ledger", () => {
    const session = makeSession({ type: "cash" });
    const events = [
      playerJoined("p1", "Alice"),
      playerJoined("p2", "Bob"),
      buyIn("p1", 50),
      buyIn("p2", 50),
      cashOut("p1", 80),
      cashOut("p2", 20),
    ];

    const profits = computeRealizedProfits(session, events);
    expect(profits.find((p) => p.playerId === "p1")?.profit).toBe(30);
    expect(profits.find((p) => p.playerId === "p2")?.profit).toBe(-30);
  });
});

describe("computeRealizedProfits -- tournaments", () => {
  it("uses the prize pool payout, not a cash_out event that never happens", () => {
    const session = makeSession({ type: "tournament" });
    // 5 entrants (>4, <=8) pays 2 places at 65/35.
    const events = [
      playerJoined("p1", "Alice"),
      playerJoined("p2", "Bob"),
      playerJoined("p3", "Cara"),
      playerJoined("p4", "Dee"),
      playerJoined("p5", "Eli"),
      buyIn("p1", 20),
      buyIn("p2", 20),
      buyIn("p3", 20),
      buyIn("p4", 20),
      buyIn("p5", 20),
      eliminated("p5", 5),
      eliminated("p4", 4),
      eliminated("p3", 3),
      eliminated("p2", 2),
      // p1 is last standing -- implicitly 1st, no elimination event.
    ];

    const profits = computeRealizedProfits(session, events);
    // Prize pool = 100, 2 paid places at 65/35.
    const alice = profits.find((p) => p.playerId === "p1")!;
    const bob = profits.find((p) => p.playerId === "p2")!;
    const cara = profits.find((p) => p.playerId === "p3")!;

    expect(alice.profit).toBe(65 - 20); // 65% of 100 = 65
    expect(bob.profit).toBe(35 - 20); // 35% of 100 = 35
    expect(cara.profit).toBe(0 - 20); // unpaid place (3rd of 5)
  });

  it("returns null for a player whose finish was never recorded", () => {
    const session = makeSession({ type: "tournament" });
    const events = [
      playerJoined("p1", "Alice"),
      playerJoined("p2", "Bob"),
      buyIn("p1", 20),
      buyIn("p2", 20),
      // Marked completed with nobody eliminated -- an unresolved tournament.
    ];

    const profits = computeRealizedProfits(session, events);
    expect(profits.every((p) => p.profit === null)).toBe(true);
  });
});

describe("computeRealizedProfitForPlayer", () => {
  it("returns a single player's profit", () => {
    const session = makeSession({ type: "cash" });
    const events = [playerJoined("p1", "Alice"), buyIn("p1", 50), cashOut("p1", 70)];
    expect(computeRealizedProfitForPlayer(session, events, "p1")).toBe(20);
  });

  it("returns null for a player not in the session", () => {
    const session = makeSession({ type: "cash" });
    const events = [playerJoined("p1", "Alice"), buyIn("p1", 50), cashOut("p1", 70)];
    expect(computeRealizedProfitForPlayer(session, events, "ghost")).toBeNull();
  });
});
