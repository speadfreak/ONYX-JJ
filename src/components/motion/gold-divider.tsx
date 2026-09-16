"use client";

import { useId } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Animated SVG divider — a thin gold line that "draws" itself across the
 * screen (stroke-dashoffset/pathLength animation) on scroll-into-view,
 * with a small faceted onyx diamond at the center.
 */
export function GoldDivider({
  className,
  width = "max-w-5xl",
}: {
  className?: string;
  width?: string;
}) {
  const id = useId();
  return (
    <div aria-hidden className={cn("relative flex justify-center px-4", className)}>
      <svg viewBox="0 0 1200 24" fill="none" className={cn("w-full", width)} role="presentation">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1200" y2="0" gradientUnits="userSpaceOnUse">
            <stop stopColor="#D4A857" stopOpacity="0" />
            <stop offset="0.5" stopColor="#D4A857" />
            <stop offset="1" stopColor="#D4A857" stopOpacity="0" />
          </linearGradient>
        </defs>
        <motion.line
          x1="0"
          y1="12"
          x2="560"
          y2="12"
          stroke={`url(#${id})`}
          strokeWidth="1"
          initial={{ pathLength: 0, opacity: 0 }}
          whileInView={{ pathLength: 1, opacity: 1 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 1.3, ease: "easeOut" }}
        />
        <motion.line
          x1="640"
          y1="12"
          x2="1200"
          y2="12"
          stroke={`url(#${id})`}
          strokeWidth="1"
          initial={{ pathLength: 0, opacity: 0 }}
          whileInView={{ pathLength: 1, opacity: 1 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 1.3, delay: 0.15, ease: "easeOut" }}
        />
        <motion.path
          d="M600 4 L609 12 L600 20 L591 12 Z"
          stroke="#D4A857"
          strokeWidth="1.2"
          fill="rgba(212,168,87,0.12)"
          initial={{ scale: 0, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
          style={{ transformOrigin: "600px 12px" }}
        />
      </svg>
    </div>
  );
}
