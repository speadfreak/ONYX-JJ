"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Download,
  GraduationCap,
  Languages,
  LineChart as LineChartIcon,
  Rocket,
  Sparkles,
  Wrench,
} from "lucide-react";
import { GoldDivider } from "@/components/motion/gold-divider";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { SectionHeading } from "@/components/motion/section-heading";
import { TextilePattern } from "@/components/effects/textile-pattern";
import { usePrefersReducedMotion } from "@/lib/hooks";

const EASE = [0.22, 1, 0.36, 1] as const;

const TIMELINE = [
  {
    year: "2006 —",
    title: "Born into two worlds",
    body: "Ethiopian highland discipline on one side, Nigerian audacity on the other. Raised between Addis Ababa and everywhere the family trade went.",
    icon: Sparkles,
  },
  {
    year: "2019 — 2022",
    title: "Self-taught developer",
    body: "Picked up web development the honest way: broke things, read the errors, fixed them. Moved from static pages to real-time systems before finishing school.",
    icon: Wrench,
  },
  {
    year: "2022 —",
    title: "Forex trader & streamer",
    body: "Learned the markets by losing small and journaling everything. Now trades with prop-firm discipline and streams the London open — research desk on screen, process visible.",
    icon: LineChartIcon,
  },
  {
    year: "2023 — 2024",
    title: "Founder — real-time systems",
    body: "Shipped TG's Restaurant ERP (7 portals, Socket.IO, live kitchen ops in Dubai) and ATTENDX⚡ (AI attendance protecting students in Addis schools).",
    icon: Rocket,
  },
  {
    year: "2024 — 2025",
    title: "IT startup — from Addis Ababa outward",
    body: "Founded the studio behind Learnyx Academy (AI-powered EHEEE prep) and JJ NEXUS PRO (trading + broadcast command center). Building toward a pan-African platform company.",
    icon: GraduationCap,
  },
];

const SKILL_GROUPS: { label: string; items: string[] }[] = [
  { label: "Engineering", items: ["TypeScript", "React + Next.js", "Node + Express", "PostgreSQL / Supabase", "Convex", "Socket.IO", "Tailwind CSS"] },
  { label: "AI & Data", items: ["Groq LLM pipelines", "Face recognition", "Realtime analytics", "R2 / file storage"] },
  { label: "Trading", items: ["Market structure", "COT positioning", "Risk management", "Prop-firm discipline"] },
  { label: "Founder", items: ["0→1 shipping", "Client ops", "Live streaming", "Community building"] },
];

const LANGUAGES = ["English — fluent", "Amharic — native", "Pidgin — conversational"];

