"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import {
  motion,
  useAnimationControls,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { TextSwap } from "@/components/home/text-swap";
import { Tilt } from "@/components/motion/tilt";
import { GemReward, playGemChime } from "@/components/easter-egg/gem-reward";
import { GEM_FACTS } from "@/lib/data/gem-facts";
import { useExperience } from "@/lib/store/experience";
import {
  useIsLowEnd,
  useIsMobile,
  useMounted,
  usePrefersReducedMotion,
} from "@/lib/hooks";
import type { HomeContentData } from "@/lib/content";

/* Client-only WebGL scene — never touches the server bundle. */
const GemScene = dynamic(() => import("@/components/three/gem-scene"), {
  ssr: false,
});

const EASE = [0.22, 1, 0.36, 1] as const;

export interface HeroProps {
  content: Pick<
    HomeContentData,
    | "kicker"
    | "headlineLine1"
    | "headlineLine2"
    | "roles"
    | "subheadline"
    | "ctaPrimaryLabel"
    | "ctaPrimaryHref"
    | "ctaSecondaryLabel"
    | "ctaSecondaryHref"
  >;
  /** Managed media from /admin/settings */
  media: {
    videoEnabled: boolean;
    videoSrc: string;
    poster: string;
    /** true once JJ uploads his own hero poster — it must then actually
     * display instead of being covered by the bundled placeholder loop */
    posterIsCustom?: boolean;
  };
  profileImage: string;
  live: { status: boolean; url: string };
}

/**
 * Faceted SVG gem — the CSS fallback used wherever the real WebGL gem
 * can't run (mobile, reduced-motion, low-end devices).
 *
 * It is ALSO the easter-egg tap target on those devices: a real interactive
 * control (role=button) that fires the same reward handler as the 3D gem,
 * with a quick brightness/glow flash instead of the 3D fracture.
 */
function GemFallback({ className = "", onInspect }: { className?: string; onInspect?: () => void }) {
  const reduce = usePrefersReducedMotion();
  const flash = useAnimationControls();

  const inspect = () => {
    if (!reduce) {
      void flash.start({
        filter: [
          "brightness(1)",
          "brightness(2.2) drop-shadow(0 0 24px rgba(212,168,87,0.85))",
          "brightness(1)",
        ],
        transition: { duration: 0.5, ease: "easeOut" },
      });
    }
    onInspect?.();
  };

  return (
    <motion.div
      role="button"
      tabIndex={0}
      aria-label="A mysterious obsidian gem — press to inspect"
      onClick={inspect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          inspect();
        }
      }}
      animate={flash}
      data-cursor="hover"
      className={`relative flex h-full w-full cursor-pointer items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/70 focus-visible:ring-offset-4 focus-visible:ring-offset-onyx-950 ${className}`}
    >
      {/* gold radial glow */}
      <div aria-hidden className="absolute inset-[-18%] rounded-full bg-[radial-gradient(circle,rgba(212,168,87,0.16),transparent_62%)]" />
      <svg
        aria-hidden
        viewBox="0 0 200 200"
        fill="none"
        className="relative h-full w-full animate-spin-slower drop-shadow-[0_0_16px_rgba(212,168,87,0.35)]"
        style={{ animationDuration: "24s" }} /* VERY slow — 24s per turn */
      >
        <path
          d="M100 16 L178 88 L100 184 L22 88 Z"
          stroke="#D4A857"
          strokeWidth="1.6"
          fill="rgba(212,168,87,0.05)"
        />
        <path
          d="M22 88 H178 M100 16 L64 88 L100 184 M100 16 L136 88 L100 184 M100 16 V184"
          stroke="#D4A857"
          strokeOpacity="0.5"
          strokeWidth="1"
        />
      </svg>
    </motion.div>
  );
}

