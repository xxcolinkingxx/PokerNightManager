import { beforeEach, describe, expect, it } from "vitest";

import {
  computeElapsedMs,
  computePeakPot,
  computePot,
  formatCurrency,
  formatElapsedTime,
  getCurrentDealer,
  getPlayerSummaries,
  isOnBreak,
  ordinal,
} from "./session-engine";
import { buyIn, cashOut, makeEvent, playerJoined, rebuy, resetEventSequence } from "@/lib/testing/fixtures";

beforeEach(() => {
  resetEventSequence();
});

describe("computePot", () => {
  it("applies set/add/clear in order", () => {
    const events = [
      makeEvent("pot_updated", { amount: 100, action: "set" }),
      makeEvent("pot_updated", { amount: 25, action: "add" }),
      makeEvent("pot_updated", { amount: 0, action: "clear" }),
      makeEvent("pot_updated", { amount: 40, action: "add" }),
    ];
    expect(computePot(events)).toBe(40);
  });

  it("is 0 with no pot events", () => {
    expect(computePot([])).toBe(0);
  });
});

describe("computePeakPot", () => {
  it("tracks the highest pot ever reached, not the final value", () => {
    const events = [
      makeEvent("pot_updated", { amount: 200, action: "set" }),
      makeEvent("pot_updated", { amount: 0, action: "clear" }),
      makeEvent("pot_updated", { amount: 50, action: "add" }),
    ];
    expect(computePeakPot(events)).toBe(200);
  });
});

describe("isOnBreak", () => {
  it("reflects the most recent break event", () => {
    expect(isOnBreak([makeEvent("break_started", {})])).toBe(true);
    expect(
      isOnBreak([makeEvent("break_started", {}), makeEvent("break_ended", {})]),
    ).toBe(false);
  });
});

describe("computeElapsedMs", () => {
  it("returns 0 when the session never started", () => {
    expect(computeElapsedMs([])).toBe(0);
  });

  it("subtracts completed break periods", () => {
    const start = new Date(2026, 0, 1, 19, 0, 0);
    const breakStart = new Date(2026, 0, 1, 19, 30, 0);
    const breakEnd = new Date(2026, 0, 1, 19, 45, 0);
    const now = new Date(2026, 0, 1, 20, 0, 0);

    const events = [
      makeEvent("session_started", {}, { timestamp: start.toISOString() }),
      makeEvent("break_started", {}, { timestamp: breakStart.toISOString() }),
      makeEvent("break_ended", {}, { timestamp: breakEnd.toISOString() }),
    ];

    // 1 hour total, minus a 15 minute break = 45 minutes.
    expect(computeElapsedMs(events, now)).toBe(45 * 60_000);
  });

  it("subtracts time still on an open-ended break", () => {
    const start = new Date(2026, 0, 1, 19, 0, 0);
    const breakStart = new Date(2026, 0, 1, 19, 30, 0);
    const now = new Date(2026, 0, 1, 20, 0, 0);

    const events = [
      makeEvent("session_started", {}, { timestamp: start.toISOString() }),
      makeEvent("break_started", {}, { timestamp: breakStart.toISOString() }),
    ];

    // 1 hour total, minus the 30 minutes spent on the still-open break.
    expect(computeElapsedMs(events, now)).toBe(30 * 60_000);
  });

  it("never returns negative elapsed time", () => {
    const now = new Date(2026, 0, 1, 19, 0, 0);
    const events = [makeEvent("session_started", {}, { timestamp: now.toISOString() })];
    const earlier = new Date(now.getTime() - 1000);
    expect(computeElapsedMs(events, earlier)).toBe(0);
  });
});

describe("getPlayerSummaries", () => {
  it("aggregates buy-ins, rebuys, and cash-outs per player in join order", () => {
    const events = [
      playerJoined("p1", "Alice"),
      playerJoined("p2", "Bob"),
      buyIn("p1", 50),
      buyIn("p2", 50),
      rebuy("p1", 25),
      cashOut("p2", 80),
    ];

    const summaries = getPlayerSummaries(events);
    expect(summaries).toHaveLength(2);

    expect(summaries[0]).toMatchObject({
      playerId: "p1",
      playerName: "Alice",
      buyInTotal: 75,
      cashOutTotal: 0,
      total: 75,
      seat: 1,
      isCashedOut: false,
    });
    expect(summaries[1]).toMatchObject({
      playerId: "p2",
      playerName: "Bob",
      buyInTotal: 50,
      cashOutTotal: 80,
      total: -30,
      seat: 2,
      isCashedOut: true,
    });
  });

  it("tracks elimination position for tournament players", () => {
    const events = [
      playerJoined("p1", "Alice"),
      playerJoined("p2", "Bob"),
      makeEvent("player_eliminated", { playerId: "p2", position: 2 }),
    ];
    const summaries = getPlayerSummaries(events);
    const bob = summaries.find((s) => s.playerId === "p2")!;
    expect(bob.isEliminated).toBe(true);
    expect(bob.finishPosition).toBe(2);

    const alice = summaries.find((s) => s.playerId === "p1")!;
    expect(alice.isEliminated).toBe(false);
    expect(alice.finishPosition).toBeNull();
  });

  it("uses the most recent name if a player was renamed mid-session", () => {
    const events = [playerJoined("p1", "Al"), playerJoined("p1", "Alice")];
    expect(getPlayerSummaries(events)[0].playerName).toBe("Alice");
    // Renaming doesn't create a second entrant.
    expect(getPlayerSummaries(events)).toHaveLength(1);
  });
});

describe("getCurrentDealer", () => {
  it("returns the most recently assigned dealer", () => {
    const events = [
      makeEvent("dealer_changed", { playerId: "p1" }),
      makeEvent("dealer_changed", { playerId: "p2" }),
    ];
    expect(getCurrentDealer(events)).toBe("p2");
  });

  it("returns null when no dealer has been set", () => {
    expect(getCurrentDealer([])).toBeNull();
  });
});

describe("ordinal", () => {
  it("handles the normal cases", () => {
    expect(ordinal(1)).toBe("1st");
    expect(ordinal(2)).toBe("2nd");
    expect(ordinal(3)).toBe("3rd");
    expect(ordinal(4)).toBe("4th");
  });

  it("handles the 11-13 exception", () => {
    expect(ordinal(11)).toBe("11th");
    expect(ordinal(12)).toBe("12th");
    expect(ordinal(13)).toBe("13th");
  });

  it("handles the teens-repeat cases (21st, 22nd, 23rd)", () => {
    expect(ordinal(21)).toBe("21st");
    expect(ordinal(22)).toBe("22nd");
    expect(ordinal(23)).toBe("23rd");
    expect(ordinal(111)).toBe("111th");
  });
});

describe("formatElapsedTime", () => {
  it("formats minutes:seconds under an hour", () => {
    expect(formatElapsedTime(65_000)).toBe("01:05");
  });

  it("formats hours:minutes:seconds over an hour", () => {
    expect(formatElapsedTime(3_661_000)).toBe("1:01:01");
  });
});

describe("formatCurrency", () => {
  it("formats whole dollars with no cents", () => {
    expect(formatCurrency(1234)).toBe("$1,234");
  });

  it("rounds fractional amounts", () => {
    expect(formatCurrency(75.5)).toBe("$76");
  });

  it("formats negative amounts", () => {
    expect(formatCurrency(-40)).toBe("-$40");
  });
});
