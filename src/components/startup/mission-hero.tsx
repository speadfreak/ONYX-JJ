"use client";

import Image from "next/image";
import { ArrowRight, MessagesSquare } from "lucide-react";
import { GradientMesh } from "@/components/effects/gradient-mesh";
import { MagneticButton } from "@/components/motion/magnetic-button";
import { Stagger, StaggerItem } from "@/components/motion/reveal";

/**
 * Deterministic particle field — positions/durations are a fixed const array
 * (NO Math.random at render) so SSR markup and client hydration match exactly.
 * Drift direction/opacity ride on CSS vars consumed by the `.particle` keyframes.
 */
type Particle = {
  left: string;
  top: string;
  size: number;
  x: string;
  y: string;
  dur: string;
  delay: string;
  opacity: number;
};

const PARTICLES: readonly Particle[] = [
  { left: "6%", top: "78%", size: 2, x: "26px", y: "-320px", dur: "17s", delay: "0s", opacity: 0.55 },
  { left: "12%", top: "70%", size: 3, x: "-18px", y: "-260px", dur: "21s", delay: "2.5s", opacity: 0.7 },
  { left: "23%", top: "86%", size: 2, x: "14px", y: "-380px", dur: "24s", delay: "6s", opacity: 0.4 },
  { left: "34%", top: "64%", size: 3, x: "30px", y: "-300px", dur: "19s", delay: "1.2s", opacity: 0.6 },
  { left: "47%", top: "90%", size: 2, x: "-24px", y: "-340px", dur: "26s", delay: "4.4s", opacity: 0.45 },
  { left: "58%", top: "74%", size: 3, x: "20px", y: "-280px", dur: "18s", delay: "8.1s", opacity: 0.65 },
  { left: "69%", top: "82%", size: 2, x: "-30px", y: "-360px", dur: "22s", delay: "3.3s", opacity: 0.5 },
  { left: "78%", top: "68%", size: 3, x: "16px", y: "-310px", dur: "20s", delay: "9.6s", opacity: 0.75 },
  { left: "88%", top: "88%", size: 2, x: "-14px", y: "-330px", dur: "23s", delay: "5.2s", opacity: 0.42 },
  { left: "94%", top: "60%", size: 3, x: "22px", y: "-290px", dur: "25s", delay: "7.4s", opacity: 0.58 },
] as const;

export function MissionHero() {
  return (
    <section className="relative flex min-h-[88svh] items-center overflow-hidden">
      {/* Lattice backdrop — molten gold geometry fading into obsidian */}
      <Image
        src="/images/startup-bg.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover opacity-40"
      />
      <GradientMesh variant="gold-mint" />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-b from-onyx-950/70 via-onyx-950/45 to-onyx-950"
      />

      {/* Drifting embers (decorative) */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {PARTICLES.map((p, i) => (
          <span
            key={i}
            className="particle absolute rounded-full bg-gold/70"
            style={
              {
                left: p.left,
                top: p.top,
                width: p.size,
                height: p.size,
                "--p-x": p.x,
                "--p-y": p.y,
                "--p-dur": p.dur,
                "--p-delay": p.delay,
                "--p-opacity": p.opacity,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      <div className="relative mx-auto w-full max-w-6xl px-5 py-28 sm:px-8">
        <Stagger stagger={0.14} amount={0.1}>
          <StaggerItem>
            <p className="font-mono text-[11px] uppercase tracking-[0.4em] text-gold sm:text-xs">
              The Vision
            </p>
          </StaggerItem>

          <StaggerItem>
            <h1 className="mt-6 max-w-4xl font-display text-[clamp(2.8rem,8vw,6.5rem)] font-semibold leading-[1.0] tracking-tight text-foreground">
              Building technology from{" "}
              <span className="gold-text">Addis Ababa</span> outward.
            </h1>
          </StaggerItem>

          <StaggerItem>
            <p className="mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              The next generation of world-class platforms doesn&rsquo;t need a
              Silicon Valley address. It needs architecture that scales, taste
              that travels, and problems worth solving. We engineer exactly
              that — world-class, real-time systems rooted in African talent
              and ambition, built for the continent first and the world
              immediately after.
            </p>
          </StaggerItem>

          <StaggerItem>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <MagneticButton
                href="/work"
                ariaLabel="See the proof — explore shipped products"
                className="group inline-flex h-12 items-center gap-2 rounded-md bg-gold px-7 text-sm font-semibold tracking-wide text-onyx-950 transition-all duration-300 hover:glow-gold"
              >
                See the proof
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                  aria-hidden
                />
              </MagneticButton>
              <MagneticButton
                href="/contact"
                ariaLabel="Talk vision — get in touch with JJ"
                className="inline-flex h-12 items-center gap-2 rounded-md border border-white/15 bg-onyx-950/40 px-7 text-sm font-semibold tracking-wide text-foreground backdrop-blur transition-all duration-300 hover:border-gold/60 hover:text-gold"
              >
                <MessagesSquare className="h-4 w-4" aria-hidden />
                Talk vision
              </MagneticButton>
            </div>
          </StaggerItem>
        </Stagger>
      </div>

      {/* Fade the lattice out into the pillars section */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-onyx-950"
      />
    </section>
  );
}
