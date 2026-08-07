"use client";

import { useEffect } from "react";

const FOCUSABLE_TAGS = new Set(["INPUT", "TEXTAREA"]);

function scrollActiveFieldIntoView() {
  const active = document.activeElement;
  if (active instanceof HTMLElement && FOCUSABLE_TAGS.has(active.tagName)) {
    // "nearest" scrolls the minimum distance needed to clear the keyboard.
    // "center" was claiming half of the reserved --keyboard-inset padding
    // as buffer space even when the field only needed to move a little,
    // leaving a large empty gap between the field and the keyboard.
    active.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }
}

function updateKeyboardInset() {
  const viewport = window.visualViewport;
  if (!viewport) return;
  const inset = Math.max(0, window.innerHeight - viewport.height);
  document.documentElement.style.setProperty("--keyboard-inset", `${inset}px`);
}

// Two problems compound on iOS, especially running as an installed
// home-screen PWA: (1) a focused field can have nothing extra below it
// to scroll into -- a short form already fits the screen exactly, so
// there's no slack for the keyboard to reveal by scrolling alone, and
// interactive-widget viewport-meta support (which would otherwise shrink
// the layout to make room) is inconsistent in standalone display mode;
// (2) even when there IS room, iOS doesn't reliably auto-scroll the
// focused field into it, particularly inside a fixed-position sheet.
//
// This fixes both. --keyboard-inset is kept in sync with the actual
// keyboard height via visualViewport and consumed as extra bottom
// padding by both the page body and SheetContent (globals.css,
// sheet.tsx), so there's now real space to scroll into regardless of
// what interactive-widget did or didn't do. The focused field is then
// explicitly scrolled into that space on two redundant triggers, since
// neither alone reliably fires across iOS versions and standalone mode:
// visualViewport's resize event (fires once the keyboard's geometry
// change is final) and a focusin fallback with a short delay for the
// keyboard's open animation.
export function useKeyboardViewportFix(): void {
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    function handleViewportChange() {
      updateKeyboardInset();
      scrollActiveFieldIntoView();
    }

    viewport.addEventListener("resize", handleViewportChange);

    function handleFocusIn(event: FocusEvent) {
      if (!(event.target instanceof HTMLElement)) return;
      if (!FOCUSABLE_TAGS.has(event.target.tagName)) return;
      window.setTimeout(handleViewportChange, 300);
    }
    document.addEventListener("focusin", handleFocusIn);

    return () => {
      viewport.removeEventListener("resize", handleViewportChange);
      document.removeEventListener("focusin", handleFocusIn);
    };
  }, []);
}
