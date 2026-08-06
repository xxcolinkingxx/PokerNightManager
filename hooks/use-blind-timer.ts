"use client";

import { useState, useSyncExternalStore } from "react";

import { formatElapsedTime } from "@/lib/session/services/session-engine";
import type { SessionState } from "@/lib/session/types";

// useSyncExternalStore requires getSnapshot to return the *same* value
// between subscribe callbacks -- Date.now() called fresh on every
// invocation violates that (React logs "getSnapshot should be cached"
// and can spiral into repeated re-renders), so the tick is cached here
// and only advanced when the interval actually fires.
let cachedNow = Date.now();

function subscribeToClock(callback: () => void) {
  const interval = setInterval(() => {
    cachedNow = Date.now();
    callback();
  }, 1000);
  return () => clearInterval(interval);
}

function getClockSnapshot() {
  return cachedNow;
}

function getServerClockSnapshot() {
  return 0;
}

export interface BlindTimerResult {
  // null once the structure has no further levels to count down to.
  remainingMs: number | null;
  remainingLabel: string;
}

export function useBlindTimer(liveState: SessionState | null): BlindTimerResult {
  const now = useSyncExternalStore(subscribeToClock, getClockSnapshot, getServerClockSnapshot);

  const isActive = liveState !== null && liveState.session.status === "active";
  const isRunning = isActive && liveState !== null && !liveState.isOnBreak;
  const baseRemainingMs = liveState?.blindLevelRemainingMs ?? null;

  // Re-anchor the baseline whenever the store hands us a fresh snapshot
  // (new session, blind change, break toggled, etc) -- mirrors
  // useSessionTimer's pattern so this stays a cheap tick-by-subtraction
  // instead of re-scanning the event log every second.
  const [baseline, setBaseline] = useState({
    remainingMs: baseRemainingMs,
    capturedAt: now,
  });
  if (baseline.remainingMs !== baseRemainingMs) {
    setBaseline({ remainingMs: baseRemainingMs, capturedAt: now });
  }

  if (!isActive || baseline.remainingMs === null) {
    return {
      remainingMs: null,
      remainingLabel: isActive ? "Final Level" : "--:--",
    };
  }

  const remainingMs = isRunning
    ? Math.max(0, baseline.remainingMs - Math.max(0, now - baseline.capturedAt))
    : baseline.remainingMs;

  return { remainingMs, remainingLabel: formatElapsedTime(remainingMs) };
}