export function ResumeTimeline() {
  const reduce = usePrefersReducedMotion();

  return (
    <div className="relative pb-24 sm:pb-32">
      <TextilePattern mask className="opacity-15" />

      {/* ── Profile strip ── */}
      <section className="relative mx-auto max-w-4xl px-5 sm:px-8">
        <Reveal>
          <div className="flex flex-col items-center gap-6 rounded-2xl border border-white/8 bg-onyx-900/40 p-7 backdrop-blur sm:flex-row sm:gap-8 sm:p-8">
            <div className="glow-gold-sm relative h-24 w-24 shrink-0 overflow-hidden rounded-full border border-gold/40">
              {/* PROFILE PHOTO — replace from /admin/settings → Asset manager */}
              <Image src="/images/jj-profile.jpg" alt="Portrait of Joseph James" fill sizes="96px" className="object-cover object-top" />
            </div>
            <div className="text-center sm:text-left">
              <p className="font-display text-2xl font-semibold">Joseph James — &ldquo;JJ&rdquo;</p>
              <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.25em] text-gold">
                Fullstack Developer · Forex Trader · Founder
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                18 years old · Addis Ababa, Ethiopia · Dubai operations · open to
                select engineering collaborations and prop-firm track records.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2.5 sm:justify-start">
                <a
                  href="/resume/joseph-james-resume.pdf"
                  download
                  data-cursor="hover"
                  className="inline-flex h-11 items-center gap-2.5 rounded-md bg-gold px-6 text-sm font-semibold text-onyx-950 transition-all duration-300 hover:bg-gold-light hover:shadow-[0_0_36px_-8px_rgba(212,168,87,0.6)]"
                >
                  <Download className="h-4 w-4" aria-hidden /> Download PDF
                </a>
                <Link
                  href="/contact"
                  data-cursor="hover"
                  className="inline-flex h-11 items-center gap-2.5 rounded-md border border-white/15 px-6 text-sm font-semibold text-foreground transition-colors duration-300 hover:border-gold/60 hover:text-gold"
                >
                  Contact <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── Timeline ── */}
      <section aria-label="Timeline" className="relative mx-auto mt-20 max-w-4xl px-5 sm:px-8">
        <SectionHeading
          kicker="Timeline"
          title={
            <>
              Where it&rsquo;s <span className="gold-text">been.</span>
            </>
          }
        />

        <div className="relative mt-12">
          {/* the gold spine — draws downward on scroll */}
          <div aria-hidden className="absolute left-[1.15rem] top-2 h-full w-px bg-white/8 sm:left-[1.4rem]" />
          {!reduce && (
            <motion.div
              aria-hidden
              className="absolute left-[1.15rem] top-2 w-px bg-gradient-to-b from-gold via-gold/60 to-transparent shadow-[0_0_8px_rgba(212,168,87,0.5)] sm:left-[1.4rem]"
              initial={{ height: 0 }}
              whileInView={{ height: "100%" }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 1.8, ease: EASE }}
            />
          )}

          <Stagger stagger={0.12} className="space-y-9">
            {TIMELINE.map((item) => (
              <StaggerItem key={item.title}>
                <div className="relative flex gap-6 pl-1 sm:gap-8">
                  <span
                    aria-hidden
                    className="relative z-10 mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-onyx-950 shadow-[0_0_18px_-4px_rgba(212,168,87,0.5)]"
                  >
                    <item.icon className="h-4 w-4 text-gold" aria-hidden />
                  </span>
                  <div className="min-w-0 pb-1">
                    <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-gold/80">{item.year}</p>
                    <h3 className="mt-1.5 font-display text-xl font-semibold tracking-tight sm:text-2xl">{item.title}</h3>
                    <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-[15px]">{item.body}</p>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ── Skills ── */}
      <section aria-label="Skills" className="relative mx-auto mt-20 max-w-4xl px-5 sm:px-8">
        <GoldDivider className="mb-14" />
        <SectionHeading
          kicker="Capabilities"
          title={
            <>
              What I <span className="gold-text">bring.</span>
            </>
          }
        />
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {SKILL_GROUPS.map((group, gi) => (
            <Reveal key={group.label} delay={gi * 0.06}>
              <div className="h-full rounded-xl border border-white/8 bg-onyx-900/40 p-5 transition-colors duration-300 hover:border-gold/30">
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-gold/80">{group.label}</p>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {group.items.map((item) => (
                    <li
                      key={item}
                      className="rounded-full border border-white/10 bg-onyx-850 px-3.5 py-1.5 font-mono text-[10px] tracking-[0.12em] text-foreground/80"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-6">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-white/8 bg-onyx-900/40 p-5">
            <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] text-gold/80">
              <Languages className="h-4 w-4" aria-hidden /> Languages
            </p>
            {LANGUAGES.map((l) => (
              <span key={l} className="text-sm text-muted-foreground">{l}</span>
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.08} className="mt-12 text-center">
          <a
            href="/resume/joseph-james-resume.pdf"
            download
            data-cursor="hover"
            className="group inline-flex items-center gap-3 rounded-full border border-gold/40 bg-gold/5 px-8 py-4 font-mono text-[11px] uppercase tracking-[0.3em] text-gold transition-all duration-300 hover:border-gold hover:bg-gold/10 hover:shadow-[0_0_24px_-6px_rgba(212,168,87,0.35)]"
          >
            <Download className="h-4 w-4" aria-hidden /> Download the PDF version
          </a>
        </Reveal>
      </section>
    </div>
  );
}
