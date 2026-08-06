"use client";

import { motion, type HTMLMotionProps } from "framer-motion";

import { animation } from "@/lib/theme/tokens";
import { cn } from "@/lib/utils";

interface AnimatedPageProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
}

// Enter-only: an `exit` variant here only ever animates when a
// containing AnimatePresence tells it to. Route-level exit animations
// were tried (AnimatePresence keyed on pathname) and reverted -- both
// "wait" and "popLayout" mode made a real fraction of immediate
// post-navigation taps land on nothing (the incoming page not mounted
// yet, or a duplicate/overlapping outgoing page) instead of a
// reliable app. Entering is what people actually notice; leaving isn't
// worth the risk.
export function AnimatedPage({ children, className, ...props }: AnimatedPageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={animation.ease}
      className={cn("flex flex-col gap-5", className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}
