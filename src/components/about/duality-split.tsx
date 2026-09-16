"use client";

import { useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { GradientMesh } from "@/components/effects/gradient-mesh";
import { GoldDivider } from "@/components/motion/gold-divider";
import { Reveal } from "@/components/motion/reveal";
import { useIsMobile, usePrefersReducedMotion } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import { CandleChart } from "./candle-chart";
import { TerminalCard } from "./terminal-card";

/**
 * JJ ONYX /about — THE DUALITY centerpiece.
 *
 * Desktop (fine pointer, motion OK): a CSS-sticky scroll stage (h-[280vh]).
 * The Developer panel rises in first, the Trader panel joins, both breathe
 * while the user scrolls, then dim under "THE SYNTHESIS" merge overlay.
 * Driven purely by framer-motion useScroll + CSS sticky — robust with Lenis,
 * no GSAP pinning.
 *
 * Mobile / prefers-reduced-motion: <DualityStatic /> — the same panels stacked
 * with standard Reveal entrances, no pinning, no scroll choreography.
 */

/* ── deterministic circuit rain (SSR-safe — no Math.random in render) ─────── */

const HEX = "0123456789abcdef";

function hexColumn(seed: number, rows: number, cols: number): string {
  let s = seed >>> 0;
  const out: string[] = [];
  for (let r = 0; r < rows; r++) {
    let row = "";
    for (let c = 0; c < cols; c++) {
      s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
      const sym = s % 9 === 0 ? "·" : HEX[(s >>> 4) % 16];
      row += s % 5 === 0 ? " " : sym;
    }
    out.push(row);
  }
  return out.join("\n");
}

const CIRCUIT = [
  { text: hexColumn(11, 56, 12), className: "left-[4%] w-28", duration: 22 },
  { text: hexColumn(47, 56, 10), className: "left-[30%] w-24", duration: 27 },
  { text: hexColumn(89, 56, 14), className: "left-[58%] w-32", duration: 32 },
  { text: hexColumn(151, 56, 11), className: "left-[84%] w-24", duration: 36 },
] as const;

/* ── copy ─────────────────────────────────────────────────────────────────── */

const DEV_PARAGRAPHS = [
  "I build full products end-to-end — not demos. Multi-portal ERPs that run a real restaurant's kitchen in Dubai. Attendance platforms that text a parent before the bell finishes ringing. Streaming pipelines that carry a trading desk live to an audience. If it ships, it survives contact with real users.",
  "My core stack is TypeScript everywhere — React and Node on both ends of the wire, PostgreSQL for state that matters, Convex when the backend should think in realtime, and Socket.IO when every millisecond is the product. Architecture the way chefs treat mise en place: invisible when done right, catastrophic when rushed.",
  "My philosophy: architecture is empathy. Every schema, every event, every retry exists so a chef mid-rush, a teacher mid-lesson, or a parent waiting for news never feels the complexity underneath. Clean systems are a form of respect.",
] as const;

const TRADER_PARAGRAPHS = [
  "I trade forex with an institutional lens — reading positioning, liquidity and order flow before price ever confirms the story. The chart is the last page of the book, not the first.",
  "Risk is the only thing I truly manage. Fixed risk per trade, journaled entries, survival first. Consistency compounds; heroics blow accounts. The same discipline that ships clean code protects capital.",
  "And I stream all of it — entries, exits, mistakes, lessons. Most trading communities are highlight reels; I'm building one that's a process reel. Watching me take a loss honestly teaches more than watching anyone win.",
] as const;

const TECH = ["TypeScript", "React", "Node.js", "PostgreSQL", "Convex", "Socket.IO"] as const;

/* ── shared sub-elements ──────────────────────────────────────────────────── */

function TechChips({ reduce }: { reduce: boolean }) {
  return (
    <div className="flex flex-wrap gap-2">
      {TECH.map((t, i) => (
        <motion.span
          key={t}
          animate={reduce ? undefined : { y: [0, -6, 0] }}
          transition={reduce ? undefined : { repeat: Infinity, duration: 3 + i * 0.4, ease: "easeInOut" }}
          className="rounded-full border border-white/10 bg-white/[0.02] px-3.5 py-1.5 font-mono text-[10px] tracking-[0.2em] text-foreground/80"
        >
          {t}
        </motion.span>
      ))}
    </div>
  );
}

function CircuitColumn({
  text,
  duration,
  className,
  animate,
}: {
  text: string;
  duration: number;
  className?: string;
  animate: boolean;
}) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-y-0 overflow-hidden", className)}>
      {animate ? (
        <motion.div
          animate={{ y: ["0%", "-50%"] }}
          transition={{ repeat: Infinity, duration, ease: "linear" }}
          className="whitespace-pre font-mono text-xs leading-6 text-foreground opacity-[0.06]"
        >
          {text}
          {"\n"}
          {text}
        </motion.div>
      ) : (
        <div className="whitespace-pre font-mono text-xs leading-6 text-foreground opacity-[0.06]">
          {text}
        </div>
      )}
    </div>
  );
}

