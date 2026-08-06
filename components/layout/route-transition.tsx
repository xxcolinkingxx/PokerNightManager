"use client";

import { AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

interface RouteTransitionProps {
  children: React.ReactNode;
}

// AnimatedPage already defines an enter + exit animation, but with
// nothing tracking route identity, Next.js just swaps the tree instantly
// and the exit half never gets a chance to play. Keying on the pathname
// here gives AnimatePresence something to diff, so leaving a page
// actually animates out before the next one animates in.
export function RouteTransition({ children }: RouteTransitionProps) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <div key={pathname} className="flex flex-1 flex-col">
        {children}
      </div>
    </AnimatePresence>
  );
}
