import { beforeEach, describe, expect, it } from "vitest";

import { computeGlobalStats } from "./global-stats-engine";
import {
  buyIn,
  cashOut,
  makeEvent,
  makeSessionWithEvents,
  playerJoined,
  rebuy,
  resetEventSequence,
} from "@/lib/testing/fixtures";

beforeEach(() => {
  resetEventSequence();
});

describe("computeGlobalStats", () => {
  it("ignores sessions that aren't completed", () => {
    const active = makeSessionWithEvents(
      { id: "s1", status: "active", createdAt: "2026-01-01T00:00:00.000Z" },
      [playerJoined("p1", "Alice"), buyIn("p1", 50)],
    );
    const stats = computeGlobalStats([active], "all");
    expect(stats.sessionsCount).toBe(0);
    expect(stats.leaderboard).toEqual([]);
  });

  it("aggregates buy-in/rebuy volume and profit across sessions", () => {
    const s1 = makeSessionWithEvents(
      { id: "s1", status: "completed", createdAt: "2026-01-01T00:00:00.000Z" },
      [
        playerJoined("p1", "Alice"),
        playerJoined("p2", "Bob"),
        buyIn("p1", 50),
        buyIn("p2", 50),
        rebuy("p1", 20),
        cashOut("p1", 100),
        cashOut("p2", 20),
      ],
    );
    const s2 = makeSessionWithEvents(
      { id: "s2", status: "completed", createdAt: "2026-01-08T00:00:00.000Z" },
      [playerJoined("p1", "Alice"), buyIn("p1", 50), cashOut("p1", 40)],
    );

    const stats = computeGlobalStats([s1, s2], "all");
    expect(stats.sessionsCount).toBe(2);
    expect(stats.totalBuyInVolume).toBe(150); // 50+50+50
    expect(stats.totalRebuyVolume).toBe(20);

    const alice = stats.leaderboard.find((p) => p.playerId === "p1")!;
    // s1: 100 - 70 = 30, s2: 40 - 50 = -10
    expect(alice.profit).toBe(20);
    expect(alice.sessionsPlayed).toBe(2);

    const bob = stats.leaderboard.find((p) => p.playerId === "p2")!;
    expect(bob.profit).toBe(-30);
    expect(bob.sessionsPlayed).toBe(1);
  });

  it("sorts the profit leaderboard descending", () => {
    const s1 = makeSessionWithEvents(
      { id: "s1", status: "completed", createdAt: "2026-01-01T00:00:00.000Z" },
      [
        playerJoined("p1", "Alice"),
        playerJoined("p2", "Bob"),
        buyIn("p1", 50),
        buyIn("p2", 50),
        cashOut("p1", 20),
        cashOut("p2", 90),
      ],
    );
    const stats = computeGlobalStats([s1], "all");
    expect(stats.leaderboard.map((p) => p.playerId)).toEqual(["p2", "p1"]);
  });

  it("sorts the attendance leaderboard by sessions played, independent of profit", () => {
    const s1 = makeSessionWithEvents(
      { id: "s1", status: "completed", createdAt: "2026-01-01T00:00:00.000Z" },
      [
        playerJoined("p1", "Alice"),
        playerJoined("p2", "Bob"),
        buyIn("p1", 50),
        buyIn("p2", 50),
        cashOut("p1", 100), // Alice: big winner, 1 session
        cashOut("p2", 40),
      ],
    );
    const s2 = makeSessionWithEvents(
      { id: "s2", status: "completed", createdAt: "2026-01-08T00:00:00.000Z" },
      [playerJoined("p2", "Bob"), buyIn("p2", 50), cashOut("p2", 45)], // Bob: 2nd session, still a net loser
    );

    const stats = computeGlobalStats([s1, s2], "all");
    expect(stats.leaderboard[0].playerId).toBe("p1"); // profit-sorted: Alice first
    expect(stats.attendanceLeaderboard[0].playerId).toBe("p2"); // attendance-sorted: Bob first (2 sessions)
  });

  it("excludes an unresolved tournament player from the leaderboard entirely", () => {
    const s1 = makeSessionWithEvents(
      {
        id: "s1",
        status: "completed",
        type: "tournament",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
      [playerJoined("p1", "Alice"), buyIn("p1", 20)],
    );
    const stats = computeGlobalStats([s1], "all");
    expect(stats.leaderboard).toEqual([]);
  });

  it("tracks the biggest pot and which session it happened in", () => {
    const s1 = makeSessionWithEvents(
      { id: "s1", name: "Small Game", status: "completed", createdAt: "2026-01-01T00:00:00.000Z" },
      [makeEvent("pot_updated", { amount: 40, action: "set" })],
    );
    const s2 = makeSessionWithEvents(
      { id: "s2", name: "Big Game", status: "completed", createdAt: "2026-01-08T00:00:00.000Z" },
      [makeEvent("pot_updated", { amount: 500, action: "set" })],
    );
    const stats = computeGlobalStats([s1, s2], "all");
    expect(stats.biggestPot).toBe(500);
    expect(stats.biggestPotSessionName).toBe("Big Game");
  });

  it("filters to the current month when window is 'month'", () => {
    const now = new Date(2026, 5, 15); // June 15, 2026
    const inMonth = makeSessionWithEvents(
      { id: "s1", status: "completed", createdAt: new Date(2026, 5, 1).toISOString() },
      [playerJoined("p1", "Alice"), buyIn("p1", 50), cashOut("p1", 50)],
    );
    const otherMonth = makeSessionWithEvents(
      { id: "s2", status: "completed", createdAt: new Date(2026, 4, 1).toISOString() },
      [playerJoined("p1", "Alice"), buyIn("p1", 50), cashOut("p1", 50)],
    );
    const stats = computeGlobalStats([inMonth, otherMonth], "month", now);
    expect(stats.sessionsCount).toBe(1);
  });

  it("filters to the current year when window is 'year'", () => {
    const now = new Date(2026, 5, 15);
    const thisYear = makeSessionWithEvents(
      { id: "s1", status: "completed", createdAt: new Date(2026, 0, 1).toISOString() },
      [playerJoined("p1", "Alice"), buyIn("p1", 50), cashOut("p1", 50)],
    );
    const lastYear = makeSessionWithEvents(
      { id: "s2", status: "completed", createdAt: new Date(2025, 11, 1).toISOString() },
      [playerJoined("p1", "Alice"), buyIn("p1", 50), cashOut("p1", 50)],
    );
    const stats = computeGlobalStats([thisYear, lastYear], "year", now);
    expect(stats.sessionsCount).toBe(1);
  });
});
