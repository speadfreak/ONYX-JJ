"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Gem, X } from "lucide-react";
import { usePrefersReducedMotion } from "@/lib/hooks";

const EASE = [0.22, 1, 0.36, 1] as const;

export interface GemFact {
  title: string;
  body: string;
}

/**
 * Short synthesized chime for the gem easter egg — two oscillators
 * (880 Hz sine + 1320 Hz triangle) through a ~0.5s gain envelope.
 *
 * MUST be called from inside a user gesture (the gem click handler) so the
 * lazy AudioContext is allowed to start. Respects the site mute flag —
 * when `muted` is true this is a no-op. No audio files, pure WebAudio.
 */
export function playGemChime(muted: boolean): void {
  if (muted || typeof window === "undefined") return;
  try {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    void ctx.resume().catch(() => {});
    const now = ctx.currentTime;

    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.08, now + 0.02);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);
    master.connect(ctx.destination);

    const voices: Array<{ freq: number; type: OscillatorType; level: number }> = [
      { freq: 880, type: "sine", level: 0.6 },
      { freq: 1320, type: "triangle", level: 0.35 },
    ];
    for (const v of voices) {
      const osc = ctx.createOscillator();
      osc.type = v.type;
      osc.frequency.setValueAtTime(v.freq, now);
      const g = ctx.createGain();
      g.gain.value = v.level;
      osc.connect(g);
      g.connect(master);
      osc.start(now);
      osc.stop(now + 0.6);
      osc.onended = () => {
        void ctx.close().catch(() => {});
      };
    }
  } catch {
    /* Audio is a nicety — never let it break the reward. */
  }
}

/**
 * Reward toast for the gem easter egg — fixed bottom-LEFT (bottom-right is
 * reserved for the future Ask JJ bubble). Glass panel, facet clip, gold glow.
 * Auto-dismisses after ~7s; the timer resets when the fact changes so a
 * re-click while open simply swaps to the next fact.
 */
export function GemReward({
  open,
  onClose,
  fact,
  showUnlockNote,
  totalFacts,
  factNumber,
  dismissMs = 7000,
}: {
  open: boolean;
  onClose: () => void;
  fact: GemFact;
  /** True only on the find that actually flipped the accent to "prism". */
  showUnlockNote: boolean;
  totalFacts: number;
  /** 1-based index of the current fact. */
  factNumber: number;
  dismissMs?: number;
}) {
  const reduce = usePrefersReducedMotion();

  useEffect(() => {
    if (!open) return;
    const id = setTimeout(onClose, dismissMs);
    return () => clearTimeout(id);
  }, [open, onClose, dismissMs, fact]);

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          key="gem-reward"
          role="status"
          aria-live="polite"
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 32, x: -6 }}
          animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, x: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
          transition={{ duration: reduce ? 0.2 : 0.4, ease: EASE }}
          className="glow-gold-sm fixed bottom-24 left-5 z-[86] w-[calc(100vw-2.5rem)] max-w-sm sm:left-8"
        >
          <div className="facet-clip-sm glass-panel relative border border-gold/30 p-5 backdrop-blur-md">
            <button
              type="button"
              onClick={onClose}
              aria-label="Dismiss reward"
              className="absolute right-3 top-3 rounded-sm p-1.5 text-muted-foreground transition-colors duration-200 hover:text-gold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold/70"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={fact.title}
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10 }}
                animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
                transition={{ duration: reduce ? 0.15 : 0.22, ease: EASE }}
              >
                <p className="flex items-center gap-2.5 font-mono text-[10px] uppercase tracking-[0.4em] text-gold">
                  <Gem className="h-3.5 w-3.5" aria-hidden />
                  You found it
                </p>
                <p className="gold-text mt-3 font-display text-2xl font-semibold leading-snug">
                  {fact.title}
                </p>
                <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                  {fact.body}
                </p>
              </motion.div>
            </AnimatePresence>

            <p className="mt-4 border-t border-white/8 pt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/80">
              {showUnlockNote ? (
                <span className="text-mint">Prism accent unlocked for this session</span>
              ) : (
                <>
                  Gem fact {factNumber} / {totalFacts} — click the gem again for another
                </>
              )}
            </p>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
