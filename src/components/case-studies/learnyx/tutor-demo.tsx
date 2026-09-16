"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView } from "framer-motion";
import { Trophy, Video } from "lucide-react";

import { usePrefersReducedMotion } from "@/lib/hooks";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

type Speaker = "student" | "tutor";

interface Line {
  role: Speaker;
  text: string;
}

const SCRIPT: Line[] = [
  { role: "student", text: "Why does integration by parts work?" },
  {
    role: "tutor",
    text: "Think of it as the product rule, run backwards. We trade one hard integral for two easier ones — u for du, dv for v. Want to try one on x·eˣ?",
  },
  { role: "student", text: "wait… that's actually clean 😂" },
  { role: "tutor", text: "Exactly. Attempt 2 questions on it — I'll watch your steps live." },
];

const ROOMMATES = ["ABEL", "KIDUS", "SELAM", "LIYA", "DAWIT", "HANA"] as const;

/**
 * Learnyx platform mock: staged AI-tutor conversation with typing dots,
 * XP/level card with animated progress + achievement toast, and a LiveKit
 * study-room tile grid. All timing runs only while in view; reduced motion
 * renders the finished states statically.
 */
export function TutorDemo({ className }: { className?: string }) {
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.25 });

  const [shown, setShown] = useState(0);
  const [showToast, setShowToast] = useState(false);

  // Staged conversation — one message every 900ms while in view.
  useEffect(() => {
    if (!inView || reduced || shown >= SCRIPT.length) return;
    const t = window.setTimeout(() => setShown((s) => s + 1), 900);
    return () => window.clearTimeout(t);
  }, [inView, reduced, shown]);

  // Achievement toast pops in after 1.6s.
  useEffect(() => {
    if (!inView || reduced || showToast) return;
    const t = window.setTimeout(() => setShowToast(true), 1600);
    return () => window.clearTimeout(t);
  }, [inView, reduced, showToast]);

  const visible = reduced ? SCRIPT : SCRIPT.slice(0, shown);
  const typing = inView && !reduced && shown < SCRIPT.length;

  return (
    <div ref={ref} className={cn("my-10", className)}>
      <div className="relative overflow-hidden rounded-xl border border-white/10 bg-onyx-950/80 p-4 shadow-[0_0_60px_-18px_rgba(212,168,87,0.22)] sm:p-6">
        <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent" />

        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          {/* ── AI tutor chat ── */}
          <div className="flex flex-col rounded-lg border border-white/8 bg-black/50 p-4">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] tracking-[0.25em] text-white/70">
                LEARNYX TUTOR — GROQ · SUB-SECOND
              </span>
              <span className="ml-auto flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-mint" />
                <span className="font-mono text-[9px] tracking-[0.2em] text-mint">ONLINE</span>
              </span>
            </div>

            <div className="mt-4 flex min-h-[300px] flex-1 flex-col justify-end gap-2.5">
              {visible.map((line) => (
                <motion.div
                  key={line.text}
                  initial={reduced ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: EASE }}
                  className={cn(
                    "max-w-[88%] px-3.5 py-2 text-[12px] leading-relaxed",
                    line.role === "student"
                      ? "self-end rounded-2xl rounded-br-sm border border-gold/30 bg-gold/10 text-white/90"
                      : "self-start rounded-2xl rounded-bl-sm border border-white/10 bg-white/5 text-white/85"
                  )}
                >
                  {line.text}
                </motion.div>
              ))}

              {typing && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-1 self-start rounded-full border border-white/10 bg-white/5 px-3 py-2.5"
                >
                  {[0, 1, 2].map((d) => (
                    <motion.span
                      key={d}
                      className="h-1 w-1 rounded-full bg-white/60"
                      animate={{ opacity: [0.25, 1, 0.25] }}
                      transition={{ duration: 0.9, repeat: Infinity, delay: d * 0.15, ease: "easeInOut" }}
                    />
                  ))}
                </motion.div>
              )}
            </div>
          </div>

          {/* ── Right rail ── */}
          <div className="flex flex-col gap-4">
            {/* XP card */}
            <div className="rounded-lg border border-white/8 bg-black/50 p-4">
              <p className="font-display text-lg font-semibold tracking-tight text-white/95 sm:text-xl">
                LEVEL 14 <span className="text-gold">— CONSISTENCY KING</span>
              </p>

              <div className="relative mt-3 h-2.5 w-full overflow-hidden rounded-full bg-white/10">
                {reduced ? (
                  <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-gold to-gold-light" />
                ) : (
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-gold to-gold-light"
                    initial={{ width: 0 }}
                    whileInView={{ width: "72%" }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration: 1.2, ease: EASE }}
                  />
                )}
                <span aria-hidden className="shimmer-line pointer-events-none absolute inset-0 rounded-full opacity-50" />
              </div>

              <div className="mt-2 flex items-center justify-between font-mono text-[9px] tracking-[0.18em] text-muted-foreground">
                <span>2,160 / 3,000 XP</span>
                {reduced ? (
                  <span className="text-mint">+120 XP</span>
                ) : (
                  <motion.span
                    className="text-mint"
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration: 0.5, delay: 0.9, ease: EASE }}
                  >
                    +120 XP
                  </motion.span>
                )}
              </div>

              {/* achievement toast (space reserved to avoid layout jump) */}
              <div className="mt-3 min-h-[64px]">
                <AnimatePresence>
                  {showToast || reduced ? (
                    <motion.div
                      key="achievement"
                      initial={reduced ? false : { opacity: 0, y: 10, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.98 }}
                      transition={{ duration: 0.45, ease: EASE }}
                      className="glow-gold-sm flex items-center gap-3 rounded-lg border border-gold/40 bg-onyx-900 p-3"
                    >
                      <Trophy className="h-5 w-5 shrink-0 text-gold" aria-hidden />
                      <div>
                        <p className="font-mono text-[9px] tracking-[0.25em] text-gold/80">ACHIEVEMENT UNLOCKED</p>
                        <p className="mt-0.5 text-sm font-semibold text-white/90">7-day study streak</p>
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            </div>

            {/* study room */}
            <div className="flex flex-1 flex-col rounded-lg border border-white/8 bg-black/50 p-4">
              <div className="flex items-center gap-2">
                <Video className="h-3.5 w-3.5 text-mint/80" aria-hidden />
                <span className="font-mono text-[10px] tracking-[0.25em] text-white/70">STUDY ROOM</span>
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-mint" />
              </div>

              <div className="mt-3 grid flex-1 grid-cols-3 gap-1.5">
                {ROOMMATES.map((name, i) => {
                  const live = i === 2;
                  return (
                    <div
                      key={name}
                      className={cn(
                        "relative aspect-video overflow-hidden rounded-md bg-onyx-800",
                        live ? "border border-mint/40" : "border border-white/5"
                      )}
                    >
                      {live && !reduced && (
                        <span aria-hidden className="animate-pulse pointer-events-none absolute inset-0 rounded-md border border-mint/60" />
                      )}
                      <span className="absolute left-1/2 top-1/2 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-white/10 font-mono text-[9px] tracking-[0.1em] text-white/75">
                        {name.slice(0, 2)}
                      </span>
                      <span
                        className={cn(
                          "absolute bottom-1 left-1.5 font-mono text-[8px] tracking-[0.14em]",
                          live ? "text-mint/90" : "text-white/45"
                        )}
                      >
                        {name}
                      </span>
                      {live && <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-red-500" />}
                    </div>
                  );
                })}
              </div>

              <p className="mt-3 font-mono text-[9px] tracking-[0.18em] text-muted-foreground">
                LIVEKIT ROOM — GRADE 12 MATH · 6 IN ROOM
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
