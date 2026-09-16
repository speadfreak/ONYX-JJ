"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView } from "framer-motion";
import {
  BellRing,
  CheckCheck,
  Fingerprint,
 QrCode,
  ScanFace,
  Signal,
} from "lucide-react";
import { usePrefersReducedMotion } from "@/lib/hooks";
import { cn } from "@/lib/utils";

/**
 * Simulated check-in sequence:
 * face scan → live dashboard update → automated SMS on the parent's phone.
 * Loops while in view; static final state under reduced motion.
 */

type Phase = 0 | 1 | 2; // scanning → dashboard → parent notified

const EASE = [0.22, 1, 0.36, 1] as const;

const STUDENTS = [
  { name: "ABIEL T.", grade: "G7A", mode: "FACE" as const },
  { name: "MERON K.", grade: "G7A", mode: "QR" as const },
  { name: "DANAWIT H.", grade: "G7B", mode: "FACE" as const },
  { name: "YONAS G.", grade: "G7B", mode: "FINGER" as const },
];

const MODE_ICON = {
  FACE: ScanFace,
  QR: QrCode,
  FINGER: Fingerprint,
} as const;

export function CheckinDemo() {
  const reduce = usePrefersReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const inView = useInView(containerRef, { amount: 0.35 });
  const [phase, setPhase] = useState<Phase>(0);
  const [studentIdx, setStudentIdx] = useState(0);
  const [present, setPresent] = useState<string[]>(["ABIEL T."]);

  // Advance the loop: scan (1.6s) → dashboard (1.4s) → SMS (1.8s) → next student
  useEffect(() => {
    if (!inView || reduce) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    if (phase === 0) {
      timers.push(
        setTimeout(() => {
          setPhase(1);
          setPresent((prev) => (prev.includes(STUDENTS[studentIdx].name) ? prev : [...prev, STUDENTS[studentIdx].name]));
        }, 1600)
      );
    } else if (phase === 1) {
      timers.push(setTimeout(() => setPhase(2), 1400));
    } else {
      timers.push(
        setTimeout(() => {
          setPhase(0);
          setStudentIdx((i) => (i + 1) % STUDENTS.length);
        }, 2000)
      );
    }
    return () => timers.forEach(clearTimeout);
  }, [phase, inView, studentIdx, reduce]);

  const student = STUDENTS[studentIdx];
  const ModeIcon = MODE_ICON[student.mode];

  return (
    <div
      ref={containerRef}
      className="my-10 grid gap-4 lg:grid-cols-[0.9fr_1.1fr_0.7fr]"
      aria-label="Simulated check-in sequence"
    >
      {/* ── 1 · THE GATE — face scan ─────────────────────────── */}
      <div className="rounded-xl border border-white/10 bg-onyx-950/80 p-5">
        <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] text-gold">
          <ScanFace className="h-4 w-4" /> The Gate
        </p>

        <div className="relative mx-auto mt-5 aspect-[4/5] w-full max-w-[210px] overflow-hidden rounded-lg border border-white/10 bg-black/60">
          {/* student silhouette */}
          <div className="absolute inset-0 flex items-end justify-center">
            <div className="h-[78%] w-[62%] rounded-t-full bg-onyx-800/80" />
          </div>
          {/* scan frame */}
          <motion.div
            className={cn(
              "absolute inset-x-[14%] top-[12%] bottom-[16%] rounded-md border-2 transition-colors duration-500",
              phase === 0 ? "border-mint/80" : "border-mint/25"
            )}
          >
            {(["left-0 top-0 border-l-2 border-t-2", "right-0 top-0 border-r-2 border-t-2", "bottom-0 left-0 border-b-2 border-l-2", "bottom-0 right-0 border-b-2 border-r-2"] as const).map(
              (pos) => (
                <span key={pos} className={cn("absolute h-4 w-4 border-mint", pos)} />
              )
            )}
            {/* scanning line */}
            {phase === 0 && !reduce && (
              <motion.span
                className="absolute inset-x-0 h-0.5 bg-mint shadow-[0_0_12px_rgba(0,229,160,0.9)]"
                animate={{ top: ["6%", "92%", "6%"] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              />
            )}
          </motion.div>
          {/* result badge */}
          <AnimatePresence>
            {phase > 0 && (
              <motion.div
                key={`match-${studentIdx}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: EASE }}
                className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full border border-mint/50 bg-onyx-950/90 px-3 py-1"
              >
                <CheckCheck className="h-3.5 w-3.5 text-mint" />
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-mint">
                  {student.mode} match · {student.name}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-4 flex items-center justify-center gap-2">
          <ModeIcon className={cn("h-4 w-4", phase === 0 ? "text-mint" : "text-muted-foreground")} />
          <span
            className={cn(
              "font-mono text-[10px] uppercase tracking-[0.25em] transition-colors duration-300",
              phase === 0 ? "text-mint" : "text-muted-foreground"
            )}
          >
            {phase === 0 ? "Scanning — hold still" : "Identity confirmed"}
          </span>
        </div>
      </div>

      {/* ── 2 · LIVE DASHBOARD ───────────────────────────────── */}
      <div className="rounded-xl border border-white/10 bg-onyx-950/80 p-5">
        <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] text-gold">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mint opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-mint" />
          </span>
          Live Dashboard — G7 · Today
        </p>

        {/* summary counters */}
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          {[
            { label: "Present", value: 38 + present.length, cls: "text-mint" },
            { label: "Absent", value: 4, cls: "text-[#E5484D]" },
            { label: "Rate", value: "90%", cls: "text-gold" },
          ].map((s) => (
            <div key={s.label} className="rounded-lg border border-white/8 bg-onyx-900/80 px-2 py-2.5">
              <p className={cn("font-display text-xl font-semibold", s.cls)}>{s.value}</p>
              <p className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.2em] text-muted-foreground">
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* rows populate in real time */}
        <div className="mt-4 space-y-1.5" aria-live="polite">
          <AnimatePresence initial={false}>
            {present.map((name, i) => (
              <motion.div
                key={name}
                initial={{ opacity: 0, x: 22 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.45, ease: EASE, delay: i > 2 ? 0 : 0 }}
                className={cn(
                  "flex items-center justify-between rounded-md border px-3 py-2 transition-colors duration-500",
                  phase === 1 && i === present.length - 1
                    ? "border-mint/50 bg-mint/5"
                    : "border-white/6 bg-onyx-900/50"
                )}
              >
                <span className="font-mono text-[10px] tracking-[0.15em] text-foreground/85">
                  {name}
                  {i === 0 && <span className="ml-2 text-muted-foreground">· just now</span>}
                </span>
                <span className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-mint">
                  <CheckCheck className="h-3.5 w-3.5" /> Present
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        <p className="mt-3 text-center font-mono text-[9px] uppercase tracking-[0.25em] text-muted-foreground/70">
          Realtime cloud DB — all clients synced
        </p>
      </div>

      {/* ── 3 · PARENT'S PHONE — SMS ─────────────────────────── */}
      <div className="relative rounded-xl border border-white/10 bg-onyx-950/80 p-5">
        <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] text-gold">
          <BellRing className="h-4 w-4" /> The Parent
        </p>

        {/* phone frame */}
        <div className="relative mx-auto mt-5 w-full max-w-[200px] rounded-[1.4rem] border border-white/15 bg-black/70 p-2.5 shadow-[0_0_40px_-14px_rgba(212,168,87,0.4)]">
          <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-white/20" />
          <div className="rounded-xl bg-onyx-900/90 p-2.5">
            <div className="flex items-center justify-between border-b border-white/8 px-1 pb-1.5">
              <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-muted-foreground">
                Messages
              </span>
              <Signal className="h-3 w-3 text-muted-foreground" />
            </div>
            <div className="min-h-[120px] pt-2">
              <AnimatePresence mode="wait">
                {phase === 2 ? (
                  <motion.div
                    key={`sms-${studentIdx}`}
                    initial={{ opacity: 0, y: 26, scale: 0.94 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -14 }}
                    transition={{ duration: 0.5, ease: EASE }}
                    className="rounded-xl rounded-tl-sm border border-mint/30 bg-mint/10 p-2.5"
                  >
                    <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-mint">
                      ATTENDX · now
                    </p>
                    <p className="mt-1 text-[11px] leading-snug text-foreground/90">
                      ✓ {student.name} arrived at 8:02 AM — Grade 7A, marked present via {student.mode.toLowerCase()} check-in.
                    </p>
                  </motion.div>
                ) : (
                  <motion.p
                    key={`waiting-${studentIdx}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="pt-10 text-center font-mono text-[9px] uppercase tracking-[0.25em] text-muted-foreground/60"
                  >
                    {phase === 0 ? "Awaiting check-in…" : "Recording attendance…"}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <p
          className={cn(
            "mt-4 text-center font-mono text-[10px] uppercase tracking-[0.25em] transition-colors duration-500",
            phase === 2 ? "text-mint" : "text-muted-foreground"
          )}
        >
          {phase === 2 ? "SMS delivered ✓" : "Automated SMS — armed"}
        </p>
      </div>
    </div>
  );
}
