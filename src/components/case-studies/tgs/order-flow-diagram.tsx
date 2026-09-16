"use client";

import {
  Fragment,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { motion } from "framer-motion";
import {
  ChefHat,
  CloudUpload,
  CreditCard,
  Gift,
  Globe,
  HandPlatter,
  Network,
  Phone,
  ShieldCheck,
  Truck,
  type LucideIcon,
} from "lucide-react";
import { usePrefersReducedMotion } from "@/lib/hooks";
import { cn } from "@/lib/utils";

const GOLD = "#D4A857";
const MINT = "#00E5A0";
const EASE = [0.22, 1, 0.36, 1] as const;

type Tone = "gold" | "mint";
type Side = "top" | "bottom" | "left" | "right";

interface NodeDef {
  id: string;
  label: string;
  sub?: string;
  icon: LucideIcon;
  tone: Tone;
}

const ENTRY_NODES: NodeDef[] = [
  { id: "web", label: "Customer Web App", sub: "orders · reorders", icon: Globe, tone: "gold" },
  {
    id: "whatsapp",
    label: "WhatsApp Voice Queue",
    sub: "Twilio · transcription",
    icon: Phone,
    tone: "gold",
  },
];

const PORTAL_NODES: NodeDef[] = [
  { id: "chef", label: "Chef KDS", sub: "the pass", icon: ChefHat, tone: "gold" },
  { id: "waiter", label: "Waiter", sub: "pickup · dispatch", icon: HandPlatter, tone: "gold" },
  { id: "cashier", label: "Cashier", sub: "settlement", icon: CreditCard, tone: "gold" },
  { id: "manager", label: "Manager", sub: "oversight", icon: ShieldCheck, tone: "gold" },
];

const SERVICE_NODES: NodeDef[] = [
  { id: "lottery", label: "Lottery Engine", sub: "weekly draw", icon: Gift, tone: "mint" },
  { id: "supply", label: "Addis Supply Chain", sub: "procurement", icon: Truck, tone: "mint" },
  {
    id: "backups",
    label: "Drive Backups",
    sub: "weekly · automated",
    icon: CloudUpload,
    tone: "mint",
  },
];

const PORTAL_ROWS = [PORTAL_NODES.slice(0, 2), PORTAL_NODES.slice(2, 4)];

interface FlowLink {
  id: string;
  d: string;
  tone: Tone;
}

interface Pt {
  x: number;
  y: number;
}

interface RelRect {
  left: number;
  right: number;
  top: number;
  bottom: number;
  cx: number;
  cy: number;
}

/* ── geometry helpers ─────────────────────────────────────────────── */

function relRect(el: HTMLElement, cRect: DOMRect): RelRect {
  const r = el.getBoundingClientRect();
  const left = r.left - cRect.left;
  const top = r.top - cRect.top;
  return {
    left,
    top,
    right: left + r.width,
    bottom: top + r.height,
    cx: left + r.width / 2,
    cy: top + r.height / 2,
  };
}

function anchorPt(r: RelRect, side: Side): Pt {
  switch (side) {
    case "top":
      return { x: r.cx, y: r.top };
    case "bottom":
      return { x: r.cx, y: r.bottom };
    case "left":
      return { x: r.left, y: r.cy };
    case "right":
      return { x: r.right, y: r.cy };
  }
}

/** Vertical cubic bezier — for top→down flows (entry→hub, hub→portals). */
function curveV(a: Pt, b: Pt): string {
  const dy = Math.max(26, Math.abs(b.y - a.y) * 0.45);
  return `M ${a.x.toFixed(1)} ${a.y.toFixed(1)} C ${a.x.toFixed(1)} ${(a.y + dy).toFixed(1)}, ${b.x.toFixed(1)} ${(b.y - dy).toFixed(1)}, ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
}

/** Horizontal cubic bezier — for hub→services side flows. */
function curveH(a: Pt, b: Pt): string {
  const dx = Math.max(26, Math.abs(b.x - a.x) * 0.5);
  return `M ${a.x.toFixed(1)} ${a.y.toFixed(1)} C ${(a.x + dx).toFixed(1)} ${a.y.toFixed(1)}, ${(b.x - dx).toFixed(1)} ${b.y.toFixed(1)}, ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
}

/* ── pieces ───────────────────────────────────────────────────────── */

function NodeCard({
  def,
  refCb,
  className,
}: {
  def: NodeDef;
  refCb?: (el: HTMLDivElement | null) => void;
  className?: string;
}) {
  const Icon = def.icon;
  return (
    <div
      ref={refCb}
      className={cn(
        "rounded-lg border border-white/8 bg-onyx-850/90 px-3.5 py-3 text-center",
        className
      )}
    >
      <Icon
        className={cn("mx-auto h-4 w-4", def.tone === "mint" ? "text-mint/90" : "text-gold")}
        aria-hidden
      />
      <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-foreground sm:text-xs">
        {def.label}
      </p>
      {def.sub ? (
        <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground">{def.sub}</p>
      ) : null}
    </div>
  );
}

function HubCard({ refCb }: { refCb?: (el: HTMLDivElement | null) => void }) {
  return (
    <div ref={refCb} className="relative">
      {/* subtle spinning conic ring */}
      <div
        aria-hidden
        className="animate-spin-slower absolute -inset-1 rounded-2xl opacity-60 [background:conic-gradient(from_0deg,transparent_0deg,rgba(212,168,87,0.5)_42deg,transparent_84deg)]"
      />
      <div className="glow-gold-sm relative rounded-xl border border-gold/60 bg-onyx-800/95 px-6 py-3.5 text-center sm:px-10">
        <Network className="mx-auto h-5 w-5 text-gold" aria-hidden />
        <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.22em] text-gold-light sm:text-xs">
          Order Core
        </p>
        <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
          Socket.IO · event bus
        </p>
      </div>
    </div>
  );
}