/** Oversized faint candlestick glyphs behind the trader panel. */
function CandleGlyphs() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 300 420"
      fill="none"
      className="pointer-events-none absolute -right-10 top-1/2 hidden h-[88%] w-auto -translate-y-1/2 opacity-[0.05] sm:block"
    >
      <g stroke="#E9CB86" strokeWidth={8} strokeLinecap="round">
        <line x1={60} y1={10} x2={60} y2={410} />
        <line x1={150} y1={60} x2={150} y2={380} />
        <line x1={235} y1={0} x2={235} y2={340} />
      </g>
      <g fill="#E9CB86">
        <rect x={24} y={120} width={72} height={170} rx={6} />
        <rect x={116} y={170} width={68} height={150} rx={6} />
        <rect x={202} y={60} width={66} height={200} rx={6} />
      </g>
    </svg>
  );
}

/* ── panel content ────────────────────────────────────────────────────────── */

function DevContent({ reduce }: { reduce: boolean }) {
  return (
    <>
      <p className="font-mono text-[11px] uppercase tracking-[0.4em] text-gold">
        01 — The Developer
      </p>
      <h3 className="mt-4 font-display text-4xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-5xl [@media(max-height:780px)]:mt-3 [@media(max-height:780px)]:text-3xl">
        The <span className="text-mint">Builder</span>.
      </h3>
      <div className="mt-7 max-w-xl [@media(max-height:780px)]:mt-4">
        <TerminalCard />
      </div>
      <div className="mt-6 max-w-xl [@media(max-height:760px)]:hidden">
        <TechChips reduce={reduce} />
      </div>
      <div className="mt-7 max-w-xl space-y-4 text-[15px] leading-relaxed text-muted-foreground [@media(max-height:780px)]:mt-4 [@media(max-height:780px)]:space-y-3 [@media(max-height:780px)]:text-[13px]">
        {DEV_PARAGRAPHS.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </>
  );
}

function TraderContent() {
  return (
    <>
      <p className="font-mono text-[11px] uppercase tracking-[0.4em] text-gold">
        02 — The Trader
      </p>
      <h3 className="mt-4 font-display text-4xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-5xl [@media(max-height:780px)]:mt-3 [@media(max-height:780px)]:text-3xl">
        The <span className="gold-text">Trader</span>.
      </h3>
      <div className="mt-7 max-w-xl [@media(max-height:780px)]:mt-4">
        <CandleChart />
      </div>
      <div className="mt-7 max-w-xl space-y-4 text-[15px] leading-relaxed text-muted-foreground [@media(max-height:780px)]:mt-4 [@media(max-height:780px)]:space-y-3 [@media(max-height:780px)]:text-[13px]">
        {TRADER_PARAGRAPHS.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </>
  );
}

/* ── panels (shared by pinned + static versions) ──────────────────────────── */

function DeveloperPanel({ reduce, centered = false }: { reduce: boolean; centered?: boolean }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-onyx-950",
        centered && "flex h-full flex-col justify-center"
      )}
    >
      <GradientMesh variant="gold" className="opacity-70" />
      {/* radial gold tint, top-left */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(212,168,87,0.14),transparent_55%)]"
      />
      {CIRCUIT.map((col) => (
        <CircuitColumn
          key={col.className}
          text={col.text}
          duration={col.duration}
          className={col.className}
          animate={!reduce}
        />
      ))}
      <div
        className={cn(
          "relative w-full",
          centered ? "max-w-2xl px-6 sm:px-12 lg:px-16" : "mx-auto max-w-xl px-5 sm:px-8"
        )}
      >
        <DevContent reduce={reduce} />
      </div>
    </div>
  );
}

function TraderPanel({ reduce, centered = false }: { reduce: boolean; centered?: boolean }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-onyx-900/60",
        centered && "flex h-full flex-col justify-center"
      )}
    >
      <GradientMesh variant="gold" className="opacity-60" />
      <CandleGlyphs />
      <div
        className={cn(
          "relative w-full",
          centered ? "max-w-2xl px-6 sm:px-12 lg:px-16" : "mx-auto max-w-xl px-5 sm:px-8"
        )}
      >
        <TraderContent />
      </div>
    </div>
  );
}

