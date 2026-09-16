"use client";

import Image from "next/image";
import { GradientMesh } from "@/components/effects/gradient-mesh";
import { Stagger, StaggerItem } from "@/components/motion/reveal";
import { ContactForm } from "@/components/contact/contact-form";

/**
 * Giant onyx facet — hexagon/diamond linework slowly rotating behind the copy.
 * 90s rotation inline (overrides the 16s default of .animate-spin-slower).
 */
function FacetGlyph() {
  return (
    <svg
      viewBox="0 0 200 200"
      aria-hidden
      className="animate-spin-slower absolute -top-[10%] right-[-10%] h-[42rem] w-[42rem] text-gold opacity-[0.05]"
      style={{ animationDuration: "90s" }}
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
    >
      {/* Outer hexagon */}
      <path d="M100 6 180 53 180 147 100 194 20 147 20 53Z" />
      {/* Inner diamond */}
      <path d="M100 34 172 100 100 166 28 100Z" />
      {/* Facet cuts */}
      <path d="M100 6 100 34M180 53 172 100M180 147 172 100M100 194 100 166M20 147 28 100M20 53 28 100" />
      <path d="M40 40 100 34 160 40M160 40 172 100M160 160 100 166 40 160M40 160 28 100" />
      <circle cx="100" cy="100" r="6" />
    </svg>
  );
}

export function ContactHero({ profileImage }: { profileImage?: string }) {
  return (
    <section className="relative overflow-hidden pt-36 pb-24 sm:pt-44">
      <GradientMesh variant="gold-mint" />
      <FacetGlyph />

      <div className="relative mx-auto grid max-w-6xl gap-16 px-5 sm:px-8 lg:grid-cols-[1.1fr_1fr]">
        {/* ── Left: the close ── */}
        <Stagger stagger={0.14} amount={0.1}>
          <StaggerItem>
            <p className="font-mono text-[11px] uppercase tracking-[0.4em] text-gold sm:text-xs">
              The Close
            </p>
          </StaggerItem>

          <StaggerItem>
            <h1 className="mt-6 font-display text-[clamp(2.8rem,7vw,5.5rem)] font-semibold leading-[1.0] tracking-tight text-foreground">
              Let&rsquo;s build <span className="gold-text">what&rsquo;s next.</span>
            </h1>
          </StaggerItem>

          <StaggerItem>
            <p className="mt-8 max-w-lg text-lg leading-relaxed text-muted-foreground">
              Whether it&rsquo;s an engineering problem, a trading question, or
              just a hello — my inbox is open. I read everything, and I reply
              to the interesting ones. Fast.
            </p>
          </StaggerItem>

          <StaggerItem>
            <div className="mt-10 flex items-center gap-4">
              {/* PROFILE PHOTO — replace from /admin/settings → Asset manager */}
              <div className="glow-gold-sm relative h-16 w-16 shrink-0 overflow-hidden rounded-full border border-gold/40">
                <Image
                  src={profileImage || "/images/jj-profile.jpg"}
                  alt="Portrait of Joseph James"
                  fill
                  sizes="64px"
                  className="object-cover object-top"
                />
              </div>
              <div>
                <p className="font-semibold text-foreground">Joseph James</p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                  Addis Ababa · Dubai · online
                </p>
              </div>
            </div>
          </StaggerItem>
        </Stagger>

        {/* ── Right: the form ── */}
        <Stagger stagger={0.1} delay={0.15} amount={0.1}>
          <StaggerItem>
            <ContactForm />
          </StaggerItem>
        </Stagger>
      </div>
    </section>
  );
}