/** SMIL traveling pulse — zero JS, hidden entirely under reduced motion. */
function PulseDot({ d, color, dur, begin }: { d: string; color: string; dur: number; begin: number }) {
  return (
    <circle r="3" fill={color}>
      <animateMotion dur={`${dur}s`} begin={`${begin.toFixed(2)}s`} repeatCount="indefinite" path={d} />
    </circle>
  );
}

/** Mobile-only vertical connector between stacked nodes. */
function MobileConnector({ tone }: { tone: Tone }) {
  return (
    <motion.div
      aria-hidden
      className={cn(
        "mx-auto h-8 w-px origin-top",
        tone === "mint"
          ? "bg-gradient-to-b from-mint/50 to-mint/10"
          : "bg-gradient-to-b from-gold/50 to-gold/10"
      )}
      initial={{ scaleY: 0, opacity: 0 }}
      whileInView={{ scaleY: 1, opacity: 1 }}
      viewport={{ once: true, margin: "-20px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    />
  );
}

/* ── main component ───────────────────────────────────────────────── */

/**
 * "Seven surfaces, one bus" topology diagram.
 * Desktop (md+): node cards + a measured SVG connector layer (dashed gold /
 * mint circuit traces with SMIL traveling pulses). Mobile: the same nodes
 * stacked vertically with animated gradient connectors — no SVG.
 */
export function OrderFlowDiagram() {
  const reduced = usePrefersReducedMotion();
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const containerRef = useRef<HTMLDivElement>(null);
  const nodeEls = useRef(new Map<string, HTMLElement>());
  const [links, setLinks] = useState<FlowLink[]>([]);
  const [size, setSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

  const setNode = useCallback(
    (key: string) => (el: HTMLDivElement | null) => {
      if (el) nodeEls.current.set(key, el);
      else nodeEls.current.delete(key);
    },
    []
  );

  const compute = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const cRect = container.getBoundingClientRect();
    // Hidden container (mobile widths) — skip; SVG layer is display:none anyway.
    if (cRect.width === 0 || cRect.height === 0) return;

    const rect = (key: string): RelRect | null => {
      const el = nodeEls.current.get(key);
      return el ? relRect(el, cRect) : null;
    };
    const hub = rect("d-hub");
    if (!hub) return;

    const next: FlowLink[] = [];

    for (const id of ["web", "whatsapp"]) {
      const r = rect(`d-${id}`);
      if (r) {
        next.push({
          id: `${id}-hub`,
          tone: "gold",
          d: curveV(anchorPt(r, "bottom"), anchorPt(hub, "top")),
        });
      }
    }
    for (const id of ["chef", "waiter", "cashier", "manager"]) {
      const r = rect(`d-${id}`);
      if (r) {
        next.push({
          id: `hub-${id}`,
          tone: "gold",
          d: curveV(anchorPt(hub, "bottom"), anchorPt(r, "top")),
        });
      }
    }
    for (const id of ["lottery", "supply", "backups"]) {
      const r = rect(`d-${id}`);
      if (r) {
        next.push({
          id: `hub-${id}`,
          tone: "mint",
          d: curveH(anchorPt(hub, "right"), anchorPt(r, "left")),
        });
      }
    }

    setLinks(next);
    setSize({ w: cRect.width, h: cRect.height });
  }, []);

  useLayoutEffect(() => {
    compute();
    const ro = new ResizeObserver(() => compute());
    if (containerRef.current) ro.observe(containerRef.current);
    window.addEventListener("resize", compute);
    let cancelled = false;
    // Re-measure once webfonts settle (labels change node heights slightly).
    document.fonts?.ready
      .then(() => {
        if (!cancelled) compute();
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      ro.disconnect();
      window.removeEventListener("resize", compute);
    };
  }, [compute]);

  return (
    <figure className="relative my-10 overflow-hidden rounded-xl border border-white/8 bg-onyx-900/50 p-4 sm:p-8">
      {/* caption + legend */}
      <div className="mb-6 flex flex-wrap items-center gap-x-5 gap-y-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-gold/80">
          System topology
        </p>
        <span aria-hidden className="hidden h-px flex-1 bg-white/8 sm:block" />
        <div className="flex items-center gap-4 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-gold" />
            Order flow
          </span>
          <span className="flex items-center gap-1.5">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-mint" />
            Automation
          </span>
        </div>
      </div>

      <div ref={containerRef} className="relative">
        {/* ── SVG connector layer (desktop only) ── */}
        {links.length > 0 && size.w > 0 ? (
          <svg
            aria-hidden
            className="pointer-events-none absolute inset-0 z-0 hidden md:block"
            width={size.w}
            height={size.h}
            viewBox={`0 0 ${size.w} ${size.h}`}
            fill="none"
          >
            <defs>
              <linearGradient id={`${uid}gold`} x1="0" y1="0" x2="0" y2="1">
                <stop stopColor={GOLD} stopOpacity="0.12" />
                <stop offset="0.5" stopColor={GOLD} stopOpacity="0.85" />
                <stop offset="1" stopColor={GOLD} stopOpacity="0.12" />
              </linearGradient>
              <linearGradient id={`${uid}mint`} x1="0" y1="0" x2="1" y2="0">
                <stop stopColor={MINT} stopOpacity="0.1" />
                <stop offset="0.5" stopColor={MINT} stopOpacity="0.8" />
                <stop offset="1" stopColor={MINT} stopOpacity="0.1" />
              </linearGradient>
            </defs>

            {links.map((l, i) => (
              <g key={l.id}>
                {/* dashed circuit trace — fades in and stays */}
                <motion.path
                  d={l.d}
                  stroke={`url(#${uid}${l.tone})`}
                  strokeWidth={1.25}
                  strokeDasharray="4 6"
                  strokeLinecap="round"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.9, delay: 0.15 + i * 0.07, ease: "easeOut" }}
                />
                {/* solid draw-in that hands off to the dashed trace */}
                {!reduced ? (
                  <motion.path
                    d={l.d}
                    stroke={l.tone === "gold" ? GOLD : MINT}
                    strokeWidth={1.25}
                    strokeLinecap="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    whileInView={{ pathLength: [0, 1, 1], opacity: [0, 0.85, 0] }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration: 1.4, delay: i * 0.07, ease: EASE, times: [0, 0.55, 1] }}
                  />
                ) : null}
                {/* traveling pulses (pure SMIL, none under reduced motion) */}
                {!reduced ? (
                  <PulseDot d={l.d} color={l.tone === "gold" ? GOLD : MINT} dur={2.6} begin={-(i * 0.7) % 2.6} />
                ) : null}
                {!reduced && (l.id === "web-hub" || l.id === "whatsapp-hub") ? (
                  <PulseDot d={l.d} color={GOLD} dur={3.4} begin={-1.6} />
                ) : null}
              </g>
            ))}
          </svg>
        ) : null}

        {/* ── Desktop topology ── */}
        <div className="relative z-10 hidden md:grid md:grid-cols-[minmax(0,1fr)_13rem] md:gap-x-12">
          <div>
            <div className="mx-auto grid max-w-xl grid-cols-2 gap-5">
              {ENTRY_NODES.map((n) => (
                <NodeCard key={n.id} def={n} refCb={setNode(`d-${n.id}`)} />
              ))}
            </div>
            <div className="mt-9 flex justify-center">
              <HubCard refCb={setNode("d-hub")} />
            </div>
            <div className="mt-9 grid grid-cols-4 gap-4">
              {PORTAL_NODES.map((n) => (
                <NodeCard key={n.id} def={n} refCb={setNode(`d-${n.id}`)} />
              ))}
            </div>
          </div>
          <div className="flex flex-col justify-center gap-5">
            {SERVICE_NODES.map((n) => (
              <NodeCard key={n.id} def={n} refCb={setNode(`d-${n.id}`)} />
            ))}
          </div>
        </div>

        {/* ── Mobile stack (all nodes, vertical connectors) ── */}
        <div className="relative z-10 flex flex-col md:hidden">
          <div className="grid grid-cols-2 gap-3">
            {ENTRY_NODES.map((n) => (
              <NodeCard key={n.id} def={n} />
            ))}
          </div>
          <MobileConnector tone="gold" />
          <div className="flex justify-center">
            <HubCard />
          </div>
          {PORTAL_ROWS.map((row, ri) => (
            <Fragment key={ri}>
              <MobileConnector tone="gold" />
              <div className="grid grid-cols-2 gap-3">
                {row.map((n) => (
                  <NodeCard key={n.id} def={n} />
                ))}
              </div>
            </Fragment>
          ))}
          {SERVICE_NODES.map((n) => (
            <Fragment key={n.id}>
              <MobileConnector tone="mint" />
              <NodeCard def={n} />
            </Fragment>
          ))}
        </div>
      </div>
    </figure>
  );
}
