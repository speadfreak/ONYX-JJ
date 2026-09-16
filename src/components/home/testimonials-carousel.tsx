"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, Quote } from "lucide-react";
import { SectionHeading } from "@/components/motion/section-heading";
import { TextilePattern } from "@/components/effects/textile-pattern";
import type { TestimonialData } from "@/lib/content";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;
const ROTATE_MS = 6500;

/**
 * Auto-rotating testimonials carousel (crossfade transitions) with manual
 * arrow + dot controls. Content comes from /admin/testimonials.
 */
export function TestimonialsCarousel({ testimonials }: { testimonials: TestimonialData[] }) {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const pausedRef = useRef(false);
  const count = testimonials.length;

  const go = useCallback(
    (next: number) => {
      if (count < 2) return;
      setDir(next > index || (index === count - 1 && next === 0) ? 1 : -1);
      setIndex(((next % count) + count) % count);
    },
    [count, index]
  );

  useEffect(() => {
    if (count < 2 || reduce) return;
    const id = setInterval(() => {
      if (!pausedRef.current) {
        setDir(1);
        setIndex((i) => (i + 1) % count);
      }
    }, ROTATE_MS);
    return () => clearInterval(id);
  }, [count, reduce]);

  if (!count) return null;
  const t = testimonials[index]!;

  return (
    <section
      aria-label="Testimonials"
      aria-roledescription="carousel"
      className="relative border-t border-white/5 py-24 sm:py-28"
      onMouseEnter={() => (pausedRef.current = true)}
      onMouseLeave={() => (pausedRef.current = false)}
    >
      <TextilePattern mask className="opacity-15!" />

      <div className="relative mx-auto max-w-5xl px-5 sm:px-8">
        <SectionHeading
          align="center"
          kicker="SIGNAL"
          title={
            <>
              Word from the <span className="gold-text">field.</span>
            </>
          }
        />

        <div className="relative mt-12 min-h-[17rem] sm:min-h-[13.5rem]" aria-live="polite">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.figure
              key={t.id}
              custom={dir}
              initial={{ opacity: 0, x: dir * 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: dir * -60 }}
              transition={{ duration: 0.55, ease: EASE }}
              className="mx-auto flex max-w-3xl flex-col items-center text-center"
            >
              <Quote className="h-8 w-8 rotate-180 text-gold/50" aria-hidden />
              <blockquote className="mt-6 font-display text-[clamp(1.3rem,3.2vw,1.9rem)] font-medium italic leading-snug text-foreground/95">
                “{t.quote}”
              </blockquote>
              <figcaption className="mt-7 flex items-center gap-3.5">
                {t.photo ? (
                  <span className="relative block h-11 w-11 overflow-hidden rounded-full border border-gold/30">
                    <Image src={t.photo} alt="" fill sizes="44px" className="object-cover" />
                  </span>
                ) : (
                  <span
                    aria-hidden
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/30 bg-gold/10 font-display text-base font-semibold text-gold"
                  >
                    {t.name.charAt(0)}
                  </span>
                )}
                <span className="text-left">
                  <span className="block text-sm font-semibold text-foreground">{t.name}</span>
                  <span className="block font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                    {t.role}
                  </span>
                </span>
              </figcaption>
            </motion.figure>
          </AnimatePresence>
        </div>

        {/* Controls */}
        {count > 1 && (
          <div className="mt-8 flex items-center justify-center gap-5">
            <button
              onClick={() => go(index - 1)}
              aria-label="Previous testimonial"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 text-muted-foreground transition-all duration-300 hover:border-gold/50 hover:text-gold hover:shadow-[0_0_18px_-4px_rgba(212,168,87,0.5)]"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2.5" role="tablist" aria-label="Choose testimonial">
              {testimonials.map((item, i) => (
                <button
                  key={item.id}
                  role="tab"
                  aria-selected={i === index}
                  aria-label={`Testimonial ${i + 1} — ${item.name}`}
                  onClick={() => go(i)}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-400",
                    i === index ? "w-7 bg-gold shadow-[0_0_10px_rgba(212,168,87,0.7)]" : "w-1.5 bg-white/20 hover:bg-white/40"
                  )}
                />
              ))}
            </div>
            <button
              onClick={() => go(index + 1)}
              aria-label="Next testimonial"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 text-muted-foreground transition-all duration-300 hover:border-gold/50 hover:text-gold hover:shadow-[0_0_18px_-4px_rgba(212,168,87,0.5)]"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
