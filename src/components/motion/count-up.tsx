"use client";

import { useEffect, useRef } from "react";
import { animate, useInView, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/** Animated counting number, triggered when scrolled into view. */
export function CountUp({
  to,
  duration = 1.8,
  prefix = "",
  suffix = "",
  className,
}: {
  to: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduce = useReducedMotion();
  // Harden: feed a finite number no matter what the data layer sends
  // (NaN/undefined previously left the counter stuck at 0 forever).
  const target = Number.isFinite(Number(to)) ? Number(to) : 0;

  useEffect(() => {
    const el = ref.current;
    if (!el || !inView) return;
    const fmt = (v: number) => `${prefix}${Math.round(v)}${suffix}`;
    if (reduce) {
      el.textContent = fmt(target);
      return;
    }
    const controls = animate(0, target, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => {
        if (ref.current) ref.current.textContent = fmt(v);
      },
    });
    return () => controls.stop();
  }, [inView, target, duration, prefix, suffix, reduce]);

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {prefix}0{suffix}
    </span>
  );
}
