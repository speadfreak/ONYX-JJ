"use client";

import { Fragment } from "react";
import { CountUp } from "@/components/motion/count-up";
import { Stagger, StaggerItem } from "@/components/motion/reveal";

export interface StatItem {
  to: number;
  suffix?: string;
  label: string;
}

/** Renders a label, gilding any "×" (e.g. "Disciplines — Dev × Trading"). */
function GildedLabel({ text }: { text: string }) {
  const parts = text.split("×");
  if (parts.length === 1) return <>{text}</>;
  return (
    <>
      {parts.map((part, i) => (
        <Fragment key={i}>
          {part}
          {i < parts.length - 1 && <span className="text-gold">×</span>}
        </Fragment>
      ))}
    </>
  );
}

/** Confidence strip under the hero: admin-editable counting numbers on obsidian. */
export function StatsStrip({ stats }: { stats: StatItem[] }) {
  if (!stats.length) return null;
  return (
    <section
      aria-label="Highlights"
      className="relative border-y border-white/5 bg-onyx-900/40"
    >
      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
        <Stagger stagger={0.15} className="grid grid-cols-1 gap-10 text-center sm:grid-cols-3">
          {stats.map((stat, i) => (
            <StaggerItem key={i}>
              <p className="font-display text-5xl font-semibold sm:text-6xl">
                <CountUp
                  to={stat.to}
                  suffix={stat.suffix}
                  className="gold-text"
                />
              </p>
              <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                <GildedLabel text={stat.label} />
              </p>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
