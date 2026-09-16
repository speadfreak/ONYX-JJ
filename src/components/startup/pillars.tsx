"use client";

import type { LucideIcon } from "lucide-react";
import { Cpu, HeartHandshake, Network } from "lucide-react";
import { SectionHeading } from "@/components/motion/section-heading";
import { Stagger, StaggerItem } from "@/components/motion/reveal";
import { TextilePattern } from "@/components/effects/textile-pattern";

type Pillar = {
  icon: LucideIcon;
  title: string;
  text: string;
};

const PILLARS: readonly Pillar[] = [
  {
    icon: Cpu,
    title: "Innovation",
    text: "AI, biometrics, and real-time systems — not as buzzwords, but as the default toolkit. If a problem can be sensed, predicted, or synchronized, we build it that way.",
  },
  {
    icon: Network,
    title: "Scalability",
    text: "Architecture designed for thousands of concurrent data streams from day one — event buses, reactive backends, and infrastructure that grows without rewrites.",
  },
  {
    icon: HeartHandshake,
    title: "Impact",
    text: "Real problems: a kitchen that never loses a ticket, a parent who knows their child arrived safely, a student who can afford elite prep. Logistics, education and money — the domains where software changes lives.",
  },
] as const;

function PillarCard({
  icon: Icon,
  title,
  text,
  index,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
  index: string;
}) {
  return (
    <div className="group relative h-full overflow-hidden rounded-xl border border-white/8 bg-onyx-900/60 p-7 transition-all duration-500 hover:-translate-y-1.5 hover:border-gold/40 hover:shadow-[0_0_50px_-12px_rgba(212,168,87,0.35)]">
      {/* Ghost ordinal */}
      <span
        aria-hidden
        className="pointer-events-none absolute right-6 top-4 select-none font-display text-6xl text-white/[0.04]"
      >
        {index}
      </span>

      {/* Rotated diamond icon well */}
      <div className="flex h-12 w-12 rotate-45 items-center justify-center border border-gold/40 bg-gold/5 transition-colors duration-500 group-hover:bg-gold/10">
        <Icon className="h-5 w-5 -rotate-45 text-gold" aria-hidden />
      </div>

      <h3 className="mt-6 font-display text-2xl font-semibold text-foreground">
        {title}
      </h3>
      <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
        {text}
      </p>
    </div>
  );
}

export function Pillars() {
  return (
    <section className="relative py-24 sm:py-32">
      <TextilePattern mask className="opacity-25" />

      <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
        <SectionHeading
          kicker="The Three Pillars"
          title={
            <>
              What every build is <span className="gold-text">made of.</span>
            </>
          }
        />

        <Stagger stagger={0.15} className="mt-14 grid gap-6 md:grid-cols-3">
          {PILLARS.map((pillar, i) => (
            <StaggerItem key={pillar.title} className="h-full">
              <PillarCard
                icon={pillar.icon}
                title={pillar.title}
                text={pillar.text}
                index={`0${i + 1}`}
              />
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
