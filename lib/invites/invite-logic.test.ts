import { describe, expect, it } from "vitest";

import { applyRsvp, buildInvite, summarizeRsvps } from "./invite-logic";

const NOW = "2026-01-01T00:00:00.000Z";

describe("buildInvite", () => {
  it("creates an invite with no RSVPs yet", () => {
    const invite = buildInvite(
      "abc123",
      {
        gameName: "Friday Night",
        hostName: "Colin",
        date: "2026-01-10",
        location: "Home",
        buyIn: 50,
        expiresInDays: 90,
      },
      NOW,
    );
    expect(invite).toEqual({
      id: "abc123",
      gameName: "Friday Night",
      hostName: "Colin",
      date: "2026-01-10",
      location: "Home",
      buyIn: 50,
      createdAt: NOW,
      expiresAt: "2026-04-01T00:00:00.000Z",
      rsvps: [],
    });
  });

  it("computes expiresAt from the chosen expiry window, not a fixed default", () => {
    const invite = buildInvite(
      "abc123",
      {
        gameName: "Friday Night",
        hostName: "Colin",
        date: "2026-01-10",
        location: "Home",
        buyIn: 50,
        expiresInDays: 7,
      },
      NOW,
    );
    expect(invite.expiresAt).toBe("2026-01-08T00:00:00.000Z");
  });

  it("allows a null buy-in for TBD", () => {
    const invite = buildInvite(
      "abc123",
      {
        gameName: "Friday Night",
        hostName: "Colin",
        date: "2026-01-10",
        location: "Home",
        buyIn: null,
        expiresInDays: 90,
      },
      NOW,
    );
    expect(invite.buyIn).toBeNull();
  });
});

describe("applyRsvp", () => {
  const base = buildInvite(
    "abc123",
    {
      gameName: "Friday Night",
      hostName: "Colin",
      date: "2026-01-10",
      location: "Home",
      buyIn: 50,
      expiresInDays: 90,
    },
    NOW,
  );

  it("adds a new RSVP", () => {
    const updated = applyRsvp(
      base,
      { guestToken: "t1", name: "Alice", status: "in", eta: null },
      NOW,
    );
    expect(updated.rsvps).toEqual([
      { guestToken: "t1", name: "Alice", status: "in", eta: null, respondedAt: NOW },
    ]);
  });

  it("edits an existing guest's RSVP in place instead of duplicating it", () => {
    const withAlice = applyRsvp(
      base,
      { guestToken: "t1", name: "Alice", status: "maybe", eta: null },
      NOW,
    );
    const updated = applyRsvp(
      withAlice,
      { guestToken: "t1", name: "Alice", status: "in", eta: "7pm" },
      "2026-01-02T00:00:00.000Z",
    );
    expect(updated.rsvps).toHaveLength(1);
    expect(updated.rsvps[0]).toEqual({
      guestToken: "t1",
      name: "Alice",
      status: "in",
      eta: "7pm",
      respondedAt: "2026-01-02T00:00:00.000Z",
    });
  });

  it("keeps different guests' RSVPs independent", () => {
    const withAlice = applyRsvp(
      base,
      { guestToken: "t1", name: "Alice", status: "in", eta: null },
      NOW,
    );
    const withBoth = applyRsvp(
      withAlice,
      { guestToken: "t2", name: "Bob", status: "out", eta: null },
      NOW,
    );
    expect(withBoth.rsvps).toHaveLength(2);
    expect(withBoth.rsvps.map((r) => r.name).sort()).toEqual(["Alice", "Bob"]);
  });

  it("doesn't mutate the original invite", () => {
    applyRsvp(base, { guestToken: "t1", name: "Alice", status: "in", eta: null }, NOW);
    expect(base.rsvps).toEqual([]);
  });
});

describe("summarizeRsvps", () => {
  it("counts each status independently", () => {
    let invite = buildInvite(
      "abc123",
      {
        gameName: "Friday Night",
        hostName: "Colin",
        date: "2026-01-10",
        location: "Home",
        buyIn: 50,
        expiresInDays: 90,
      },
      NOW,
    );
    invite = applyRsvp(invite, { guestToken: "t1", name: "Alice", status: "in", eta: null }, NOW);
    invite = applyRsvp(invite, { guestToken: "t2", name: "Bob", status: "in", eta: null }, NOW);
    invite = applyRsvp(invite, { guestToken: "t3", name: "Cara", status: "maybe", eta: null }, NOW);
    invite = applyRsvp(invite, { guestToken: "t4", name: "Dee", status: "out", eta: null }, NOW);

    expect(summarizeRsvps(invite)).toEqual({ inCount: 2, maybeCount: 1, outCount: 1 });
  });

  it("returns all zeros for no RSVPs yet", () => {
    const invite = buildInvite(
      "abc123",
      {
        gameName: "Friday Night",
        hostName: "Colin",
        date: "2026-01-10",
        location: "Home",
        buyIn: 50,
        expiresInDays: 90,
      },
      NOW,
    );
    expect(summarizeRsvps(invite)).toEqual({ inCount: 0, maybeCount: 0, outCount: 0 });
  });
});
