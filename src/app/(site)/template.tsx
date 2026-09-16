"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * Route transition template — remounts on every navigation, so each page
 * enters with a cinematic dip-in (fade + rise + de-blur) instead of an
 * abrupt jump cut. (Exit is masked by the incoming page's dark backdrop.)
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className="flex flex-1 flex-col"
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 18, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
