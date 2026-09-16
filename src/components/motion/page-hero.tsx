"use client";

import { GradientMesh } from "@/components/effects/gradient-mesh";
import { TextilePattern } from "@/components/effects/textile-pattern";
import { Stagger, StaggerItem } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";

/**
 * Cinematic inner-page hero: generous top space under the fixed header,
 * animated gradient mesh + faint textile linework, staggered entrance.
 */
export function PageHero({
  kicker,
  title,
  description,
  children,
  className,
}: {
  kicker: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("relative overflow-hidden pb-16 pt-36 sm:pb-20 sm:pt-44", className)}>
      <GradientMesh variant="gold-mint" />
      <TextilePattern mask className="opacity-30 [mask-image:radial-gradient(ellipse_at_top,black,transparent_72%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gold/25 to-transparent" />
      <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
        <Stagger stagger={0.12}>
          <StaggerItem>
            <p className="font-mono text-[11px] uppercase tracking-[0.42em] text-gold sm:text-xs">
              {kicker}
            </p>
          </StaggerItem>
          <StaggerItem>
            <h1 className="mt-6 font-display text-[clamp(2.75rem,8vw,6rem)] font-semibold leading-[0.98] tracking-tight">
              {title}
            </h1>
          </StaggerItem>
          {description ? (
            <StaggerItem>
              <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                {description}
              </p>
            </StaggerItem>
          ) : null}
        </Stagger>
        {children}
      </div>
    </header>
  );
}
