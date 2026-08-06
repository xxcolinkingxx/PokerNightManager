"use client";

import { motion, type HTMLMotionProps, type Variants } from "framer-motion";

import { animation } from "@/lib/theme/tokens";
import { cn } from "@/lib/utils";

const pageVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: animation.ease },
  exit: { opacity: 0, y: -8, transition: animation.exit },
};

interface AnimatedPageProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
}

export function AnimatedPage({ children, className, ...props }: AnimatedPageProps) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={cn("flex flex-col gap-5", className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}
