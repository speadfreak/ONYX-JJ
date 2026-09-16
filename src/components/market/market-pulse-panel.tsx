"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";
import { formatPct, formatPrice, type MarketInstrument } from "@/lib/market-types";
import { MarketSourceChip, useMarketPoll } from "./market-pulse-strip";

/** SSR shell placeholders — same fixed instrument order as the API. */
const SKELETON: { symbol: string; label: string }[] = [
  { symbol: "EURUSD", label: "EUR/USD" },
  { symbol: "GBPUSD", label: "GBP/USD" },
  { symbol: "XAUUSD", label: "XAU/USD" },
  { symbol: "BTCUSD", label: "BTC/USD" },
];

/**
 * Hand-rolled SVG sparkline (no charting library) — deterministic from the
 * history data. Area fill: ice #22D3EE → transparent for up-ticks,
 * #E5484D-tinted for down-ticks. Stroke 1.5 with non-scaling stroke because
 * preserveAspectRatio="none" stretches the viewBox.
 */
function Sparkline({ history, up, symbol }: { history: number[]; up: boolean; symbol: string }) {
  if (!history || history.length < 2) {
    return <div className="mt-4 h-10 w-full rounded-sm border-b border-dashed border-white/10" aria-hidden="true" />;
  }
  const W = 100;
  const H = 32;
  const PAD = 2;
  const min = Math.min(...history);
  const max = Math.max(...history);
  const range = max - min || Math.abs(max) * 0.001 || 1;
  const coords = history.map((v, i) => {
    const x = (i / (history.length - 1)) * W;
    const y = H - PAD - ((v - min) / range) * (H - PAD * 2);
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });
  const line = `M${coords.join(" L")}`;
  const area = `${line} L${W},${H} L0,${H} Z`;
  const stroke = up ? "#22D3EE" : "#E5484D";
  const gradId = `spark-${symbol}-${up ? "up" : "down"}`;

  return (
    <svg
      viewBox="0 0 100 32"
      preserveAspectRatio="none"
      className="mt-4 h-10 w-full"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity={0.28} />
          <stop offset="100%" stopColor={stroke} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradId})`} stroke="none" />
      <path
        d={line}
        fill="none"
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function InstrumentCard({ ins, updatedLabel }: { ins: MarketInstrument | null; updatedLabel: string }) {
  const up = (ins?.changePct ?? 0) >= 0;
  return (
    <div className="h-full rounded-xl border border-white/8 bg-onyx-900/50 p-5 transition-colors duration-300 hover:border-gold/30">
      <div className="flex items-baseline justify-between gap-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
          {ins?.label ?? "—"}
        </p>
        <p className="font-mono text-[9px] tracking-[0.18em] text-muted-foreground/60">
          {ins?.symbol ?? ""}
        </p>
      </div>

      <div className="mt-3 flex items-end justify-between gap-3">
        {/* Price crossfades on each poll refresh */}
        <div className="relative h-8 overflow-hidden">
          <AnimatePresence mode="popLayout" initial={false}>
            {ins ? (
              <motion.p
                key={ins.price}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="font-display text-2xl font-semibold tabular-nums text-foreground"
              >
                {formatPrice(ins.price, ins.symbol)}
              </motion.p>
            ) : (
              <p key="skeleton" className="font-display text-2xl font-semibold text-muted-foreground/40">
                —
              </p>
            )}
          </AnimatePresence>
        </div>

        {ins ? (
          <span
            className={cn(
              "shrink-0 rounded-full border px-2 py-0.5 font-mono text-[10px] tabular-nums",
              up ? "border-mint/30 bg-mint/10 text-mint" : "border-[#E5484D]/30 bg-[#E5484D]/10 text-[#E5484D]"
            )}
          >
            {up ? "▲" : "▼"} {formatPct(ins.changePct)}
          </span>
        ) : (
          <span className="shrink-0 rounded-full border border-white/10 px-2 py-0.5 font-mono text-[10px] text-muted-foreground/50">
            —
          </span>
        )}
      </div>

      <Sparkline history={ins?.history ?? []} up={up} symbol={ins?.symbol ?? "skeleton"} />

      <p className="mt-3 font-mono text-[9px] tracking-[0.2em] text-muted-foreground/60">
        UPDATED {updatedLabel}
      </p>
    </div>
  );
}

/**
 * Expanded "LIVE MARKET PULSE" panel for the JJ Nexus Pro case study —
 * JJ's curated bias in a glass row, then 4 instrument cards with sparklines.
 * Polls the same /api/market feed as the footer strip (45s, visibility-aware,
 * de-duped). `bias` overrides the API-curated note when provided by the page.
 */
export function MarketPulsePanel({ bias = "" }: { bias?: string }) {
  const { snap } = useMarketPoll();

  const biasText = bias.trim() || snap?.bias?.trim() || "";
  const updatedLabel = snap
    ? `${new Date(snap.updatedAt).toLocaleTimeString("en-GB", { hour12: false })}${
        snap.source === "demo" ? " · DEMO DATA" : ""
      }`
    : "—";

  const cards: { symbol: string; ins: MarketInstrument | null }[] = snap
    ? snap.instruments.map((ins) => ({ symbol: ins.symbol, ins }))
    : SKELETON.map((s) => ({ symbol: s.symbol, ins: null }));

  return (
    <section aria-label="Live market pulse" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal>
          <div className="flex flex-wrap items-center gap-3">
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-gold/60">
              LIVE MARKET PULSE
            </p>
            <MarketSourceChip source={snap?.source ?? null} />
          </div>

          {/* JJ's bias — the personally-curated note, front and center */}
          {biasText ? (
            <div className="glass-panel mt-6 rounded-xl border-l-2! border-l-gold! px-6 py-5 backdrop-blur-md sm:px-8">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-gold/70">
                JJ&apos;S CURRENT BIAS
              </p>
              <p className="mt-2 font-display text-xl italic leading-snug text-foreground/90 sm:text-2xl">
                {biasText}
              </p>
            </div>
          ) : null}
        </Reveal>

        <Stagger className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" stagger={0.1}>
          {cards.map(({ symbol, ins }) => (
            <StaggerItem key={symbol}>
              <InstrumentCard ins={ins} updatedLabel={updatedLabel} />
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