/* ── the synthesis ────────────────────────────────────────────────────────── */

function MergeStatement() {
  return (
    <div className="mx-auto max-w-3xl">
      <p className="font-mono text-[11px] uppercase tracking-[0.42em] text-gold">The Synthesis</p>
      <h3 className="mt-6 font-display text-[clamp(2rem,6vw,4.5rem)] font-semibold leading-[1.08] tracking-tight text-foreground">
        One mind. Two markets.
      </h3>
      <div className="mt-6 flex items-center justify-center gap-5">
        <span aria-hidden className="h-px w-14 bg-gradient-to-r from-transparent to-gold/70 sm:w-24" />
        <span className="gold-text font-display text-lg italic sm:text-2xl">Infinite execution.</span>
        <span aria-hidden className="h-px w-14 bg-gradient-to-l from-transparent to-gold/70 sm:w-24" />
      </div>
    </div>
  );
}

function MergeOverlay({
  dim,
  opacity,
  scale,
}: {
  dim: MotionValue<number>;
  opacity: MotionValue<number>;
  scale: MotionValue<number>;
}) {
  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      {/* dim sits over the two panels, under the statement */}
      <motion.div style={{ opacity: dim }} className="absolute inset-0 bg-onyx-950" />
      <motion.div
        style={{ opacity, scale }}
        className="relative flex h-full items-center justify-center px-6 text-center"
      >
        <MergeStatement />
      </motion.div>
    </div>
  );
}

/* ── pinned scroll stage (desktop, motion OK) ─────────────────────────────── */

function DualityPinned() {
  const wrapRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: wrapRef, offset: ["start start", "end end"] });

  // Phase 1 — the Developer rises in
  const leftOpacity = useTransform(scrollYProgress, [0, 0.12, 0.3, 1], [0.15, 1, 1, 0.25]);
  const leftX = useTransform(scrollYProgress, [0, 0.3, 0.72, 1], [40, 0, 0, -24]);
  // Phase 2 — the Trader joins, mirrored
  const rightOpacity = useTransform(scrollYProgress, [0.18, 0.32, 0.5, 0.72], [0, 0.25, 1, 0.25]);
  const rightX = useTransform(scrollYProgress, [0.18, 0.5, 0.72, 1], [40, 0, 0, 24]);
  // Phase 3 — the merge
  const mergeOpacity = useTransform(scrollYProgress, [0.68, 0.8], [0, 1]);
  const mergeScale = useTransform(scrollYProgress, [0.68, 0.85], [0.92, 1]);
  const panelsDim = useTransform(scrollYProgress, [0.72, 0.85], [0, 0.72]);

  return (
    <section
      ref={wrapRef}
      aria-label="The duality — the developer and the trader"
      className="relative h-[280vh]"
    >
      <div className="sticky top-0 h-screen overflow-hidden">
        <div className="grid h-full grid-cols-1 md:grid-cols-2">
          <motion.div style={{ opacity: leftOpacity, x: leftX }} className="h-full">
            <DeveloperPanel reduce={false} centered />
          </motion.div>
          <motion.div style={{ opacity: rightOpacity, x: rightX }} className="h-full">
            <TraderPanel reduce={false} centered />
          </motion.div>
        </div>
        <MergeOverlay dim={panelsDim} opacity={mergeOpacity} scale={mergeScale} />
      </div>
    </section>
  );
}

/* ── static / mobile fallback ─────────────────────────────────────────────── */

function DualityStatic({ reduce }: { reduce: boolean }) {
  return (
    <div>
      <Reveal>
        <DeveloperPanel reduce={reduce} />
      </Reveal>
      <GoldDivider className="my-12 sm:my-16" />
      <Reveal>
        <TraderPanel reduce={reduce} />
      </Reveal>
      <GoldDivider className="my-12 sm:my-16" />
      <section aria-label="The synthesis" className="px-5 py-14 text-center sm:py-20">
        <Reveal>
          <MergeStatement />
        </Reveal>
      </section>
    </div>
  );
}

/* ── entry ────────────────────────────────────────────────────────────────── */

export function DualitySplit() {
  const isMobile = useIsMobile();
  const reduce = usePrefersReducedMotion();

  // First client render matches SSR (both flags false → pinned); mobile and
  // reduced-motion users swap to the static stack right after hydration.
  if (isMobile || reduce) return <DualityStatic reduce={reduce} />;
  return <DualityPinned />;
}
