"use client";

import type { CSSProperties } from "react";
import { motion } from "framer-motion";

import { usePrefersReducedMotion } from "@/lib/hooks";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

interface CotRow {
  label: string;
  /** % of track to the left of the axis (short positioning) */
  short: number;
  /** % of track to the right of the axis (long positioning) */
  long: number;
  /** solid bar color (long side) */
  color: string;
  /** dimmed variant (short side) */
  dim: string;
}

const ROWS: CotRow[] = [
  { label: "COMMERCIALS", short: 26, long: 64, color: "#D4A857", dim: "rgba(212,168,87,0.32)" },
  { label: "LARGE SPECS", short: 34, long: 52, color: "#22D3EE", dim: "rgba(34,211,238,0.3)" },
  { label: "RETAIL", short: 56, long: 15, color: "#8B8F9A", dim: "rgba(139,143,154,0.28)" },
];

function DivergingBar({
  side,
  width,
  color,
  delay,
  reduced,
}: {
  side: "left" | "right";
  width: number;
  color: string;
  delay: number;
  reduced: boolean;
}) {
  const pos = side === "left" ? "right-1/2 rounded-l-[3px]" : "left-1/2 rounded-r-[3px]";
  const style: CSSProperties = {
    width: `${width}%`,
    backgroundColor: color,
    transformOrigin: side === "left" ? "right center" : "left center",
  };

  if (reduced) {
    return <div aria-hidden className={cn("absolute inset-y-1", pos)} style={style} />;
  }

  return (
    <motion.div
      aria-hidden
      className={cn("absolute inset-y-1", pos)}
      style={style}
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.9, delay, ease: EASE }}
    />
  );
}

/**
 * Compact COT positioning visual — three diverging bars (short ◀ | ▶ long)
 * per cohort, scaleX-drawn on scroll into view. Static under reduced motion.
 */
export function CotBars({ className }: { className?: string }) {
  const reduced = usePrefersReducedMotion();

  return (
    <div className={cn("rounded-xl border border-white/8 bg-onyx-900/50 p-5", className)}>
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-[10px] tracking-[0.28em] text-white/60">COT POSITIONING — WEEKLY</span>
        <span className="font-mono text-[9px] tracking-[0.2em] text-muted-foreground">MODELED SKEW</span>
      </div>

      {/* legend / direction row */}
      <div className="mt-5 flex items-center gap-3 font-mono text-[8px] tracking-[0.22em] text-white/35 sm:gap-4 sm:text-[9px]">
        <span className="w-20 shrink-0 sm:w-28" />
        <span className="flex flex-1 justify-between">
          <span>◀ SHORT</span>
          <span>LONG ▶</span>
        </span>
      </div>

      <div className="mt-3 space-y-4">
        {ROWS.map((row, i) => (
          <div key={row.label} className="flex items-center gap-3 sm:gap-4">
            <span className="w-20 shrink-0 font-mono text-[9px] tracking-[0.22em] text-white/60 sm:w-28 sm:text-[10px]">
              {row.label}
            </span>
            <div className="relative h-6 flex-1">
              <span aria-hidden className="absolute inset-y-0 left-1/2 w-px bg-white/10" />
              <DivergingBar side="left" width={row.short} color={row.dim} delay={reduced ? 0 : 0.1 + i * 0.15} reduced={reduced} />
              <DivergingBar side="right" width={row.long} color={row.color} delay={reduced ? 0 : 0.22 + i * 0.15} reduced={reduced} />
            </div>
          </div>
        ))}
      </div>

      <p className="mt-5 text-[11px] leading-relaxed text-muted-foreground">
        Commercial hedgers lean net long into spec strength while retail chases the other side — the asymmetry the signal
        models hunt.
      </p>
    </div>
  );
}
