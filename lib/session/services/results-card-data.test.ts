import { beforeEach, describe, expect, it } from "vitest";

import { buildResultsCardData } from "./results-card-data";
import { buyIn, cashOut, eliminated, makeSession, playerJoined, resetEventSequence } from "@/lib/testing/fixtures";

beforeEach(() => {
  resetEventSequence();
});

describe("buildResultsCardData", () => {
  it("sorts players by profit descending", () => {
    const session = makeSession({ type: "cash" });
    const events = [
      playerJoined("p1", "Alice"),
      playerJoined("p2", "Bob"),
      playerJoined("p3", "Cara"),
      buyIn("p1", 50),
      buyIn("p2", 50),
      buyIn("p3", 50),
      cashOut("p1", 20), // -30
      cashOut("p2", 100), // +50
      cashOut("p3", 50), // 0
    ];

    const data = buildResultsCardData(session, events);
    expect(data.rows.map((r) => r.playerName)).toEqual(["Bob", "Cara", "Alice"]);
    expect(data.rows.map((r) => r.profit)).toEqual([50, 0, -30]);
  });

  it("sinks unresolved tournament results to the bottom instead of ranking them last-place-loss", () => {
    const session = makeSession({ type: "tournament" });
    const events = [
      playerJoined("p1", "Alice"),
      playerJoined("p2", "Bob"),
      buyIn("p1", 20),
      buyIn("p2", 20),
      // Nobody eliminated -- both unresolved.
    ];

    const data = buildResultsCardData(session, events);
    expect(data.rows.every((r) => r.profit === null)).toBe(true);
  });

  it("puts the tournament winner (implicit last-standing) first", () => {
    const session = makeSession({ type: "tournament" });
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

    const data = buildResultsCardData(session, events);
    expect(data.rows[0].playerName).toBe("Alice");
  });

  it("includes the session name, date, and location", () => {
    const session = makeSession({
      name: "Friday Regulars",
      location: "Colin's Garage",
      createdAt: "2026-03-15T00:00:00.000Z",
    });
    const data = buildResultsCardData(session, []);
    expect(data.sessionName).toBe("Friday Regulars");
    expect(data.locationLabel).toBe("Colin's Garage");
    expect(data.dateLabel).toBe("Mar 15, 2026");
  });
});
