"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Reveal } from "@/components/motion/reveal";
import { ProjectCard } from "@/components/work/project-card";
import type { Project, ProjectTag } from "@/lib/data/projects";
import { cn } from "@/lib/utils";

const FILTERS = ["All", "Fullstack", "AI", "Real-Time", "Trading"] as const;
type Filter = (typeof FILTERS)[number];

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Filterable work index — mono filter pills + a layout-animated grid of
 * ProjectCards (popLayout so exiting cards don't hold their grid slots).
 * Projects come from the database via the parent server component.
 */
export function WorkGrid({ projects }: { projects: Project[] }) {
  const [activeFilter, setActiveFilter] = useState<Filter>("All");

  const filtered = useMemo<Project[]>(
    () =>
      activeFilter === "All"
        ? projects
        : projects.filter((p) => p.tags.includes(activeFilter as ProjectTag)),
    [activeFilter, projects]
  );

  return (
    <section aria-label="Selected projects" className="relative mx-auto max-w-6xl px-5 sm:px-8">
      {/* Filter tabs */}
      <Reveal>
        <div
          role="group"
          aria-label="Filter projects by discipline"
          className="flex flex-wrap items-center gap-2.5"
        >
          {FILTERS.map((f) => {
            const active = f === activeFilter;
            return (
              <button
                key={f}
                type="button"
                aria-pressed={active}
                onClick={() => setActiveFilter(f)}
                className={cn(
                  "rounded-full border px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.25em] transition-all duration-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold/70",
                  active
                    ? "border-gold bg-gold/10 text-gold glow-gold-sm"
                    : "border-white/10 text-muted-foreground hover:border-white/25 hover:text-foreground"
                )}
              >
                {f}
              </button>
            );
          })}
        </div>
        <p className="mt-6 font-mono text-xs text-muted-foreground" aria-live="polite">
          {filtered.length} system{filtered.length === 1 ? "" : "s"} — {activeFilter}
        </p>
      </Reveal>

      {/* Grid */}
      <div className="mt-12 grid gap-8 sm:gap-10 md:grid-cols-2">
        <AnimatePresence mode="popLayout">
          {filtered.map((p, i) => (
            <motion.div
              key={p.slug}
              layout
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.4, ease: EASE }}
            >
              <ProjectCard project={p} index={i} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}
