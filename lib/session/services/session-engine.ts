import type {
  BlindLevel,
  BlindStructure,
  Session,
  SessionEvent,
  SessionState,
} from "../types";

export function generateId(): string {
  return crypto.randomUUID();
}

export function computeElapsedMs(
  events: SessionEvent[],
  now: Date = new Date(),
): number {
  const started = events.find((e) => e.type === "session_started");
  if (!started) return 0;

  const startTime = new Date(started.timestamp).getTime();
  let elapsed = now.getTime() - startTime;

  const breakPeriods: Array<{ start: number; end: number | null }> = [];
  let breakStart: number | null = null;

  for (const event of events) {
    const time = new Date(event.timestamp).getTime();
    if (event.type === "break_started") {
      breakStart = time;
    } else if (event.type === "break_ended" && breakStart !== null) {
      breakPeriods.push({ start: breakStart, end: time });
      breakStart = null;
    }
  }

  if (breakStart !== null) {
    breakPeriods.push({ start: breakStart, end: null });
  }

  for (const period of breakPeriods) {
    const end = period.end ?? now.getTime();
    elapsed -= end - period.start;
  }

  return Math.max(0, elapsed);
}

export function computePot(events: SessionEvent[]): number {
  let pot = 0;

  for (const event of events) {
    if (event.type === "pot_updated") {
      const { action, amount } = event.payload;
      if (action === "set") pot = amount;
      else if (action === "add") pot += amount;
      else if (action === "clear") pot = 0;
    }
  }

  return pot;
}

export function isOnBreak(events: SessionEvent[]): boolean {
  let onBreak = false;
  for (const event of events) {
    if (event.type === "break_started") onBreak = true;
    if (event.type === "break_ended") onBreak = false;
  }
  return onBreak;
}

export function getCurrentBlindLevel(
  events: SessionEvent[],
  blindStructureId: string,
  structures: BlindStructure[],
): BlindLevel {
  const structure = structures.find((s) => s.id === blindStructureId);
  const defaultLevel = structure?.levels[0] ?? {
    level: 1,
    smallBlind: 1,
    bigBlind: 2,
    ante: 0,
    durationMinutes: 20,
  };

  let current = defaultLevel;

  for (const event of events) {
    if (event.type === "blind_increased") {
      const match = structure?.levels.find(
        (l) => l.level === event.payload.level,
      );
      if (match) current = match;
    }
  }

  return current;
}

// Elapsed time within the *current* blind level -- anchored to the most
// recent blind_increased event (or session start, if still on level 1),
// with break time subtracted the same way computeElapsedMs does for the
// whole session.
export function computeBlindLevelElapsedMs(
  events: SessionEvent[],
  now: Date = new Date(),
): number {
  const started = events.find((e) => e.type === "session_started");
  if (!started) return 0;

  let anchor = new Date(started.timestamp).getTime();
  for (const event of events) {
    if (event.type === "blind_increased") {
      anchor = new Date(event.timestamp).getTime();
    }
  }

  let elapsed = now.getTime() - anchor;
  let breakStart: number | null = null;

  for (const event of events) {
    const time = new Date(event.timestamp).getTime();
    if (time < anchor) continue;
    if (event.type === "break_started") {
      breakStart = time;
    } else if (event.type === "break_ended" && breakStart !== null) {
      elapsed -= time - breakStart;
      breakStart = null;
    }
  }

  if (breakStart !== null) {
    elapsed -= now.getTime() - breakStart;
  }

  return Math.max(0, elapsed);
}

// Milliseconds left in the current blind level, or null once the
// structure has no further levels to time toward (final level).
export function computeBlindLevelRemainingMs(
  events: SessionEvent[],
  blindStructureId: string,
  structures: BlindStructure[],
  now: Date = new Date(),
): number | null {
  const structure = structures.find((s) => s.id === blindStructureId);
  const current = getCurrentBlindLevel(events, blindStructureId, structures);
  const hasNextLevel = structure?.levels.some((l) => l.level === current.level + 1) ?? false;
  if (!hasNextLevel) return null;

  const durationMs = current.durationMinutes * 60_000;
  const elapsed = computeBlindLevelElapsedMs(events, now);
  return Math.max(0, durationMs - elapsed);
}

