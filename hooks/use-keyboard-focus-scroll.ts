"use client";

import { useEffect } from "react";

const FOCUSABLE_TAGS = new Set(["INPUT", "TEXTAREA"]);

function scrollActiveFieldIntoView() {
  const active = document.activeElement;
  if (active instanceof HTMLElement && FOCUSABLE_TAGS.has(active.tagName)) {
    active.scrollIntoView({ block: "center", behavior: "smooth" });
  }
}

// iOS doesn't reliably scroll a newly-focused input above the on-screen
// keyboard on its own -- especially running as an installed home-screen
// PWA, and especially inside a fixed-position sheet (the wizard, edit
// sheets), where the browser's native "scroll the focused field into
// view" heuristic often just doesn't fire. The interactive-widget
// viewport meta helps the layout react to the keyboard at all, but
// doesn't guarantee the focused element itself ends up visible.
//
// Two redundant triggers, since neither is reliable alone across iOS
// versions and standalone-PWA mode: visualViewport's resize event
// (fires once the keyboard's geometry change is actually final) and a
// focusin fallback with a short delay for the keyboard's open animation,
// in case resize never fires (observed to depend on iOS version and
// interactive-widget mode).
export function useKeyboardFocusScroll(): void {
  useEffect(() => {
    const viewport = window.visualViewport;
    viewport?.addEventListener("resize", scrollActiveFieldIntoView);

    function handleFocusIn(event: FocusEvent) {
      if (!(event.target instanceof HTMLElement)) return;
      if (!FOCUSABLE_TAGS.has(event.target.tagName)) return;
      window.setTimeout(scrollActiveFieldIntoView, 300);
    }
    document.addEventListener("focusin", handleFocusIn);

    return () => {
      viewport?.removeEventListener("resize", scrollActiveFieldIntoView);
      document.removeEventListener("focusin", handleFocusIn);
    };
  }, []);
}