export function Hero({ content, media, profileImage, live }: HeroProps) {
  const isMobile = useIsMobile();
  const reduce = usePrefersReducedMotion();
  const lowEnd = useIsLowEnd();
  const mounted = useMounted();

  /* The real 3D gem only for capable desktops; everyone else gets the SVG. */
  const showGem = mounted && !isMobile && !reduce && !lowEnd;

  /* Section-level pointer → soft spring tilt on the gem container. */
  const sectionRef = useRef<HTMLElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const gemRotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-4, 4]), {
    stiffness: 60,
    damping: 18,
  });
  const gemRotateX = useSpring(useTransform(my, [-0.5, 0.5], [4, -4]), {
    stiffness: 60,
    damping: 18,
  });

  /* Video plays only when enabled AND (a custom video exists OR no custom
     poster was uploaded). Rationale: if JJ sets a custom poster with no
     custom loop, the poster is the art he chose — the bundled placeholder
     loop must not cover it (that was the "hero poster never appears" bug:
     desktop played the placeholder forever and the uploaded poster 404'd). */
  const showVideo =
    media.videoEnabled && !isMobile && !reduce && (media.videoSrc ? true : !media.posterIsCustom);

  /* ── Easter egg: shared reward handler (3D gem + SVG fallbacks) ─────
     Fires the WebAudio chime (mute-aware), flips the accent to the secret
     "prism", unlocks the session flag, counts the find in /api/track and
     advances the rotating fact. Sound is created lazily INSIDE this user
     gesture, so there is no autoplay concern. */
  const [rewardOpen, setRewardOpen] = useState(false);
  const [factIndex, setFactIndex] = useState(-1); // first click → fact 0
  const [justUnlocked, setJustUnlocked] = useState(false);

  const handleGemFound = useCallback(() => {
    const exp = useExperience.getState();
    playGemChime(exp.muted);

    // The reward IS the prism accent — always apply it; the panel footer
    // only shouts about it on the find that actually changed the accent.
    setJustUnlocked(exp.accent !== "prism");
    exp.unlockGem();
    exp.setAccent("prism");

    // Fire-and-forget analytics (never blocks, never throws)
    void fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "gem" }),
      keepalive: true,
    }).catch(() => {});

    setFactIndex((i) => (i + 1) % GEM_FACTS.length);
    setRewardOpen(true);
  }, []);

  const closeReward = useCallback(() => setRewardOpen(false), []);

  const currentFact = GEM_FACTS[factIndex] ?? GEM_FACTS[0];

  return (
    <section
      id="hero"
      ref={sectionRef}
      className="relative flex min-h-[100svh] items-center overflow-hidden"
      onMouseMove={(e) => {
        const r = sectionRef.current?.getBoundingClientRect();
        if (!r) return;
        mx.set((e.clientX - r.left) / r.width - 0.5);
        my.set((e.clientY - r.top) / r.height - 0.5);
      }}
      onMouseLeave={() => {
        mx.set(0);
        my.set(0);
      }}
    >
      {/* ── Background ───────────────────────────────────────────────────
          Managed from /admin/settings (asset manager + video feature toggle).
          Default (no upload): bundled /video/hero-loop.* PLACEHOLDER loop. */}
      {showVideo ? (
        <video
          ref={(el) => {
            if (el) el.muted = true; // SSR-safe autoplay guarantee
          }}
          autoPlay
          muted
          loop
          playsInline
          poster={media.poster}
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover opacity-55"
        >
          {media.videoSrc ? (
            <source src={media.videoSrc} type={media.videoSrc.endsWith(".webm") ? "video/webm" : "video/mp4"} />
          ) : (
            <>
              <source src="/video/hero-loop.webm" type="video/webm" />
              <source src="/video/hero-loop.mp4" type="video/mp4" />
            </>
          )}
        </video>
      ) : (
        <>
          <Image
            src={media.poster}
            alt=""
            fill
            priority
            sizes="100vw"
            aria-hidden
            className="object-cover opacity-55"
          />
          {/* one soft breathing gradient keeps the still image alive */}
          <div
            aria-hidden
            className="absolute inset-0 animate-pulse-soft bg-[radial-gradient(60%_50%_at_70%_40%,rgba(212,168,87,0.14),transparent_70%)]"
          />
        </>
      )}

      {/* legibility overlays */}
      <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-onyx-950/80 via-onyx-950/30 to-onyx-950" />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-onyx-950/60 to-transparent" />

      {/* ── 3D gem (desktop, capable devices) / SVG fallback ──────────── */}
      <div
        aria-hidden={showGem || undefined}
        className="absolute right-[-4%] top-1/2 z-0 hidden h-[46vw] max-h-[560px] w-[46vw] max-w-[560px] -translate-y-1/2 md:block"
      >
        <motion.div
          className="h-full w-full"
          style={{
            rotateX: gemRotateX,
            rotateY: gemRotateY,
            transformPerspective: 1000,
          }}
        >
          {showGem ? <GemScene onFound={handleGemFound} /> : <GemFallback onInspect={handleGemFound} />}
        </motion.div>
      </div>
      {/* Keyboard access to the decorative 3D gem — pointer-events-none so
          mouse clicks keep reaching the canvas mesh (fracture), while Tab
          surfaces a gold ring over the gem and Enter/Space fires the same
          reward handler. */}
      {showGem && (
        <button
          type="button"
          onClick={handleGemFound}
          className="pointer-events-none absolute right-[-4%] top-1/2 z-[1] hidden h-[46vw] max-h-[560px] w-[46vw] max-w-[560px] -translate-y-1/2 items-center justify-center rounded-full border border-transparent opacity-0 transition-opacity duration-200 focus-visible:border-gold/70 focus-visible:opacity-100 focus-visible:shadow-[0_0_50px_-10px_rgba(212,168,87,0.55)] focus-visible:outline-none md:flex"
        >
          <span className="sr-only">Inspect the onyx gem</span>
        </button>
      )}
      {/* compact gem motif for phones — a real tap target for the easter egg */}
      <div className="absolute right-3 top-24 z-0 w-24 opacity-60 sm:w-28 md:hidden">
        <GemFallback onInspect={handleGemFound} />
      </div>

      {/* ── Content ────────────────────────────────────────────────────── */}
      <div className="relative z-10 mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-12 px-5 py-24 sm:px-8 lg:grid-cols-[1.2fr_auto] lg:py-0">
        {/* Left — headline stack */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.05, ease: EASE }}
            className="flex items-center gap-4"
          >
            <p className="font-mono text-[11px] uppercase tracking-[0.5em] text-gold">
              {content.kicker}
            </p>
            {live.status && (
              <a
                href={live.url || "#"}
                target={live.url ? "_blank" : undefined}
                rel={live.url ? "noreferrer noopener" : undefined}
                className="flex items-center gap-2 rounded-full border border-mint/40 bg-mint/10 px-3 py-1 backdrop-blur-sm transition-all duration-300 hover:border-mint hover:shadow-[0_0_20px_-4px_rgba(0,229,160,0.6)]"
                aria-label="JJ is live now — join the stream"
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mint opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-mint" />
                </span>
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.3em] text-mint">
                  LIVE
                </span>
              </a>
            )}
          </motion.div>

          <h1 className="mt-6 font-display text-[clamp(3.2rem,11vw,9rem)] font-semibold leading-[0.92] tracking-tight">
            <span className="sr-only">
              Joseph James — fullstack developer, forex trader &amp; streamer
            </span>
            <span aria-hidden className="block overflow-hidden">
              {content.headlineLine1.split("").map((ch, i) => (
                <motion.span
                  key={i}
                  className="inline-block will-change-transform"
                  initial={{ y: "110%" }}
                  animate={{ y: 0 }}
                  transition={{ duration: 0.9, delay: 0.15 + i * 0.045, ease: EASE }}
                >
                  {ch}
                </motion.span>
              ))}
            </span>
            <span aria-hidden className="block overflow-hidden">
              {content.headlineLine2.split("").map((ch, i) => (
                <motion.span
                  key={i}
                  className="gold-text inline-block will-change-transform"
                  initial={{ y: "110%" }}
                  animate={{ y: 0 }}
                  transition={{
                    duration: 0.9,
                    delay: 0.15 + (content.headlineLine1.length + i) * 0.045,
                    ease: EASE,
                  }}
                >
                  {ch}
                </motion.span>
              ))}
            </span>
          </h1>

          {/* rotating role — gold dash + TextSwap */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.7, ease: EASE }}
            className="mt-7 flex items-center gap-4"
          >
            <span aria-hidden className="h-px w-10 shrink-0 bg-gradient-to-r from-gold to-transparent" />
            <TextSwap
              words={content.roles.length ? content.roles : ["Fullstack Developer"]}
              className="font-display text-2xl italic text-gold sm:text-3xl"
            />
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.85, ease: EASE }}
            className="mt-6 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg"
          >
            {content.subheadline}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.95, ease: EASE }}
            className="mt-10 flex flex-wrap items-center gap-4"
          >
            <Link
              href={content.ctaPrimaryHref}
              data-cursor="hover"
              className="rounded-md bg-gold px-7 py-3.5 text-sm font-semibold tracking-wide text-onyx-950 transition-all duration-300 hover:bg-gold-light hover:shadow-[0_0_40px_-8px_rgba(212,168,87,0.6)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-onyx-950"
            >
              {content.ctaPrimaryLabel}
            </Link>
            <Link
              href={content.ctaSecondaryHref}
              data-cursor="hover"
              className="rounded-md border border-white/15 px-7 py-3.5 text-sm font-semibold tracking-wide text-foreground transition-colors duration-300 hover:border-gold/60 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-onyx-950"
            >
              {content.ctaSecondaryLabel}
            </Link>
          </motion.div>
        </div>

        {/* Right — portrait with rotating gold ring light */}
        {/* PROFILE PHOTO — replace from /admin/settings → Asset manager */}
        <Tilt className="order-first mx-auto lg:order-none lg:mx-0">
          <div className="relative h-36 w-36 sm:h-80 sm:w-80">
            <div
              aria-hidden
              className="absolute -inset-1.5 animate-spin-slower rounded-full"
              style={{
                background:
                  "conic-gradient(from 0deg, transparent, #D4A857, transparent 40%)",
              }}
            />
            <div className="glow-gold relative h-full w-full overflow-hidden rounded-full border border-gold/30">
              <Image
                src={profileImage}
                alt="Portrait of Joseph James"
                fill
                priority
                sizes="(max-width: 640px) 144px, 320px"
                className="object-cover object-top grayscale-[20%] contrast-[1.05]"
              />
            </div>
          </div>
        </Tilt>
      </div>

      {/* ── Scroll cue ─────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.6 }}
        className="absolute bottom-8 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-2 sm:flex"
      >
        <span className="font-mono text-[10px] tracking-[0.4em] text-muted-foreground">
          SCROLL
        </span>
        <span className="h-10 w-px animate-pulse bg-gradient-to-b from-gold to-transparent" />
      </motion.div>

      {/* ── Easter egg reward panel (bottom-left; bottom-right is reserved
          for the future Ask JJ bubble) ───────────────────────────────── */}
      <GemReward
        open={rewardOpen}
        onClose={closeReward}
        fact={currentFact}
        showUnlockNote={justUnlocked}
        totalFacts={GEM_FACTS.length}
        factNumber={factIndex + 1}
      />
    </section>
  );
}
