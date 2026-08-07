import { describe, expect, it } from "vitest";

import { createInviteSchema, rsvpSchema } from "./schemas";

describe("createInviteSchema", () => {
  const base = { gameName: "Friday Night", hostName: "Colin", date: "2026-01-10", location: "Home" };

  it("accepts a numeric buy-in", () => {
    const result = createInviteSchema.parse({ ...base, buyIn: 50 });
    expect(result.buyIn).toBe(50);
  });

  it("treats a blank buy-in as TBD (null)", () => {
    const result = createInviteSchema.parse({ ...base, buyIn: "" });
    expect(result.buyIn).toBeNull();
  });

  it("treats an omitted buy-in as TBD (null)", () => {
    const result = createInviteSchema.parse(base);
    expect(result.buyIn).toBeNull();
  });

  it("coerces a numeric string buy-in", () => {
    const result = createInviteSchema.parse({ ...base, buyIn: "75" });
    expect(result.buyIn).toBe(75);
  });

  it("rejects a negative buy-in", () => {
    expect(() => createInviteSchema.parse({ ...base, buyIn: -5 })).toThrow();
  });

  it("rejects a missing game name", () => {
    expect(() => createInviteSchema.parse({ ...base, gameName: "" })).toThrow();
  });

  it("defaults expiresInDays to 90 when omitted", () => {
    const result = createInviteSchema.parse(base);
    expect(result.expiresInDays).toBe(90);
  });

  it("accepts any of the documented expiry options", () => {
    for (const days of [1, 3, 7, 14, 30, 90]) {
      expect(createInviteSchema.parse({ ...base, expiresInDays: days }).expiresInDays).toBe(days);
    }
  });

  it("rejects an expiry that isn't one of the offered options", () => {
    expect(() => createInviteSchema.parse({ ...base, expiresInDays: 45 })).toThrow();
  });
});

describe("rsvpSchema", () => {
  it("accepts a valid RSVP", () => {
    const result = rsvpSchema.parse({ guestToken: "t1", name: "Alice", status: "in", eta: "7pm" });
    expect(result).toEqual({ guestToken: "t1", name: "Alice", status: "in", eta: "7pm" });
  });

  it("defaults a missing eta to null", () => {
    const result = rsvpSchema.parse({ guestToken: "t1", name: "Alice", status: "in" });
    expect(result.eta).toBeNull();
  });

  it("rejects an invalid status", () => {
    expect(() =>
      rsvpSchema.parse({ guestToken: "t1", name: "Alice", status: "definitely" }),
    ).toThrow();
  });

  it("rejects a missing name", () => {
    expect(() => rsvpSchema.parse({ guestToken: "t1", name: "", status: "in" })).toThrow();
  });
});
