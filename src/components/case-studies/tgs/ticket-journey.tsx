"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Check, Circle, Loader } from "lucide-react";
import { usePrefersReducedMotion } from "@/lib/hooks";
import { cn } from "@/lib/utils";

const STEP_MS = 1600;

const STEPS = [
  { label: "Order placed — WhatsApp voice note transcribed", time: "20:41:07" },
  { label: "Order core — validated & priced", time: "20:41:08" },
  { label: "Chef KDS — ticket hits the pass", time: "20:41:09" },
  { label: "Waiter portal — pickup assigned", time: "20:41:11" },
  { label: "Out for delivery — customer notified", time: "20:41:12" },
] as const;

const BADGES = [
  { label: "QUEUED", cls: "border-white/15 bg-white/5 text-muted-foreground" },
  { label: "VALIDATED", cls: "border-gold/30 bg-gold/5 text-gold-light" },
  { label: "COOKING", cls: "border-gold/60 bg-gold/10 text-gold" },
  { label: "PICKUP", cls: "border-mint/40 bg-mint/5 text-mint" },
  { label: "DELIVERED", cls: "border-mint bg-mint/15 text-mint" },
] as const;

const TICKET_ITEMS = [
  { name: "Tibs Special", qty: 2 },
  { name: "Injera", qty: 3 },
  { name: "Shiro", qty: 1 },
] as const;

type StepStatus = "done" | "active" | "todo";

function StatusIcon({ status }: { status: StepStatus }) {
  if (status === "done") {
    return (
      <span
        aria-hidden
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-mint/40 bg-mint/10"
      >
        <Check className="h-3.5 w-3.5 text-mint" />
      </span>
    );
  }
  if (status === "active") {
    return (
      <span
        aria-hidden
        className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-gold/50 bg-gold/10"
      >
        <span className="animate-ping absolute inset-0 rounded-full bg-gold/25" />
        <Loader className="animate-spin relative h-3.5 w-3.5 text-gold" />
      </span>
    );
  }
  return (
    <span
      aria-hidden
      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5"
    >
      <Circle className="h-3 w-3 text-muted-foreground/50" />
    </span>
  );
}

/**
 * Animated "live ticket" demo — a simulated Socket.IO feed that walks one
 * order through the pipeline (QUEUED → VALIDATED → COOKING → PICKUP →
 * DELIVERED). Runs only while in view; reduced motion gets the finished
 * ticket, static and calm.
 */
export function TicketJourney() {
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-80px" });
  const [step, setStep] = useState(0);

  // Live state machine — advances only while visible, frozen for reduced motion.
  useEffect(() => {
    if (reduced || !inView) return;
    const id = setInterval(() => {
      setStep((s) => (s + 1) % STEPS.length);
    }, STEP_MS);
    return () => clearInterval(id);
  }, [reduced, inView]);

  const effective = reduced ? STEPS.length - 1 : step;
  const badge = BADGES[effective];

  return (
    <div
      ref={ref}
      className="my-10 rounded-xl border border-white/8 bg-onyx-950/70 p-6 sm:p-8"
      aria-label="Simulated live ticket journey"
    >
      {/* header */}
      <div className="flex flex-wrap items-center gap-3">
        <span aria-hidden className="animate-pulse-soft h-2 w-2 rounded-full bg-mint" />
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-gold">
          Live ticket — demo
        </p>
        <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">
          Socket.IO feed · simulated
        </span>
      </div>

      <div className="mt-8 flex flex-col gap-10 sm:flex-row sm:items-start">
        {/* pipeline steps */}
        <ol className="flex-1 space-y-1" aria-label="Ticket journey steps">
          {STEPS.map((s, i) => {
            const status: StepStatus = reduced
              ? "done"
              : i < step
                ? "done"
                : i === step
                  ? "active"
                  : "todo";
            return (
              <motion.li
                key={s.label}
                initial={{ opacity: 0, x: -14 }}
                animate={status === "todo" ? { opacity: 0.3, x: 0 } : { opacity: 1, x: 0 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                aria-current={status === "active" ? "step" : undefined}
                className="flex items-center gap-3 rounded-lg px-2 py-2.5"
              >
                <StatusIcon status={status} />
                <span
                  className={cn(
                    "text-sm sm:text-[15px]",
                    status === "done" && "text-foreground",
                    status === "active" && "text-gold",
                    status === "todo" && "text-muted-foreground"
                  )}
                >
                  {s.label}
                </span>
                <span className="ml-auto font-mono text-[10px] tracking-wider text-muted-foreground/60">
                  {s.time}
                </span>
              </motion.li>
            );
          })}
        </ol>

        {/* ticket card (hidden on mobile) — remounts each step for a subtle pulse */}
        <motion.div
          key={effective}
          initial={{ scale: 1.02 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="glow-gold-sm hidden w-64 shrink-0 rounded-lg border border-gold/30 bg-onyx-900 p-4 sm:block"
          aria-hidden
        >
          <div className="flex items-center justify-between gap-2">
            <p className="font-mono text-[11px] tracking-[0.2em] text-gold-light">TICKET #0042</p>
            <span
              className={cn(
                "rounded-full border px-2 py-0.5 font-mono text-[9px] tracking-[0.18em]",
                badge.cls
              )}
            >
              {badge.label}
            </span>
          </div>
          <div className="mt-4 space-y-2.5">
            {TICKET_ITEMS.map((it) => (
              <div key={it.name} className="flex items-baseline justify-between gap-3 text-sm">
                <span className="text-foreground/90">{it.name}</span>
                <span className="font-mono text-xs text-muted-foreground">×{it.qty}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-baseline justify-between border-t border-white/10 pt-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
              Total
            </span>
            <span className="font-display text-lg font-semibold text-gold">AED 87.00</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
