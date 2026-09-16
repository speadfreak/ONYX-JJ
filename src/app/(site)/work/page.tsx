import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Download } from "lucide-react";
import { GoldDivider } from "@/components/motion/gold-divider";
import { PageHero } from "@/components/motion/page-hero";
import { Reveal } from "@/components/motion/reveal";
import { WorkGrid } from "@/components/work/work-grid";
import { getProjects } from "@/lib/content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Selected Work",
  description:
    "Four production systems — a real-time restaurant ERP, an AI attendance platform, a trading broadcast suite, and an AI exam-prep academy.",
};

export default async function WorkPage() {
  const projects = await getProjects();

  return (
    <main className="relative">
      {/* Portfolio deck download */}
      <div className="relative z-10 mx-auto flex max-w-6xl justify-center px-5 pt-28 sm:px-8 sm:pt-32">
        <a
          href="/portfolio/joseph-james-portfolio.pdf"
          download
          data-cursor="hover"
          className="inline-flex items-center gap-2.5 rounded-full border border-gold/40 bg-gold/5 px-6 py-3 font-mono text-[10px] uppercase tracking-[0.3em] text-gold transition-all duration-300 hover:border-gold hover:bg-gold/10 hover:shadow-[0_0_24px_-6px_rgba(212,168,87,0.35)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold/70"
        >
          <Download className="h-4 w-4" aria-hidden />
          Download portfolio deck
        </a>
      </div>

      <PageHero
        kicker="SELECTED WORK"
        title={
          <>
            Systems, <span className="gold-text">not screenshots.</span>
          </>
        }
        description="Four production builds across four different worlds — a restaurant running on real-time, a school protected by AI, a trading desk broadcasting live, and a nation of students preparing smarter. Every one shipped, every one real."
      />

      <WorkGrid projects={projects} />

      {/* Closing CTA */}
      <section aria-label="Call to action" className="relative pb-24 pt-16 sm:pb-32 sm:pt-20">
        <GoldDivider />
        <Reveal className="mx-auto mt-14 flex max-w-2xl flex-col items-center gap-7 px-5 text-center sm:px-8">
          <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
            Want the technical deep-dives? Every case study is one click away.
          </p>
          <Link
            href="/contact"
            className="group inline-flex items-center gap-3 rounded-full border border-gold/40 bg-gold/5 px-8 py-4 font-mono text-[11px] uppercase tracking-[0.3em] text-gold transition-all duration-300 hover:border-gold hover:bg-gold/10 hover:shadow-[0_0_24px_-6px_rgba(212,168,87,0.35)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold/70"
          >
            Start a conversation
            <ArrowRight
              className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1.5"
              aria-hidden
            />
          </Link>
        </Reveal>
      </section>
    </main>
  );
}
