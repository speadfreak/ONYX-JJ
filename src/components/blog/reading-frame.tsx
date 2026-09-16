"use client";

import { motion, useScroll, useSpring } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Clock } from "lucide-react";
import { Prose } from "@/components/content/prose";
import { GoldDivider } from "@/components/motion/gold-divider";
import { Reveal } from "@/components/motion/reveal";
import { usePrefersReducedMotion } from "@/lib/hooks";

/**
 * Cinematic reading frame: scroll-progress bar pinned to the top, huge
 * display title, and scroll-triggered (subtle) paragraph reveals while
 * reading. Markdown rendered XSS-safe via react-markdown.
 */
export function ReadingFrame({
  category,
  title,
  date,
  minutes,
  content,
  children,
}: {
  category: string;
  title: string;
  date: string | null;
  minutes: number;
  content: string;
  children?: React.ReactNode;
}) {
  const reduce = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.4 });

  const CATEGORY_TONE: Record<string, string> = {
    "Dev Log": "border-gold/40 bg-gold/10 text-gold",
    "Trading Insight": "border-mint/40 bg-mint/10 text-mint",
    "Startup Notes": "border-ice/40 bg-ice/10 text-ice",
  };

  return (
    <main className="relative">
      {/* scroll progress indicator */}
      <motion.div
        aria-hidden
        className="fixed inset-x-0 top-0 z-[80] h-[3px] origin-left bg-gradient-to-r from-gold to-gold-light shadow-[0_0_12px_rgba(212,168,87,0.7)]"
        style={{ scaleX: progress }}
      />

      <article className="relative pb-24 pt-36 sm:pt-44">
        {/* soft top glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[30rem] bg-[radial-gradient(55%_60%_at_50%_0%,rgba(212,168,87,0.08),transparent_70%)]"
        />

        <div className="relative mx-auto max-w-3xl px-5 sm:px-8">
          <Reveal>
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground transition-colors hover:text-gold"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Journal
            </Link>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <span
                className={`rounded-full border px-3.5 py-1 font-mono text-[10px] uppercase tracking-[0.24em] ${
                  CATEGORY_TONE[category] ?? "border-white/15 text-gold-light"
                }`}
              >
                {category}
              </span>
              {(date || minutes) && (
                <span className="inline-flex items-center gap-4 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  {date && <span>{date}</span>}
                  {minutes > 0 && (
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-3 w-3" aria-hidden /> {minutes} min read
                    </span>
                  )}
                </span>
              )}
            </div>
          </Reveal>

          <Reveal delay={0.14}>
            <h1 className="mt-6 font-display text-[clamp(2.2rem,5.6vw,3.9rem)] font-semibold leading-[1.04] tracking-tight">
              {title}
            </h1>
          </Reveal>

          {children}

          {/* body — per-paragraph scroll reveal (subtle) */}
          <div className="mt-12">
            <Prose
              content={content}
              components={
                reduce
                  ? undefined
                  : {
                      p: ({ children }) => (
                        <motion.p
                          initial={{ opacity: 0, y: 18 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true, margin: "-60px" }}
                          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                        >
                          {children}
                        </motion.p>
                      ),
                      blockquote: ({ children }) => (
                        <motion.blockquote
                          initial={{ opacity: 0, x: -22 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true, margin: "-70px" }}
                          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                        >
                          {children}
                        </motion.blockquote>
                      ),
                      h2: ({ children }) => (
                        <motion.h2
                          initial={{ opacity: 0, y: 14 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true, margin: "-60px" }}
                          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                        >
                          {children}
                        </motion.h2>
                      ),
                    }
              }
            />
          </div>

          <GoldDivider className="mt-16" />

          <Reveal className="mt-10 flex flex-col items-center gap-5 text-center">
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
              Written from the desk — half code editor, half market chart. If this sparked something, say hello.
            </p>
            <Link
              href="/contact"
              data-cursor="hover"
              className="group inline-flex items-center gap-3 rounded-full border border-gold/40 bg-gold/5 px-8 py-4 font-mono text-[11px] uppercase tracking-[0.3em] text-gold transition-all duration-300 hover:border-gold hover:bg-gold/10 hover:shadow-[0_0_24px_-6px_rgba(212,168,87,0.35)]"
            >
              Start a conversation
            </Link>
          </Reveal>
        </div>
      </article>
    </main>
  );
}
