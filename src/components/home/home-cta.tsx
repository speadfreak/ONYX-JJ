"use client";

import { GradientMesh } from "@/components/effects/gradient-mesh";
import { GoldDivider } from "@/components/motion/gold-divider";
import { MagneticButton } from "@/components/motion/magnetic-button";
import { Stagger, StaggerItem } from "@/components/motion/reveal";

/** Closing home CTA — "Your move." over a living gold–mint mesh. */
export function HomeCta() {
  return (
    <section className="relative overflow-hidden py-28 sm:py-36">
      <GradientMesh variant="gold-mint" />

      <div className="relative z-10">
        <GoldDivider className="mb-16" />

        <Stagger
          stagger={0.14}
          className="mx-auto flex max-w-4xl flex-col items-center px-5 text-center sm:px-8"
        >
          <StaggerItem>
            <p className="font-mono text-[11px] uppercase tracking-[0.5em] text-gold sm:text-xs">
              Your move
            </p>
          </StaggerItem>

          <StaggerItem>
            <h2 className="mt-5 font-display text-[clamp(2.5rem,7vw,5.5rem)] font-semibold leading-[1.02] tracking-tight">
              Step inside the <span className="gold-text">story.</span>
            </h2>
          </StaggerItem>

          <StaggerItem>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              The duality, the systems, the vision — all one page away.
            </p>
          </StaggerItem>

          <StaggerItem className="mt-10">
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <MagneticButton
                href="/about"
                ariaLabel="Meet the duality — go to the about page"
                className="rounded-md bg-gold px-8 py-4 text-sm font-semibold tracking-wide text-onyx-950 transition-all duration-300 hover:bg-gold-light hover:shadow-[0_0_44px_-8px_rgba(212,168,87,0.65)]"
              >
                Meet the duality
              </MagneticButton>
              <MagneticButton
                href="/contact"
                ariaLabel="Start a conversation — go to the contact page"
                className="rounded-md border border-gold/60 px-8 py-4 text-sm font-semibold tracking-wide text-gold transition-colors duration-300 hover:bg-gold/10"
              >
                Start a conversation
              </MagneticButton>
            </div>
          </StaggerItem>
        </Stagger>
      </div>
    </section>
  );
}
