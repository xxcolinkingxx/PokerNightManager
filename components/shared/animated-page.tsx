"use client";

import { motion, type HTMLMotionProps } from "framer-motion";

import { animation } from "@/lib/theme/tokens";
import { cn } from "@/lib/utils";

interface AnimatedPageProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
}

export function AnimatedPage({ children, className, ...props }: AnimatedPageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={animation.ease}
      className={cn("flex flex-col gap-5", className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}
