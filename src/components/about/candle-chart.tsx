"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { TrendingDown, TrendingUp } from "lucide-react";
import { usePrefersReducedMotion } from "@/lib/hooks";
import { cn } from "@/lib/utils";

/**
 * JJ ONYX — stylized candlestick chart.
 * 14 hand-told candles: heavy sell-off → capitulation → disciplined recovery →
 * breakout. Candles grow in on scroll (staggered), a gold close-line draws over
 * them, and a live EURUSD ticker random-walks (gated by in-view + reduced-motion).
 */

type Candle = { o: number; c: number; h: number; l: number };

const CANDLES: Candle[] = [
  { o: 62, c: 58, h: 66, l: 55 },
  { o: 58, c: 60, h: 63, l: 54 },
  { o: 60, c: 51, h: 61, l: 49 },
  { o: 51, c: 44, h: 53, l: 42 },
  { o: 44, c: 47, h: 50, l: 40 },
  { o: 47, c: 39, h: 48, l: 36 },
  { o: 39, c: 34, h: 41, l: 31 },
  { o: 34, c: 41, h: 43, l: 32 },
  { o: 41, c: 38, h: 44, l: 35 },
  { o: 38, c: 48, h: 50, l: 36 },
  { o: 48, c: 57, h: 59, l: 46 },
  { o: 57, c: 54, h: 60, l: 52 },
  { o: 54, c: 66, h: 68, l: 53 },
  { o: 66, c: 78, h: 81, l: 64 },
];

const BODY_W = 14;
const STEP = 27;
const X0 = 14;

const xAt = (i: number) => X0 + i * STEP;
const yAt = (p: number) => 128 - (p - 28) * 1.9;

const BASE = 1.0842;

const GRID: Array<{ p: number; label: string }> = [
  { p: 40, label: "1.0822" },
  { p: 60, label: "1.0842" },
  { p: 80, label: "1.0862" },
];

export function CandleChart({ className }: { className?: string }) {
  const reduce = usePrefersReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  // not `once` — pause the live ticker whenever the chart leaves the viewport
  const inView = useInView(ref, { margin: "-40px" });
  const [price, setPrice] = useState(BASE);

  useEffect(() => {
    if (!inView || reduce) return;
    const id = window.setInterval(() => {
      setPrice((p) => {
        const next = p + (Math.random() - 0.5) * 0.0012;
        return Math.min(Math.max(next, BASE - 0.0006), BASE + 0.0006);
      });
    }, 150);
    return () => window.clearInterval(id);
  }, [inView, reduce]);

  const deltaPct = ((price - BASE) / BASE) * 100;
  const up = price >= BASE;
  const closePath = CANDLES.map((k, i) => `${xAt(i)},${yAt(k.c).toFixed(1)}`).join(" ");

  return (
    <div
      ref={ref}
      className={cn("rounded-lg border border-white/10 bg-onyx-950/80 p-4 backdrop-blur", className)}
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground">
          EURUSD · 15M · LDN
        </span>
        <span className="flex items-center gap-2 font-mono text-[10px] tracking-[0.3em] text-mint">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-mint opacity-60 motion-safe:animate-ping" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-mint" />
          </span>
          LIVE
        </span>
      </div>

      <svg
        viewBox="0 0 400 140"
        className="block w-full"
        role="img"
        aria-label="Candlestick chart: a sell-off, a disciplined recovery, then a breakout"
      >
        {GRID.map((g) => (
          <g key={g.p}>
            <line
              x1={0}
              x2={400}
              y1={yAt(g.p)}
              y2={yAt(g.p)}
              stroke="rgba(242,239,232,0.06)"
              strokeWidth={1}
            />
            <text
              x={4}
              y={yAt(g.p) - 4}
              fill="rgba(155,155,167,0.55)"
              fontSize={7}
              fontFamily="var(--font-jetbrains), monospace"
            >
              {g.label}
            </text>
          </g>
        ))}

        {CANDLES.map((k, i) => {
          const bull = k.c >= k.o;
          const top = yAt(Math.max(k.o, k.c));
          const h = Math.max(yAt(Math.min(k.o, k.c)) - top, 2);
          return (
            <motion.g
              key={i}
              initial={{ scaleY: 0, opacity: 0 }}
              whileInView={{ scaleY: 1, opacity: 1 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
              style={{ transformBox: "fill-box", transformOrigin: "bottom" }}
            >
              <line
                x1={xAt(i)}
                x2={xAt(i)}
                y1={yAt(k.h)}
                y2={yAt(k.l)}
                stroke="#D4A857"
                strokeOpacity={0.55}
                strokeWidth={1.4}
              />
              <rect
                x={xAt(i) - BODY_W / 2}
                y={top}
                width={BODY_W}
                height={h}
                rx={1.5}
                fill={bull ? "#00E5A0" : "#E5484D"}
                fillOpacity={bull ? 0.9 : 0.8}
              />
            </motion.g>
          );
        })}

        <motion.path
          d={`M ${closePath}`}
          fill="none"
          stroke="#D4A857"
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          whileInView={{ pathLength: 1, opacity: 1 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 2, delay: 0.9, ease: "easeInOut" }}
        />
      </svg>

      {/* live ticker */}
      <div className="mt-4 flex items-end justify-between border-t border-white/5 pt-3">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground">EURUSD</span>
          <span className="font-mono text-2xl leading-none tabular-nums text-mint">
            {price.toFixed(4)}
          </span>
        </div>
        <span
          className={cn(
            "flex items-center gap-1 font-mono text-xs tabular-nums",
            up ? "text-mint" : "text-[#E5484D]"
          )}
        >
          {up ? (
            <TrendingUp className="h-3.5 w-3.5" aria-hidden />
          ) : (
            <TrendingDown className="h-3.5 w-3.5" aria-hidden />
          )}
          {up ? "+" : ""}
          {deltaPct.toFixed(2)}%
        </span>
      </div>
    </div>
  );
}
