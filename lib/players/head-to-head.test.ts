import { beforeEach, describe, expect, it } from "vitest";

import { computeHeadToHead } from "./head-to-head";
import { buyIn, cashOut, makeSessionWithEvents, playerJoined, resetEventSequence } from "@/lib/testing/fixtures";

beforeEach(() => {
  resetEventSequence();
});

function sessionOverrides(id: string, date: string, playerIds: string[]) {
  return { id, createdAt: date, status: "completed" as const, playerIds };
}

describe("computeHeadToHead", () => {
  it("only counts sessions both players actually shared", () => {
    const together = makeSessionWithEvents(sessionOverrides("s1", "2026-01-01T00:00:00.000Z", ["p1", "p2"]), [
      playerJoined("p1", "Alice"),
      playerJoined("p2", "Bob"),
      buyIn("p1", 50),
      buyIn("p2", 50),
      cashOut("p1", 80),
      cashOut("p2", 20),
    ]);
    const soloSession = makeSessionWithEvents(sessionOverrides("s2", "2026-01-08T00:00:00.000Z", ["p1"]), [
      playerJoined("p1", "Alice"),
      buyIn("p1", 50),
      cashOut("p1", 100),
    ]);

    const stats = computeHeadToHead("p1", "p2", [together, soloSession]);
    expect(stats.meetingsCount).toBe(1);
    expect(stats.meetings[0].sessionId).toBe("s1");
  });

  it("tallies wins based on who did better in each shared session", () => {
    const win = makeSessionWithEvents(sessionOverrides("s1", "2026-01-01T00:00:00.000Z", ["p1", "p2"]), [
      playerJoined("p1", "Alice"),
      playerJoined("p2", "Bob"),
      buyIn("p1", 50),
      buyIn("p2", 50),
      cashOut("p1", 80), // +30
      cashOut("p2", 20), // -30
    ]);
    const loss = makeSessionWithEvents(sessionOverrides("s2", "2026-01-08T00:00:00.000Z", ["p1", "p2"]), [
      playerJoined("p1", "Alice"),
      playerJoined("p2", "Bob"),
      buyIn("p1", 50),
      buyIn("p2", 50),
      cashOut("p1", 10), // -40
      cashOut("p2", 90), // +40
    ]);
    const tie = makeSessionWithEvents(sessionOverrides("s3", "2026-01-15T00:00:00.000Z", ["p1", "p2"]), [
      playerJoined("p1", "Alice"),
      playerJoined("p2", "Bob"),
      buyIn("p1", 50),
      buyIn("p2", 50),
      cashOut("p1", 50),
      cashOut("p2", 50),
    ]);

    const stats = computeHeadToHead("p1", "p2", [win, loss, tie]);
    expect(stats.meetingsCount).toBe(3);
    expect(stats.playerAWins).toBe(1);
    expect(stats.playerBWins).toBe(1);
    expect(stats.ties).toBe(1);
    expect(stats.playerATotalProfit).toBe(30 - 40 + 0);
    expect(stats.playerBTotalProfit).toBe(-30 + 40 + 0);
  });

  it("excludes a session where either player's tournament finish is unresolved", () => {
    const unresolved = makeSessionWithEvents(
      { id: "s1", createdAt: "2026-01-01T00:00:00.000Z", status: "completed", type: "tournament", playerIds: ["p1", "p2"] },
      [playerJoined("p1", "Alice"), playerJoined("p2", "Bob"), buyIn("p1", 20), buyIn("p2", 20)],
    );
    const stats = computeHeadToHead("p1", "p2", [unresolved]);
    expect(stats.meetingsCount).toBe(0);
    expect(stats.meetings).toEqual([]);
  });

  it("ignores sessions that aren't completed yet", () => {
    const active = makeSessionWithEvents(
      { id: "s1", createdAt: "2026-01-01T00:00:00.000Z", status: "active", playerIds: ["p1", "p2"] },
      [playerJoined("p1", "Alice"), playerJoined("p2", "Bob"), buyIn("p1", 50), buyIn("p2", 50)],
    );
    const stats = computeHeadToHead("p1", "p2", [active]);
    expect(stats.meetingsCount).toBe(0);
  });

  it("sorts meetings newest first", () => {
    const older = makeSessionWithEvents(sessionOverrides("s1", "2026-01-01T00:00:00.000Z", ["p1", "p2"]), [
      playerJoined("p1", "Alice"),
      playerJoined("p2", "Bob"),
      buyIn("p1", 50),
      buyIn("p2", 50),
      cashOut("p1", 50),
      cashOut("p2", 50),
    ]);
    const newer = makeSessionWithEvents(sessionOverrides("s2", "2026-02-01T00:00:00.000Z", ["p1", "p2"]), [
      playerJoined("p1", "Alice"),
      playerJoined("p2", "Bob"),
      buyIn("p1", 50),
      buyIn("p2", 50),
      cashOut("p1", 50),
      cashOut("p2", 50),
    ]);
    const stats = computeHeadToHead("p1", "p2", [older, newer]);
    expect(stats.meetings.map((m) => m.sessionId)).toEqual(["s2", "s1"]);
  });

  it("returns a zeroed result when the two have never played together", () => {
    const stats = computeHeadToHead("p1", "p2", []);
    expect(stats).toEqual({
      meetingsCount: 0,
      playerAWins: 0,
      playerBWins: 0,
      ties: 0,
      playerATotalProfit: 0,
      playerBTotalProfit: 0,
      meetings: [],
    });
  });
});
