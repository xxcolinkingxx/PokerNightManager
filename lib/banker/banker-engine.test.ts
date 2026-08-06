import { beforeEach, describe, expect, it } from "vitest";

import { computeBankerSummary } from "./banker-engine";
import { buyIn, cashOut, makeEvent, playerJoined, rebuy, resetEventSequence } from "@/lib/testing/fixtures";

beforeEach(() => {
  resetEventSequence();
});

describe("computeBankerSummary", () => {
  it("computes expected cash from tagged cash buy-ins/rebuys minus cash-outs", () => {
    const events = [
      playerJoined("p1", "Alice"),
      buyIn("p1", 50, "cash"),
      rebuy("p1", 20, "cash"),
      cashOut("p1", 30, "cash"),
    ];
    const summary = computeBankerSummary(events);
    expect(summary.expectedCash).toBe(40); // 50 + 20 - 30
  });

  it("keeps untagged (pre-Banker-Mode) transactions out of the cash total, reported separately", () => {
    const events = [playerJoined("p1", "Alice"), buyIn("p1", 50), cashOut("p1", 20, "cash")];
    const summary = computeBankerSummary(events);
    expect(summary.expectedCash).toBe(-20); // only the tagged cash_out counts
    expect(summary.untaggedAmount).toBe(50);
  });

  it("tracks non-cash cash-outs as outstanding until settled", () => {
    const events = [
      playerJoined("p1", "Alice"),
      buyIn("p1", 50, "venmo"),
      cashOut("p1", 80, "venmo"),
    ];
    const summary = computeBankerSummary(events);
    expect(summary.outstanding).toEqual([
      { playerId: "p1", playerName: "Alice", method: "venmo", amount: 80 },
    ]);
  });

  it("clears an outstanding balance once payment_settled covers it", () => {
    const events = [
      playerJoined("p1", "Alice"),
      buyIn("p1", 50, "venmo"),
      cashOut("p1", 80, "venmo"),
      makeEvent("payment_settled", { playerId: "p1", amount: 80, method: "venmo" }),
    ];
    const summary = computeBankerSummary(events);
    expect(summary.outstanding).toEqual([]);
  });

  it("leaves a partial outstanding balance after a partial settlement", () => {
    const events = [
      playerJoined("p1", "Alice"),
      buyIn("p1", 50, "venmo"),
      cashOut("p1", 80, "venmo"),
      makeEvent("payment_settled", { playerId: "p1", amount: 30, method: "venmo" }),
    ];
    const summary = computeBankerSummary(events);
    expect(summary.outstanding).toEqual([
      { playerId: "p1", playerName: "Alice", method: "venmo", amount: 50 },
    ]);
  });

  it("never treats a cash cash-out as outstanding", () => {
    const events = [playerJoined("p1", "Alice"), buyIn("p1", 50, "cash"), cashOut("p1", 50, "cash")];
    const summary = computeBankerSummary(events);
    expect(summary.outstanding).toEqual([]);
  });

  it("reports the difference against the most recent manual recount", () => {
    const events = [
      playerJoined("p1", "Alice"),
      buyIn("p1", 100, "cash"),
      makeEvent("cash_recounted", { amount: 90 }),
    ];
    const summary = computeBankerSummary(events);
    expect(summary.actualCash).toBe(90);
    expect(summary.difference).toBe(-10); // short $10
  });

  it("has a null difference until a recount has ever happened", () => {
    const events = [playerJoined("p1", "Alice"), buyIn("p1", 100, "cash")];
    const summary = computeBankerSummary(events);
    expect(summary.actualCash).toBeNull();
    expect(summary.difference).toBeNull();
  });

  it("breaks totals down per payment method", () => {
    const events = [
      playerJoined("p1", "Alice"),
      buyIn("p1", 50, "cash"),
      buyIn("p1", 30, "venmo"),
      cashOut("p1", 20, "venmo"),
    ];
    const summary = computeBankerSummary(events);
    const cash = summary.byMethod.find((m) => m.method === "cash")!;
    const venmo = summary.byMethod.find((m) => m.method === "venmo")!;
    expect(cash.collected).toBe(50);
    expect(cash.paidOut).toBe(0);
    expect(venmo.collected).toBe(30);
    expect(venmo.paidOut).toBe(20);
  });
});
