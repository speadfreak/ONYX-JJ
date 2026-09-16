"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "@/lib/hooks";
import { formatPct, formatPrice, type ApiMarketResponse, type MarketSource } from "@/lib/market-types";

const POLL_MS = 45_000;

/** Static labels for the SSR shell — no hydration mismatch (no live prices server-side). */
const SKELETON_LABELS = ["EUR/USD", "GBP/USD", "XAU/USD", "BTC/USD"] as const;

/**
 * Shared Market Pulse polling hook (used by the footer strip AND the expanded
 * panel on /work/jj-nexus-pro). Fetches /api/market on mount + every
 * `intervalMs`; skips polls while the tab is hidden and de-dupes overlapping
 * requests. `pulse` maps symbol → price-delta direction vs the previous poll
 * (−1 | 0 | 1) to re-trigger the .jj-pulse-up/.jj-pulse-down keyframes.
 */
export function useMarketPoll(intervalMs = POLL_MS) {
  const [snap, setSnap] = useState<ApiMarketResponse | null>(null);
  const [pulse, setPulse] = useState<Record<string, number>>({});
  const prevPrices = useRef<Record<string, number>>({});
  const inflight = useRef(false);

  const poll = useCallback(async () => {
    if (inflight.current) return;
    inflight.current = true;
    try {
      const res = await fetch("/api/market", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as ApiMarketResponse;
      if (!data?.ok || !Array.isArray(data.instruments)) return;
      const deltas: Record<string, number> = {};
      for (const ins of data.instruments) {
        const prev = prevPrices.current[ins.symbol];
        deltas[ins.symbol] = prev === undefined ? 0 : Math.sign(ins.price - prev);
        prevPrices.current[ins.symbol] = ins.price;
      }
      setPulse(deltas);
      setSnap(data);
    } catch {
      // Network hiccup — keep the last known snapshot on screen.
    } finally {
      inflight.current = false;
    }
  }, []);

  useEffect(() => {
    void poll();
    const id = setInterval(() => {
      if (!document.hidden) void poll();
    }, intervalMs);
    const onVisibility = () => {
      if (!document.hidden) void poll();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [poll, intervalMs]);

  return { snap, pulse };
}

/** LIVE · DELAYED (mint) / (DEMO DATA) (gold, mandatory) / SYNC… (pre-first-poll). */
export function MarketSourceChip({
  source,
  className,
}: {
  source: MarketSource | null;
  className?: string;
}) {
  if (source === "live") {
    return (
      <span
        className={cn(
          "shrink-0 rounded-full border border-mint/40 px-2 py-px font-mono text-[8px] uppercase tracking-[0.2em] text-mint",
          className
        )}
      >
        LIVE · DELAYED
      </span>
    );
  }
  if (source === "demo") {
    return (
      <span
        className={cn(
          "shrink-0 rounded-full border border-gold/40 px-2 py-px font-mono text-[8px] uppercase tracking-[0.2em] text-gold",
          className
        )}
      >
        (DEMO DATA)
      </span>
    );
  }
  return (
    <span
      className={cn(
        "shrink-0 rounded-full border border-white/10 px-2 py-px font-mono text-[8px] uppercase tracking-[0.2em] text-muted-foreground",
        className
      )}
    >
      SYNC…
    </span>
  );
}

/**
 * v3 — Live Market Pulse footer ticker strip.
 * Thin cinematic marquee pinned to the top of the site footer (all pages):
 * 4 instruments + JJ's personally-curated bias, live or clearly-labeled demo.
 */
export function MarketPulseStrip({ bias = "" }: { bias?: string }) {
  const { snap, pulse } = useMarketPoll();
  const reduce = usePrefersReducedMotion();

  const instrumentRows: ReactNode[] = snap
    ? snap.instruments.map((ins) => {
        const dir = pulse[ins.symbol] ?? 0;
        const up = ins.changePct >= 0;
        return (
          <span key={ins.symbol} className="flex items-baseline gap-2 whitespace-nowrap">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/80">
              {ins.label}
            </span>
            {/* key on price → remount re-triggers the pulse keyframes on change */}
            <span
              key={ins.price}
              className={cn("text-xs font-medium tabular-nums", dir >= 0 ? "jj-pulse-up" : "jj-pulse-down")}
            >
              {formatPrice(ins.price, ins.symbol)}
            </span>
            <span className={cn("font-mono text-[10px] tabular-nums", up ? "text-mint" : "text-[#E5484D]")}>
              {up ? "▲" : "▼"} {formatPct(ins.changePct)}
            </span>
          </span>
        );
      })
    : SKELETON_LABELS.map((label) => (
        <span key={label} className="flex items-baseline gap-2 whitespace-nowrap">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/80">
            {label}
          </span>
          <span className="text-xs font-medium tabular-nums text-muted-foreground/50">—</span>
          <span className="font-mono text-[10px] tabular-nums text-muted-foreground/50">—</span>
        </span>
      ));

  const biasRow: ReactNode | null = bias.trim() ? (
    <span key="bias" className="flex items-baseline gap-2 whitespace-nowrap">
      <span className="text-[10px] text-gold">◆</span>
      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">JJ&apos;S BIAS</span>
      <span className="font-display text-xs italic text-gold/90">{bias}</span>
    </span>
  ) : null;

  const content: ReactNode[] = biasRow ? [...instrumentRows, biasRow] : instrumentRows;

  /** One copy of the marquee content; each copy carries its own trailing gap
      so translateX(-50%) lands exactly one copy-width → seamless loop. */
  const copy = (hidden: boolean) => (
    <div aria-hidden={hidden || undefined} className="flex items-center gap-10 pr-10">
      {content}
    </div>
  );

  return (
    <div
      data-cursor="hover"
      aria-label="Live market pulse ticker"
      className="flex h-10 items-center overflow-hidden border-b border-white/5 bg-onyx-950/90 backdrop-blur-sm"
    >
      {/* Left cap — brand + source chip */}
      <div className="relative z-10 flex h-full shrink-0 items-center gap-3 bg-onyx-950 pl-5 pr-3 sm:pl-8">
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          {!reduce ? (
            <span className="absolute inline-flex h-full w-full rounded-full bg-gold opacity-60 motion-safe:animate-ping" />
          ) : null}
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-gold" />
        </span>
        <span className="shrink-0 font-mono text-[9px] tracking-[0.3em] text-gold/80">
          MARKET PULSE
        </span>
        <MarketSourceChip source={snap?.source ?? null} />
      </div>

      {reduce ? (
        // Reduced motion: the CSS kill-switch disables the marquee animation —
        // fall back to a simple horizontally scrollable row so nothing is invisible.
        <div className="min-w-0 flex-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex w-max items-center gap-10 px-6">{content}</div>
        </div>
      ) : (
        <div className="jj-marquee-hover min-w-0 flex-1 overflow-hidden">
          <div
            className="animate-jj-marquee flex w-max items-center"
            style={{ "--marquee-duration": "46s" } as CSSProperties}
          >
            {copy(false)}
            {copy(true)}
          </div>
        </div>
      )}
    </div>
  );
}
