"use client";

import { Badge } from "@/components/ui/badge";
import { SectionHeading } from "@/components/motion/section-heading";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";

type Trajectory = {
  domain: string;
  description: string;
  status: string;
  statusClass: string;
};

const TRAJECTORIES: readonly Trajectory[] = [
  {
    domain: "Hospitality Ops",
    description:
      "TG's Restaurant ERP — live in Dubai today. Next: multi-branch support and driver routing.",
    status: "Shipped",
    statusClass: "border-mint/40 bg-mint/10 text-mint",
  },
  {
    domain: "Education Infra",
    description:
      "Learnyx Academy — growing exam-prep cohorts toward national exam season. Next: mobile apps and offline-first study packs.",
    status: "Scaling",
    statusClass: "border-gold/40 bg-gold/10 text-gold-light",
  },
  {
    domain: "Fintech & Streaming",
    description:
      "JJ NEXUS PRO — browser-to-RTMP engine stabilizing for public launch. Next: multi-guest streams.",
    status: "Public Beta",
    statusClass: "border-ice/40 bg-ice/10 text-ice",
  },
  {
    domain: "AI Public Safety",
    description:
      "ATTENDX⚡ — piloting in Ethiopian schools. Next: geofenced arrival verification, digital student IDs, predictive attendance-risk analytics.",
    status: "In Pilot",
    statusClass: "border-mint/40 bg-mint/10 text-mint",
  },
] as const;

export function Headed() {
  return (
    <section className="relative border-t border-white/5 bg-onyx-900/30 py-24 sm:py-28">
      <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
        <SectionHeading
          kicker="Where We're Headed"
          title={
            <>
              Four domains. <span className="gold-text">One trajectory.</span>
            </>
          }
          description="Four systems shipped across radically different domains — hospitality operations, education infrastructure, fintech/streaming, and AI-driven public safety. Not pivots: proof of range."
        />

        <Stagger stagger={0.1} className="mt-12 space-y-4">
          {TRAJECTORIES.map((t) => (
            <StaggerItem key={t.domain}>
              <div className="group grid items-center gap-5 rounded-xl border border-white/8 bg-onyx-950/70 p-5 transition duration-500 hover:border-gold/30 sm:p-6 md:grid-cols-[auto_1fr_auto]">
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-gold/80 md:w-40">
                  {t.domain}
                </p>
                <p className="text-[15px] leading-relaxed text-muted-foreground">
                  {t.description}
                </p>
                <Badge
                  className={`justify-self-start font-mono text-[10px] uppercase tracking-[0.25em] md:justify-self-end ${t.statusClass}`}
                >
                  {t.status}
                </Badge>
              </div>
            </StaggerItem>
          ))}
        </Stagger>

        <Reveal delay={0.15} className="mt-14 text-center">
          <p className="font-display text-2xl italic text-foreground sm:text-3xl">
            The map is written in{" "}
            <span className="gold-text">shipped products</span> — not pitch
            decks.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