export function buildSessionState(
  session: Session,
  events: SessionEvent[],
  structures: BlindStructure[],
  now: Date = new Date(),
): SessionState {
  return {
    session,
    events,
    elapsedMs: computeElapsedMs(events, now),
    isOnBreak: isOnBreak(events),
    currentPot: computePot(events),
    currentBlindLevel: getCurrentBlindLevel(
      events,
      session.blindStructureId,
      structures,
    ).level,
    blindLevelRemainingMs: computeBlindLevelRemainingMs(
      events,
      session.blindStructureId,
      structures,
      now,
    ),
  };
}

export function formatElapsedTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function formatCurrency(amount: number): string {
  // Whole-dollar amounts (the common case -- buy-ins, pots, etc.) stay
  // clean with no ".00". But settlement math in particular can land on
  // real cents (splitting an unequal pot), and those shouldn't get
  // silently rounded away to the nearest dollar -- someone owing $0.33
  // is not the same as owing nothing.
  const hasCents = Math.round(amount * 100) % 100 !== 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export interface PlayerSessionSummary {
  playerId: string;
  playerName: string;
  // Net money still "on the table" -- (buyInTotal + rebuys) - cashOutTotal.
  // Doubles as a live stack proxy; goes negative once someone cashes out
  // for more than they put in.
  total: number;
  buyInTotal: number;
  cashOutTotal: number;
  seat: number;
  isCashedOut: boolean;
  // Tournament-only: set once a player_eliminated event fires for them.
  isEliminated: boolean;
  finishPosition: number | null;
}

export function getPlayerSummaries(events: SessionEvent[]): PlayerSessionSummary[] {
  const order: string[] = [];
  const names = new Map<string, string>();
  const buyInTotals = new Map<string, number>();
  const cashOutTotals = new Map<string, number>();
  const cashedOut = new Set<string>();
  const finishPositions = new Map<string, number>();

  for (const event of events) {
    if (event.type === "player_joined") {
      const { playerId, playerName } = event.payload;
      if (!names.has(playerId)) order.push(playerId);
      names.set(playerId, playerName);
      if (!buyInTotals.has(playerId)) buyInTotals.set(playerId, 0);
    } else if (event.type === "buy_in" || event.type === "rebuy") {
      const { playerId, amount } = event.payload;
      buyInTotals.set(playerId, (buyInTotals.get(playerId) ?? 0) + amount);
    } else if (event.type === "cash_out") {
      const { playerId, amount } = event.payload;
      cashOutTotals.set(playerId, (cashOutTotals.get(playerId) ?? 0) + amount);
      cashedOut.add(playerId);
    } else if (event.type === "player_eliminated") {
      finishPositions.set(event.payload.playerId, event.payload.position);
    }
  }

  return order.map((playerId, index) => {
    const buyInTotal = buyInTotals.get(playerId) ?? 0;
    const cashOutTotal = cashOutTotals.get(playerId) ?? 0;
    return {
      playerId,
      playerName: names.get(playerId) ?? "Unknown",
      total: buyInTotal - cashOutTotal,
      buyInTotal,
      cashOutTotal,
      // Seats are a pure display computation (join order), not stored
      // state -- deliberately, so this can be removed later without a
      // data migration.
      seat: index + 1,
      isCashedOut: cashedOut.has(playerId),
      isEliminated: finishPositions.has(playerId),
      finishPosition: finishPositions.get(playerId) ?? null,
    };
  });
}

export function computePeakPot(events: SessionEvent[]): number {
  let pot = 0;
  let peak = 0;

  for (const event of events) {
    if (event.type === "pot_updated") {
      const { action, amount } = event.payload;
      if (action === "set") pot = amount;
      else if (action === "add") pot += amount;
      else if (action === "clear") pot = 0;
      peak = Math.max(peak, pot);
    }
  }

  return peak;
}

export function ordinal(n: number): string {
  const remainder100 = n % 100;
  if (remainder100 >= 11 && remainder100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

export function getCurrentDealer(events: SessionEvent[]): string | null {
  let dealerId: string | null = null;
  for (const event of events) {
    if (event.type === "dealer_changed") {
      dealerId = event.payload.playerId;
    }
  }
  return dealerId;
}
