"use client";

import Image from "next/image";
import { Stagger, StaggerItem } from "@/components/motion/reveal";
import { Tilt } from "@/components/motion/tilt";

/**
 * JJ ONYX /about — portrait + origin story.
 * Left: faceted gold-edged cinematic portrait (tilt + mint reflection).
 * Right: staggered story copy + discipline chips.
 */

const CHIPS = ["FULLSTACK DEVELOPER", "FOREX TRADER", "FOREX STREAMER", "FOUNDER"] as const;

export function PortraitIntro({ profileImage }: { profileImage?: string }) {
  const img = profileImage || "/images/jj-profile.jpg";
  return (
    <section className="relative py-20 sm:py-28" aria-label="Joseph James — the story so far">
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 sm:px-8 lg:grid-cols-[0.9fr_1.1fr]">
        {/* ── LEFT — the portrait ─────────────────────────────────────────── */}
        <div className="relative">
          {/* PROFILE PHOTO — replace from /admin/settings → Asset manager */}
          <Tilt max={10} className="relative mx-auto w-full max-w-md">
            {/* gold-edge treatment: facet-clipped gradient ring (p-px trick) */}
            <div className="facet-clip glow-gold bg-gradient-to-br from-gold/70 via-gold/20 to-transparent p-px">
              <div className="facet-clip relative aspect-[4/5] w-full overflow-hidden bg-onyx-900">
                <Image
                  src={img}
                  alt="Cinematic portrait of Joseph James — JJ ONYX"
                  fill
                  priority
                  sizes="(min-width: 1024px) 448px, (min-width: 640px) 60vw, 90vw"
                  className="object-cover object-top"
                />
                {/* depth shade so the caption zone stays legible */}
                <div
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-t from-onyx-950/70 via-transparent to-onyx-950/10"
                />
              </div>
            </div>
          </Tilt>

          {/* faint mint reflection */}
          <div
            aria-hidden
            className="facet-clip relative mx-auto -mt-2 h-16 w-full max-w-md overflow-hidden opacity-20 [mask-image:linear-gradient(to_bottom,black,transparent_72%)]"
          >
            <Image
              src={img}
              alt=""
              fill
              sizes="(min-width: 1024px) 448px, 90vw"
              className="-scale-y-100 object-cover blur-[2px]"
            />
            <div className="absolute inset-0 bg-mint/15 mix-blend-screen" />
          </div>

          <p className="mt-5 text-center font-mono text-[10px] uppercase tracking-[0.35em] text-muted-foreground">
            JOSEPH JAMES — ADDIS ABABA · DUBAI
          </p>
        </div>

        {/* ── RIGHT — the story ───────────────────────────────────────────── */}
        <Stagger className="relative">
          <StaggerItem>
            <p className="font-mono text-[11px] uppercase tracking-[0.4em] text-gold">
              The Story So Far
            </p>
          </StaggerItem>
          <StaggerItem>
            <h2 className="mt-6 font-display text-4xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-5xl">
              One background wasn&rsquo;t going to be <span className="gold-text italic">enough</span>.
            </h2>
          </StaggerItem>
          <StaggerItem>
            <p className="mt-8 border-l-2 border-gold/60 pl-5 leading-relaxed text-muted-foreground">
              I grew up between two worlds — the highland calm of Ethiopia and the restless fire of
              Nigeria. From my Ethiopian roots I inherited discipline: patience, precision, the long
              game. From my Nigerian roots I inherited audacity: color, rhythm, the nerve to take up
              space.
            </p>
          </StaggerItem>
          <StaggerItem>
            <p className="mt-6 leading-relaxed text-muted-foreground">
              JJ ONYX is where those two currents meet. An 18-year-old founder building real-time
              platforms by day, reading liquidity by night, and streaming the entire journey in
              between — a mind polished under pressure, the way stone becomes gem.
            </p>
          </StaggerItem>
          <StaggerItem>
            <div className="mt-9 flex flex-wrap gap-2">
              {CHIPS.map((chip) => (
                <span
                  key={chip}
                  className="rounded-full border border-gold/25 bg-gold/5 px-4 py-1.5 font-mono text-[10px] tracking-[0.25em] text-gold-light"
                >
                  {chip}
                </span>
              ))}
            </div>
          </StaggerItem>
        </Stagger>
      </div>
    </section>
  );
}
