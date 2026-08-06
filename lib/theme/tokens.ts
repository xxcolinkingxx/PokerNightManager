export const colors = {
  background: "#090909",
  card: "#151515",
  gold: "#D4AF37",
  text: "#F5F5F5",
  textMuted: "rgba(245, 245, 245, 0.6)",
  border: "rgba(255, 255, 255, 0.08)",
  success: "#2ECC71",
  danger: "#E74C3C",
} as const;

export const spacing = {
  navHeight: "4.5rem",
  safeBottom: "env(safe-area-inset-bottom, 0px)",
} as const;

export const radii = {
  sm: "0.5rem",
  md: "0.75rem",
  lg: "1rem",
  xl: "1.25rem",
  full: "9999px",
} as const;

export const animation = {
  spring: { type: "spring" as const, stiffness: 400, damping: 30 },
  ease: { duration: 0.25, ease: [0.25, 0.1, 0.25, 1] as const },
  // Route exits should get out of the way fast -- the incoming page's
  // enter animation is the one worth lingering on.
  exit: { duration: 0.12, ease: [0.4, 0, 1, 1] as const },
} as const;
