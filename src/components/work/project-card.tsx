"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Project } from "@/lib/data/projects";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

const ACCENT_TEXT: Record<Project["accent"], string> = {
  gold: "text-gold",
  mint: "text-mint",
  ice: "text-ice",
};

/**
 * Signature project card — clip-path reveal-mask on the cover image,
 * image shift + gold glow + arrow motion on hover.
 */
export function ProjectCard({
  project,
  index = 0,
  priority = false,
}: {
  project: Project;
  index?: number;
  priority?: boolean;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay: (index % 2) * 0.08, ease: EASE }}
    >
      <Link
        href={`/work/${project.slug}`}
        aria-label={`Open case study: ${project.title}`}
        className="group block"
        data-cursor="hover"
      >
        {/* Cover — reveal-masked image */}
        <div className="relative overflow-hidden rounded-xl border border-white/8 bg-onyx-900 transition-[box-shadow,border-color] duration-500 group-hover:border-gold/40 group-hover:shadow-[0_0_60px_-12px_rgba(212,168,87,0.3)]">
          <motion.div
            className="relative aspect-[16/10]"
            initial={{ clipPath: "inset(0 100% 0 0)" }}
            whileInView={{ clipPath: "inset(0 0% 0 0)" }}
            viewport={{ once: true, margin: "-70px" }}
            transition={{ duration: 1.05, ease: EASE }}
          >
            {/* PLACEHOLDER: swap /images/project-*.jpg covers with real screenshots */}
            <Image
              src={project.image}
              alt={`${project.title} — key visual`}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.06]"
              priority={priority}
            />
          </motion.div>
          {/* legibility + mood overlays */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-onyx-950/85 via-onyx-950/10 to-transparent" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-gold/0 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:from-gold/10 group-hover:opacity-100" />
          {/* tags */}
          <div className="absolute left-4 top-4 flex flex-wrap gap-2">
            {project.tags.map((t) => (
              <Badge
                key={t}
                variant="outline"
                className="border-white/15 bg-onyx-950/60 font-mono text-[10px] uppercase tracking-[0.2em] text-gold-light backdrop-blur-sm"
              >
                {t}
              </Badge>
            ))}
          </div>
          {/* arrow */}
          <div
            className={cn(
              "absolute bottom-4 right-4 flex h-11 w-11 items-center justify-center rounded-full border border-gold/40 bg-onyx-950/70 backdrop-blur-sm transition-all duration-500",
              "translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100"
            )}
          >
            <ArrowUpRight className="h-5 w-5 text-gold transition-transform duration-500 group-hover:rotate-45" />
          </div>
        </div>

        {/* Meta */}
        <div className="mt-5 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="font-display text-2xl font-semibold tracking-tight transition-colors duration-300 group-hover:text-gold sm:text-[1.7rem]">
              {project.title}
              {project.amharic ? (
                <span className="ml-3 font-ethiopic text-base font-normal text-muted-foreground">
                  {project.amharic}
                </span>
              ) : null}
            </h3>
            <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
              {project.hook}
            </p>
          </div>
        </div>
        {/* stat callouts */}
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 border-t border-white/5 pt-4">
          {project.stats.map((s) => (
            <p key={s.label} className="font-mono text-[11px] tracking-wider text-muted-foreground">
              <span className={cn("font-semibold", ACCENT_TEXT[project.accent])}>{s.value}</span>
              <span className="ml-2 uppercase">{s.label}</span>
            </p>
          ))}
        </div>
      </Link>
    </motion.article>
  );
}
