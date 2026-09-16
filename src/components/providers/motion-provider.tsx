"use client";

import { MotionConfig } from "framer-motion";

/**
 * Global motion configuration.
 * `reducedMotion="user"` makes Framer Motion automatically strip transform
 * animations for users with prefers-reduced-motion (opacity fades remain),
 * satisfying our accessibility fallback without per-component branching.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
