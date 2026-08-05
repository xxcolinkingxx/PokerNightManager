import { BLIND_STRUCTURES } from "../constants";
import type {
  BlindLevel,
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
): BlindLevel {
  const structure = BLIND_STRUCTURES.find((s) => s.id === blindStructureId);
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

export function buildSessionState(
  session: Session,
  events: SessionEvent[],
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
    ).level,
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
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
