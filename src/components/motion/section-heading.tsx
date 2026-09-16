"use client";

import { Stagger, StaggerItem } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";

/** Consistent section heading: mono gold kicker → huge display title → description. */
export function SectionHeading({
  kicker,
  title,
  description,
  align = "left",
  className,
}: {
  kicker: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <Stagger
      className={cn("max-w-3xl", align === "center" && "mx-auto text-center", className)}
      stagger={0.11}
    >
      <StaggerItem>
        <p className="font-mono text-[11px] uppercase tracking-[0.4em] text-gold sm:text-xs">
          {kicker}
        </p>
      </StaggerItem>
      <StaggerItem>
        <h2 className="mt-4 font-display text-4xl font-semibold leading-[1.04] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          {title}
        </h2>
      </StaggerItem>
      {description ? (
        <StaggerItem>
          <p
            className={cn(
              "mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg",
              align === "center" && "mx-auto"
            )}
          >
            {description}
          </p>
        </StaggerItem>
      ) : null}
    </Stagger>
  );
}
