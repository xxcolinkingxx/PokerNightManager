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

export function useSessionTimer(liveState: SessionState | null): string {
  // useSyncExternalStore is the sanctioned way to read an always-changing
  // external value (the wall clock) during render.
  const now = useSyncExternalStore(
    subscribeToClock,
    getClockSnapshot,
    getServerClockSnapshot,
  );

  const isActive = liveState !== null && liveState.session.status === "active";
  const isRunning = isActive && liveState !== null && !liveState.isOnBreak;
  const baseElapsedMs = liveState?.elapsedMs ?? 0;

  // Re-anchor the baseline whenever the store hands us a fresh snapshot
  // (new session, blind change, break toggled, etc). `now` is already a
  // render-safe value from the store above, so this stays pure.
  const [baseline, setBaseline] = useState({
    elapsedMs: baseElapsedMs,
    capturedAt: now,
  });
  if (baseline.elapsedMs !== baseElapsedMs) {
    setBaseline({ elapsedMs: baseElapsedMs, capturedAt: now });
  }

  if (!isActive) {
    return "00:00";
  }

  const elapsed = isRunning
    ? baseline.elapsedMs + Math.max(0, now - baseline.capturedAt)
    : baseline.elapsedMs;

  return formatElapsedTime(elapsed);
}
