import type {
  Session,
  SessionEvent,
  SessionEventPayloads,
  SessionEventType,
  SessionWithEvents,
} from "@/lib/session/types";

// Test-only event/session builders. Not imported by app code -- exists
// purely to keep the *.test.ts files from repeating the same event
// boilerplate (id/sequence/timestamp bookkeeping) in every test case.
let sequenceCounter = 0;

export function resetEventSequence(): void {
  sequenceCounter = 0;
}

const BASE_TIME = new Date(2026, 0, 1, 19, 0, 0).getTime();

export function makeEvent<T extends SessionEventType>(
  type: T,
  payload: SessionEventPayloads[T],
  overrides: Partial<{ timestamp: string; sessionId: string; id: string }> = {},
): SessionEvent<T> {
  sequenceCounter += 1;
  return {
    id: overrides.id ?? `evt-${sequenceCounter}`,
    sessionId: overrides.sessionId ?? "session-1",
    type,
    // Each event a minute after the last by default, so array order and
    // chronological order always agree unless a test deliberately
    // overrides a timestamp.
    timestamp: overrides.timestamp ?? new Date(BASE_TIME + sequenceCounter * 60_000).toISOString(),
    payload,
    sequence: sequenceCounter,
  } as SessionEvent<T>;
}

export function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    id: "session-1",
    name: "Friday Night",
    host: "Colin",
    location: "Colin's place",
    type: "cash",
    buyIn: 50,
    startingStack: 5000,
    chipSetId: "chipset-1",
    blindStructureId: "default",
    playerIds: [],
    status: "completed",
    startedAt: new Date(BASE_TIME).toISOString(),
    endedAt: new Date(BASE_TIME + 4 * 60 * 60_000).toISOString(),
    createdAt: new Date(BASE_TIME).toISOString(),
    updatedAt: new Date(BASE_TIME + 4 * 60 * 60_000).toISOString(),
    ...overrides,
  };
}

export function makeSessionWithEvents(
  sessionOverrides: Partial<Session>,
  events: SessionEvent[],
): SessionWithEvents {
  return { session: makeSession(sessionOverrides), events };
}

// Convenience builders for the event types that show up constantly across
// the test suites, so a test reads as a short story ("A joins, buys in,
// cashes out") instead of a wall of payload objects.
export function playerJoined(playerId: string, playerName: string) {
  return makeEvent("player_joined", { playerId, playerName });
}

export function buyIn(playerId: string, amount: number, method?: SessionEventPayloads["buy_in"]["method"]) {
  return makeEvent("buy_in", { playerId, amount, method });
}

export function rebuy(playerId: string, amount: number, method?: SessionEventPayloads["rebuy"]["method"]) {
  return makeEvent("rebuy", { playerId, amount, method });
}

export function cashOut(playerId: string, amount: number, method?: SessionEventPayloads["cash_out"]["method"]) {
  return makeEvent("cash_out", { playerId, amount, method });
}

export function eliminated(playerId: string, position: number) {
  return makeEvent("player_eliminated", { playerId, position });
}
