import { beforeEach, describe, expect, it } from "vitest";

import {
  computeTournamentPayoutStructure,
  computeTournamentSummary,
  isFinalTable,
} from "./tournament-engine";
import { buyIn, eliminated, playerJoined, resetEventSequence } from "@/lib/testing/fixtures";

beforeEach(() => {
  resetEventSequence();
});

describe("computeTournamentPayoutStructure", () => {
  it("pays only 1st for 4 or fewer entrants", () => {
    const slots = computeTournamentPayoutStructure(4, 200);
    expect(slots).toEqual([{ position: 1, percentage: 100, amount: 200 }]);
  });

  it("pays 2 places (65/35) for 5-8 entrants", () => {
    const slots = computeTournamentPayoutStructure(6, 300);
    expect(slots).toEqual([
      { position: 1, percentage: 65, amount: 195 },
      { position: 2, percentage: 35, amount: 105 },
    ]);
  });

  it("pays 3 places (50/30/20) for 9+ entrants", () => {
    const slots = computeTournamentPayoutStructure(10, 1000);
    expect(slots).toEqual([
      { position: 1, percentage: 50, amount: 500 },
      { position: 2, percentage: 30, amount: 300 },
      { position: 3, percentage: 20, amount: 200 },
    ]);
  });

  it("always allocates every dollar of the pool despite rounding", () => {
    // 333 doesn't divide cleanly by these percentages.
    const slots = computeTournamentPayoutStructure(10, 333);
    const total = slots.reduce((sum, s) => sum + s.amount, 0);
    expect(total).toBe(333);
  });

  it("returns nothing for zero entrants or an empty pool", () => {
    expect(computeTournamentPayoutStructure(0, 100)).toEqual([]);
    expect(computeTournamentPayoutStructure(5, 0)).toEqual([]);
  });

  it("never pays more places than there are entrants", () => {
    const slots = computeTournamentPayoutStructure(2, 100);
    expect(slots).toHaveLength(1);
    expect(slots[0]).toEqual({ position: 1, percentage: 100, amount: 100 });
  });
});

describe("isFinalTable", () => {
  it("is true once remaining players drop to 6 or fewer, for a bigger field", () => {
    expect(isFinalTable(6, 10)).toBe(true);
    expect(isFinalTable(3, 10)).toBe(true);
    expect(isFinalTable(7, 10)).toBe(false);
  });

  it("is false for a field that never had more than 6 entrants (trivially a final table)", () => {
    expect(isFinalTable(4, 5)).toBe(false);
  });

  it("is false once the tournament is over (0 remaining)", () => {
    expect(isFinalTable(0, 10)).toBe(false);
  });
});

describe("computeTournamentSummary", () => {
  it("derives the winner from last-player-standing without an explicit elimination event", () => {
    const events = [
      playerJoined("p1", "Alice"),
      playerJoined("p2", "Bob"),
      playerJoined("p3", "Cara"),
      buyIn("p1", 20),
      buyIn("p2", 20),
      buyIn("p3", 20),
      eliminated("p3", 3),
      eliminated("p2", 2),
    ];

    const summary = computeTournamentSummary(events);
    expect(summary.entrantCount).toBe(3);
    expect(summary.prizePool).toBe(60);
    expect(summary.remainingCount).toBe(0);
    expect(summary.activePlayerNames).toEqual([]);

    const winner = summary.standings.find((s) => s.position === 1)!;
    expect(winner.playerId).toBe("p1");
    expect(winner.isPaid).toBe(true);
  });

  it("keeps standings sorted by finishing position", () => {
    const events = [
      playerJoined("p1", "Alice"),
      playerJoined("p2", "Bob"),
      playerJoined("p3", "Cara"),
      buyIn("p1", 20),
      buyIn("p2", 20),
      buyIn("p3", 20),
      eliminated("p2", 3),
      eliminated("p3", 2),
    ];
    const summary = computeTournamentSummary(events);
    expect(summary.standings.map((s) => s.position)).toEqual([1, 2, 3]);
  });

  it("reports who's still active before the tournament is decided", () => {
    const events = [
      playerJoined("p1", "Alice"),
      playerJoined("p2", "Bob"),
      playerJoined("p3", "Cara"),
      buyIn("p1", 20),
      buyIn("p2", 20),
      buyIn("p3", 20),
      eliminated("p3", 3),
    ];
    const summary = computeTournamentSummary(events);
    expect(summary.remainingCount).toBe(2);
    expect(summary.activePlayerNames.sort()).toEqual(["Alice", "Bob"]);
    // Not decided yet -- no 1st place standing exists.
    expect(summary.standings.find((s) => s.position === 1)).toBeUndefined();
  });

  it("flags a final table once the field is down to the threshold", () => {
    const players = Array.from({ length: 9 }, (_, i) => `p${i + 1}`);
    const events = [
      ...players.map((id, i) => playerJoined(id, `Player ${i + 1}`)),
      ...players.map((id) => buyIn(id, 20)),
      // Eliminate down to 6 remaining (9 - 3 = 6).
      eliminated("p9", 9),
      eliminated("p8", 8),
      eliminated("p7", 7),
    ];
    const summary = computeTournamentSummary(events);
    expect(summary.remainingCount).toBe(6);
    expect(summary.isFinalTable).toBe(true);
  });
});
