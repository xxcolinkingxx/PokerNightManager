"use client";

import { useEffect, useState } from "react";

import { formatElapsedTime } from "@/lib/session/services/session-engine";
import type { SessionState } from "@/lib/session/types";

export function useSessionTimer(liveState: SessionState | null): string {
  const [display, setDisplay] = useState("00:00");

  useEffect(() => {
    if (!liveState || liveState.session.status !== "active") {
      setDisplay("00:00");
      return;
    }

    function tick() {
      if (!liveState) return;
      const base = liveState.elapsedMs;
      const startedAt = Date.now();
      const startElapsed = base;

      const interval = setInterval(() => {
        if (liveState.isOnBreak) {
          setDisplay(formatElapsedTime(startElapsed));
          return;
        }
        const elapsed = startElapsed + (Date.now() - startedAt);
        setDisplay(formatElapsedTime(elapsed));
      }, 1000);

      setDisplay(formatElapsedTime(startElapsed));

      return () => clearInterval(interval);
    }

    const cleanup = tick();
    return cleanup;
  }, [liveState]);

  return display;
}
