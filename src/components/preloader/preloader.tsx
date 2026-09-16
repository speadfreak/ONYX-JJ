"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { TextilePattern } from "@/components/effects/textile-pattern";
import { useAmbientAudio } from "@/components/providers/audio-provider";
import { startScroll, stopScroll } from "@/components/providers/smooth-scroll";
import { usePrefersReducedMotion } from "@/lib/hooks";
import { useExperience } from "@/lib/store/experience";

const EASE = [0.22, 1, 0.36, 1] as const;
const WIPE_EASE = [0.76, 0, 0.24, 1] as const;

/** J, J, space, O, N, Y, X — assembled letter by letter. */
const WORDMARK = ["J", "J", " ", "O", "N", "Y", "X"];
const TAGLINE = "Builder. Trader. Storyteller.";

/**
 * Cinematic fullscreen preloader + audio gate (home page only, once per
 * session). Wordmark assembles → tagline types in → gold progress line →
 * "ENTER EXPERIENCE" gate. The click is mandatory: it is the browser
 * gesture that unlocks the ambient soundtrack.
 *
 * z-[90] (not z-100) on purpose: it must sit above the header (z-70/75)
 * and film grain (z-80) but BELOW the custom cursor layer (z-95) — the
 * native cursor is globally hidden, so the gold cursor dot/ring is the
 * only pointer the visitor has on this screen.
 */
export function Preloader() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const entered = useExperience((s) => s.entered);
  const hydrate = useExperience((s) => s.hydrate);
  const setEntered = useExperience((s) => s.setEntered);
  const { start: startAudio } = useAmbientAudio();
  const reduce = usePrefersReducedMotion();

  const [ready, setReady] = useState(false); // sessionStorage hydrated
  const [typed, setTyped] = useState(0); // tagline typewriter head
  const [progress, setProgress] = useState(0); // 0–100
  const [buttonReady, setButtonReady] = useState(false);

  // Hydrate once: returning visitors skip the gate entirely.
  useEffect(() => {
    hydrate();
    if (useExperience.getState().entered) startScroll(); // ensure scroll is live
    setReady(true);
  }, [hydrate]);

  // Home-only: the gate mounts in the root layout (outside the route
  // template) so its fixed overlay is never trapped by an ancestor
  // stacking context / containing block.
  const show = isHome && ready && !entered;

  // Lock scroll while the gate is up; restore on teardown (enter / unmount).
  useEffect(() => {
    if (!show) return;
    stopScroll();
    return () => startScroll();
  }, [show]);

  // Phases: typewriter (~0.9s start), progress (~2s), enter button (~2.4s).
  useEffect(() => {
    if (!show) return;

    if (reduce) {
      // Reduced motion: instant text, still requires the Enter gesture.
      setTyped(TAGLINE.length);
      setProgress(100);
      setButtonReady(true);
      return;
    }

    let typeInterval: ReturnType<typeof setInterval> | undefined;
    const typeStart = window.setTimeout(() => {
      typeInterval = setInterval(() => {
        setTyped((t) => {
          if (t >= TAGLINE.length) {
            if (typeInterval) clearInterval(typeInterval);
            return t;
          }
          return t + 1;
        });
      }, 45);
    }, 900);

    const startedAt = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(100, Math.round(((now - startedAt) / 2000) * 100));
      setProgress(p);
      if (p < 100) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const btnTimer = window.setTimeout(() => setButtonReady(true), 2400);

    return () => {
      window.clearTimeout(typeStart);
      window.clearTimeout(btnTimer);
      if (typeInterval) clearInterval(typeInterval);
      cancelAnimationFrame(raf);
    };
  }, [show, reduce]);

  const handleEnter = () => {
    startAudio(); // unlock ambient audio within the user gesture
    setEntered(true); // persists (jj-onyx-entered) + triggers the exit wipe
  };

  return (
    <AnimatePresence onExitComplete={() => startScroll()}>
      {show ? (
        <motion.div
          key="preloader"
          role="dialog"
          aria-label="Experience intro"
          className="fixed inset-0 z-[90] flex flex-col items-center justify-center overflow-hidden bg-onyx-950"
          initial={{ clipPath: "inset(0 0 0% 0)" }}
          exit={
            reduce
              ? { opacity: 0 }
              : { clipPath: "inset(0 0 100% 0)", scale: 1.04 }
          }
          transition={{ duration: reduce ? 0.4 : 0.8, ease: reduce ? "easeOut" : WIPE_EASE }}
        >
          {/* radial vignette + textile texture */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(10,10,15,0.85)_100%)]"
          />
          <TextilePattern className="opacity-10!" />

          <div className="relative flex flex-col items-center px-6 text-center">
            {/* Phase 1 — wordmark assembly */}
            <p className="sr-only">JJ ONYX</p>
            <div
              aria-hidden
              className="font-display text-[clamp(3rem,12vw,7rem)] font-semibold leading-none tracking-tight"
            >
              {WORDMARK.map((ch, i) =>
                ch === " " ? (
                  <span key={i} className="inline-block w-[0.35em]" />
                ) : (
                  <motion.span
                    key={i}
                    className={`inline-block ${i < 2 ? "gold-text" : "text-foreground"}`}
                    initial={{
                      opacity: 0,
                      y: i % 2 === 0 ? 44 : -44,
                      rotate: i % 2 === 0 ? 8 : -8,
                    }}
                    animate={{ opacity: 1, y: 0, rotate: 0 }}
                    transition={{ duration: 0.7, delay: 0.15 + i * 0.09, ease: EASE }}
                  >
                    {ch}
                  </motion.span>
                )
              )}
            </div>

            {/* Phase 2 — typewriter tagline */}
            <p className="sr-only">{TAGLINE}</p>
            <p
              aria-hidden
              className="mt-6 h-5 font-mono text-sm uppercase tracking-[0.35em] text-muted-foreground sm:h-6 sm:text-base"
            >
              {TAGLINE.slice(0, typed)}
              {typed > 0 && typed < TAGLINE.length ? (
                <span className="animate-caret text-gold">▌</span>
              ) : null}
            </p>

            {/* Phase 3 — gold progress line + counter */}
            <div className="mt-12 flex items-center gap-4">
              <div
                role="progressbar"
                aria-label="Loading the experience"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progress}
                className="h-px w-56 overflow-hidden bg-white/10"
              >
                <div
                  className="h-full w-full origin-left bg-gradient-to-r from-gold-dark via-gold to-gold-light"
                  style={{ transform: `scaleX(${progress / 100})` }}
                />
              </div>
              <span
                aria-hidden
                className="w-10 font-mono text-xs tabular-nums text-gold"
              >
                {progress}%
              </span>
            </div>

            {/* Phase 4 — the gate (fixed-height slot prevents layout shift) */}
            <div className="mt-12 flex h-[72px] items-center justify-center">
              {buttonReady ? (
                <motion.span
                  className="relative inline-block"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: EASE }}
                >
                  {/* soft pulsing outer ring */}
                  <span
                    aria-hidden
                    className="absolute -inset-1.5 animate-pulse-soft border border-gold/30"
                  />
                  <button
                    type="button"
                    onClick={handleEnter}
                    data-cursor="hover"
                    className="relative border border-gold/60 px-10 py-4 font-mono text-xs uppercase tracking-[0.4em] text-gold transition-colors duration-300 hover:bg-gold hover:text-onyx-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-onyx-950"
                  >
                    Enter Experience
                  </button>
                  <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground/70">
                    Sound on — headphones recommended
                  </span>
                </motion.span>
              ) : null}
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
