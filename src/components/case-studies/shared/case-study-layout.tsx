"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { GradientMesh } from "@/components/effects/gradient-mesh";
import { TextilePattern } from "@/components/effects/textile-pattern";
import { GoldDivider } from "@/components/motion/gold-divider";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import type { Project } from "@/lib/data/projects";
import { getNextProject } from "@/lib/data/projects";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

const ACCENT: Record<Project["accent"], { text: string; glow: string; line: string }> = {
  gold: { text: "text-gold", glow: "rgba(212,168,87,0.35)", line: "via-gold/30" },
  mint: { text: "text-mint", glow: "rgba(0,229,160,0.3)", line: "via-mint/30" },
  ice: { text: "text-ice", glow: "rgba(34,211,238,0.3)", line: "via-ice/30" },
};

/**
 * Shared case-study chrome: cinematic hero (kicker / huge title / tags /
 * stat bar) + "Next project" footer. Sections are passed as children.
 */
export function CaseStudyLayout({
  project,
  kicker = "Case Study",
  children,
}: {
  project: Project;
  kicker?: string;
  children: React.ReactNode;
}) {
  const a = ACCENT[project.accent];
  return (
    <main className="relative">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <header className="relative overflow-hidden pb-14 pt-36 sm:pt-44">
        <GradientMesh variant={project.accent === "mint" ? "gold-mint" : "gold"} />
        <TextilePattern className="opacity-25 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent to-transparent",
            a.line
          )}
        />
        <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
          <Stagger stagger={0.12}>
            <StaggerItem>
              <p className="font-mono text-[11px] uppercase tracking-[0.42em] text-gold sm:text-xs">
                {kicker} — {project.year}
              </p>
            </StaggerItem>
            <StaggerItem>
              <h1 className="mt-6 font-display text-[clamp(2.6rem,7.5vw,5.75rem)] font-semibold leading-[0.98] tracking-tight">
                {project.title}
                {project.amharic ? (
                  <span className="mt-4 block font-ethiopic text-[clamp(1.1rem,3vw,1.8rem)] font-normal text-muted-foreground">
                    {project.amharic}
                  </span>
                ) : null}
              </h1>
            </StaggerItem>
            <StaggerItem>
              <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                {project.hook}
              </p>
            </StaggerItem>
            <StaggerItem>
              <div className="mt-7 flex flex-wrap items-center gap-2.5">
                {project.tags.map((t) => (
                  <Badge
                    key={t}
                    variant="outline"
                    className="border-gold/30 bg-gold/5 font-mono text-[10px] uppercase tracking-[0.22em] text-gold-light"
                  >
                    {t}
                  </Badge>
                ))}
                <Badge
                  variant="outline"
                  className="border-white/10 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground"
                >
                  {project.role}
                </Badge>
              </div>
            </StaggerItem>
          </Stagger>

          {/* stat bar */}
          <Reveal delay={0.25} className="mt-12">
            <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-white/8 bg-white/5 sm:grid-cols-3">
              {project.stats.map((s) => (
                <div key={s.label} className="bg-onyx-900/90 px-6 py-5 backdrop-blur-sm">
                  <dt className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
                    {s.label}
                  </dt>
                  <dd className={cn("mt-1.5 font-display text-3xl font-semibold", a.text)}>
                    {s.value}
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </header>

      {/* ── Body sections ────────────────────────────────────── */}
      <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
        {children}
      </div>

      <NextProject project={project} />
    </main>
  );
}

/** Numbered section chrome — “01 / THE PROBLEM” style headings. */
export function CaseSection({
  index,
  title,
  className,
  style,
  children,
}: {
  index: string;
  title: string;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("py-14 sm:py-20", className)} style={style}>
      <Reveal>
        <div className="flex items-baseline gap-4">
          <span className="font-mono text-xs tracking-[0.3em] text-gold/80">{index}</span>
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            {title}
          </h2>
        </div>
        <div className="mt-4 h-px w-full bg-gradient-to-r from-gold/40 via-white/8 to-transparent" />
      </Reveal>
      <div className="mt-8">{children}</div>
    </section>
  );
}

/** Horizontal strip of key stats (used inside case-study bodies). */
export function StatBar({
  stats,
  accent = "gold",
  className,
}: {
  stats: { value: string; label: string }[];
  accent?: Project["accent"];
  className?: string;
}) {
  const a = ACCENT[accent];
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-white/8 bg-white/5 sm:grid-cols-4",
        className
      )}
    >
      {stats.map((s) => (
        <div key={s.label} className="bg-onyx-900/90 px-5 py-4">
          <p className={cn("font-display text-2xl font-semibold", a.text)}>{s.value}</p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            {s.label}
          </p>
        </div>
      ))}
    </div>
  );
}

function NextProject({ project }: { project: Project }) {
  const next = getNextProject(project.slug);

  return (
    <section className="relative py-20 sm:py-28">
      <GoldDivider className="mb-16" />
      <Reveal>
        <Link
          href={`/work/${next.slug}`}
          className="group mx-auto flex max-w-4xl flex-col items-center gap-6 text-center"
          data-cursor="hover"
        >
          <p className="font-mono text-[11px] uppercase tracking-[0.4em] text-muted-foreground">
            Next case study
          </p>
          <div className="relative aspect-[21/9] w-full overflow-hidden rounded-xl border border-white/8">
            <Image
              src={next.image}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 896px"
              className="object-cover opacity-70 transition-all duration-700 group-hover:scale-[1.04] group-hover:opacity-100"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-onyx-950/90 via-onyx-950/20 to-transparent" />
            <div className="absolute inset-0 flex items-center justify-center gap-3">
              <span className="font-display text-3xl font-semibold tracking-tight transition-colors duration-300 group-hover:text-gold sm:text-5xl">
                {next.title}
              </span>
              <ArrowUpRight className="h-7 w-7 text-gold opacity-0 transition-all duration-500 group-hover:translate-x-1 group-hover:opacity-100" />
            </div>
          </div>
          <motion.span
            className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.3em] text-gold"
            initial={{ opacity: 0.8 }}
            animate={{ opacity: 1 }}
          >
            Continue the tour <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1.5" />
          </motion.span>
        </Link>
      </Reveal>
      <Separator className="mt-16 bg-white/5" />
    </section>
  );
}
