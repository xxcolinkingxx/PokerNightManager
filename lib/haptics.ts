"use client";

import { useSettingsStore } from "@/stores/settings-store";

// Short, distinct patterns (ms) for the handful of moments worth a buzz --
// deliberately restrained since a poker night involves a lot of taps and
// constant vibration would be more annoying than useful.
export const HAPTIC_PATTERNS = {
  tap: [10],
  success: [10, 40, 10],
  warning: [15, 60, 15, 60, 15],
};

export type HapticPattern = keyof typeof HAPTIC_PATTERNS;

function fireVibration(pattern: HapticPattern) {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  navigator.vibrate(HAPTIC_PATTERNS[pattern]);
}

// Reads the current setting directly from the store rather than via a
// hook subscription -- this only needs the value at the moment a
// gesture fires, not a reactive re-render on every settings change.
export function triggerHaptic(pattern: HapticPattern = "tap") {
  const settings = useSettingsStore.getState().settings;
  if (settings && !settings.hapticsEnabled) return;
  fireVibration(pattern);
}
