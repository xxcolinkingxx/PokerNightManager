import { beforeEach, describe, expect, it } from "vitest";

import { computePlayerStats } from "./player-stats";
import {
  buyIn,
  cashOut,
  makeSessionWithEvents,
  playerJoined,
  resetEventSequence,
} from "@/lib/testing/fixtures";

beforeEach(() => {
  resetEventSequence();
});

describe("computePlayerStats", () => {
  it("only includes sessions the player actually appears in", () => {
    const mine = makeSessionWithEvents(
      { id: "s1", createdAt: "2026-01-01T00:00:00.000Z", status: "completed" },
      [playerJoined("p1", "Alice"), buyIn("p1", 50), cashOut("p1", 70)],
    );
    const notMine = makeSessionWithEvents(
      { id: "s2", createdAt: "2026-01-08T00:00:00.000Z", status: "completed" },
      [playerJoined("p2", "Bob"), buyIn("p2", 50), cashOut("p2", 40)],
    );

    const stats = computePlayerStats("p1", [mine, notMine]);
    expect(stats.sessionsPlayed).toBe(1);
    expect(stats.history).toHaveLength(1);
    expect(stats.history[0].sessionId).toBe("s1");
  });

  it("computes lifetime profit, ROI, largest win, and largest loss from completed sessions only", () => {
    const win = makeSessionWithEvents(
      { id: "s1", createdAt: "2026-01-01T00:00:00.000Z", status: "completed" },
      [playerJoined("p1", "Alice"), buyIn("p1", 50), cashOut("p1", 100)],
    );
    const loss = makeSessionWithEvents(
      { id: "s2", createdAt: "2026-01-08T00:00:00.000Z", status: "completed" },
      [playerJoined("p1", "Alice"), buyIn("p1", 50), cashOut("p1", 10)],
    );
    const stillLive = makeSessionWithEvents(
      { id: "s3", createdAt: "2026-01-15T00:00:00.000Z", status: "active" },
      [playerJoined("p1", "Alice"), buyIn("p1", 50)],
    );

    const stats = computePlayerStats("p1", [win, loss, stillLive]);

    // In-progress session counted in history/attendance but not lifetime totals.
    expect(stats.sessionsPlayed).toBe(3);
    expect(stats.completedSessionsCount).toBe(2);
    expect(stats.totalBuyIn).toBe(150);
    expect(stats.profit).toBe(50 + -40); // (100-50) + (10-50)
    expect(stats.roi).toBeCloseTo(10 / 100);
    expect(stats.largestWin).toBe(50);
    expect(stats.largestLoss).toBe(-40);

    // The still-active session shows unrealized profit (buy-in on the table), not counted lifetime.
    const liveEntry = stats.history.find((h) => h.sessionId === "s3")!;
    expect(liveEntry.profit).toBe(-50);
  });

  it("excludes an unresolved completed tournament from lifetime profit but keeps it in history", () => {
    const unresolved = makeSessionWithEvents(
      { id: "s1", createdAt: "2026-01-01T00:00:00.000Z", status: "completed", type: "tournament" },
      [playerJoined("p1", "Alice"), buyIn("p1", 20)],
    );

    const stats = computePlayerStats("p1", [unresolved]);
    expect(stats.history[0].profit).toBeNull();
    expect(stats.completedSessionsCount).toBe(0);
    expect(stats.profit).toBe(0);
    expect(stats.roi).toBeNull();
    expect(stats.largestWin).toBeNull();
    expect(stats.largestLoss).toBeNull();
  });

  it("buckets attendance by calendar year, skipping years never played", () => {
    const y2024 = makeSessionWithEvents(
      { id: "s1", createdAt: "2024-06-01T00:00:00.000Z", status: "completed" },
      [playerJoined("p1", "Alice"), buyIn("p1", 50), cashOut("p1", 50)],
    );
    const y2026a = makeSessionWithEvents(
      { id: "s2", createdAt: "2026-03-01T00:00:00.000Z", status: "completed" },
      [playerJoined("p1", "Alice"), buyIn("p1", 50), cashOut("p1", 50)],
    );
    const y2026b = makeSessionWithEvents(
      { id: "s3", createdAt: "2026-09-01T00:00:00.000Z", status: "completed" },
      [playerJoined("p1", "Alice"), buyIn("p1", 50), cashOut("p1", 50)],
    );

    const stats = computePlayerStats("p1", [y2024, y2026a, y2026b]);
    // No 2025 entry at all -- not zero-filled.
    expect(stats.attendanceByYear).toEqual([
      { year: 2024, count: 1 },
      { year: 2026, count: 2 },
    ]);
  });

  it("picks the most-played game type as the favorite", () => {
    const cash1 = makeSessionWithEvents(
      { id: "s1", createdAt: "2026-01-01T00:00:00.000Z", status: "completed", type: "cash" },
      [playerJoined("p1", "Alice"), buyIn("p1", 50), cashOut("p1", 50)],
    );
    const cash2 = makeSessionWithEvents(
      { id: "s2", createdAt: "2026-01-08T00:00:00.000Z", status: "completed", type: "cash" },
      [playerJoined("p1", "Alice"), buyIn("p1", 50), cashOut("p1", 50)],
    );
    const tourney = makeSessionWithEvents(
      { id: "s3", createdAt: "2026-01-15T00:00:00.000Z", status: "completed", type: "tournament" },
      [playerJoined("p1", "Alice"), buyIn("p1", 20)],
    );

    const stats = computePlayerStats("p1", [cash1, cash2, tourney]);
    expect(stats.favoriteGameType).toBe("cash");
  });

  it("returns empty/zeroed stats for a player with no sessions", () => {
    const stats = computePlayerStats("ghost", []);
    expect(stats.sessionsPlayed).toBe(0);
    expect(stats.totalBuyIn).toBe(0);
    expect(stats.averageBuyIn).toBe(0);
    expect(stats.favoriteGameType).toBeNull();
    expect(stats.attendanceByYear).toEqual([]);
    expect(stats.roi).toBeNull();
  });
});
