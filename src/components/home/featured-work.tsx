"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { TextilePattern } from "@/components/effects/textile-pattern";
import { Reveal } from "@/components/motion/reveal";
import { SectionHeading } from "@/components/motion/section-heading";
import { ProjectCard } from "@/components/work/project-card";
import type { Project } from "@/lib/data/projects";

/** Tiny markup: *spans* render in gold-text (admin-editable headings). */
export function gild(text: string) {
  return text.split(/\*(.+?)\*/g).map((part, i) =>
    i % 2 === 1 ? (
      <span key={i} className="gold-text">
        {part}
      </span>
    ) : (
      part
    )
  );
}

/** Home featured-work grid — pulls published projects from the database. */
export function FeaturedWork({
  projects,
  heading,
  subheading,
}: {
  projects: Project[];
  heading: string;
  subheading: string;
}) {
  if (!projects.length) return null;
  return (
    <section className="relative py-24 sm:py-32">
      <TextilePattern className="opacity-20!" mask />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          kicker="SELECTED WORK"
          title={<>{gild(heading)}</>}
          description={subheading}
        />

        <div className="mt-14 grid gap-8 sm:gap-10 md:grid-cols-2">
          {projects.slice(0, 4).map((project, i) => (
            <ProjectCard key={project.slug} project={project} index={i} priority={i < 2} />
          ))}
        </div>

        <Reveal delay={0.1} className="mt-14 flex justify-center">
          <Link
            href="/work"
            data-cursor="hover"
            className="group inline-flex items-center gap-3 font-mono text-xs uppercase tracking-[0.35em] text-muted-foreground transition-colors duration-300 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-onyx-950"
          >
            <span className="relative">
              View all case studies
              <span
                aria-hidden
                className="absolute -bottom-1.5 left-0 h-px w-full origin-left scale-x-0 bg-gold transition-transform duration-500 group-hover:scale-x-100"
              />
            </span>
            <ArrowRight className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-1.5" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
