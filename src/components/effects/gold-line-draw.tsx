/**
 * Thin gold divider that draws itself in when scrolled into view —
 * the closing section's zone separator (replaces plain <hr> rules).
 *
 * Pure SVG + CSS: the stroke animates via stroke-dashoffset once. Users with
 * prefers-reduced-motion get the finished line immediately (see globals.css).
 * IntersectionObserver adds .is-inview on first intersection only.
 */
"use client";

import { useEffect, useRef } from "react";

export function GoldLineDraw({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          el.classList.add("is-inview");
          io.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} aria-hidden className={`jj-line-draw ${className}`}>
      <svg viewBox="0 0 1200 2" preserveAspectRatio="none" className="h-px w-full" fill="none">
        <line x1="0" y1="1" x2="1200" y2="1" stroke="url(#jj-line-gold)" strokeWidth="1.5" pathLength={1} />
        <defs>
          <linearGradient id="jj-line-gold" x1="0" y1="0" x2="1200" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#D4A857" stopOpacity="0" />
            <stop offset="0.18" stopColor="#D4A857" stopOpacity="0.55" />
            <stop offset="0.5" stopColor="#E8C77F" stopOpacity="0.9" />
            <stop offset="0.82" stopColor="#D4A857" stopOpacity="0.55" />
            <stop offset="1" stopColor="#D4A857" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
