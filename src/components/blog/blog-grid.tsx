"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Clock } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { TextilePattern } from "@/components/effects/textile-pattern";
import type { PostListItem } from "@/lib/content";
import { cn } from "@/lib/utils";

const CATEGORIES = ["All", "Dev Log", "Trading Insight", "Startup Notes"] as const;
type Category = (typeof CATEGORIES)[number];

const EASE = [0.22, 1, 0.36, 1] as const;

const CATEGORY_TONE: Record<string, string> = {
  "Dev Log": "border-gold/40 bg-gold/10 text-gold",
  "Trading Insight": "border-mint/40 bg-mint/10 text-mint",
  "Startup Notes": "border-ice/40 bg-ice/10 text-ice",
};

function fmtDate(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/** Cinematic journal index — filterable large post cards with hover-reveal. */
export function BlogGrid({ posts }: { posts: PostListItem[] }) {
  const [cat, setCat] = useState<Category>("All");

  const filtered = useMemo(
    () => (cat === "All" ? posts : posts.filter((p) => p.category === cat)),
    [cat, posts]
  );

  return (
    <section className="relative pb-24 pt-6 sm:pb-32" aria-label="Journal posts">
      <TextilePattern mask className="opacity-15" />

      <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal>
          <div role="group" aria-label="Filter posts by category" className="flex flex-wrap items-center gap-2.5">
            {CATEGORIES.map((c) => {
              const active = c === cat;
              return (
                <button
                  key={c}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setCat(c)}
                  className={cn(
                    "rounded-full border px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.25em] transition-all duration-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold/70",
                    active
                      ? "border-gold bg-gold/10 text-gold glow-gold-sm"
                      : "border-white/10 text-muted-foreground hover:border-white/25 hover:text-foreground"
                  )}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </Reveal>

        <div className="mt-12 grid gap-8 md:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {filtered.map((post, i) => (
              <motion.article
                key={post.id}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.4, ease: EASE }}
                className={cn(i === 0 && filtered.length > 2 && "md:col-span-2")}
              >
                <Link
                  href={`/blog/${post.slug}`}
                  aria-label={`Read: ${post.title}`}
                  className="group block"
                  data-cursor="hover"
                >
                  {/* Cover — reveal-masked image (first card spans both columns) */}
                  <div className="relative overflow-hidden rounded-xl border border-white/8 bg-onyx-900 transition-[box-shadow,border-color] duration-500 group-hover:border-gold/40 group-hover:shadow-[0_0_60px_-12px_rgba(212,168,87,0.3)]">
                    <motion.div
                      className={cn("relative", i === 0 && filtered.length > 2 ? "aspect-[21/9]" : "aspect-[16/9]")}
                      initial={{ clipPath: "inset(0 100% 0 0)" }}
                      whileInView={{ clipPath: "inset(0 0% 0 0)" }}
                      viewport={{ once: true, margin: "-70px" }}
                      transition={{ duration: 1.0, ease: EASE }}
                    >
                      <Image
                        src={post.coverImage || "/images/hero-bg.jpg"}
                        alt=""
                        fill
                        priority={i < 2}
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover opacity-80 transition-all duration-[900ms] ease-out group-hover:scale-[1.05] group-hover:opacity-100"
                      />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-onyx-950/85 via-onyx-950/15 to-transparent" />
                      {/* hover-reveal strip */}
                      <div className="absolute inset-x-0 bottom-0 translate-y-3 p-6 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                        <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] text-gold">
                          Read the entry <ArrowUpRight className="h-3.5 w-3.5" />
                        </p>
                      </div>
                    </motion.div>

                    <div className="absolute left-5 top-5 flex flex-wrap gap-2">
                      <span
                        className={cn(
                          "rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.22em] backdrop-blur-sm",
                          CATEGORY_TONE[post.category] ?? "border-white/15 bg-onyx-950/60 text-gold-light"
                        )}
                      >
                        {post.category}
                      </span>
                    </div>
                  </div>

                  {/* Meta */}
                  <div className="mt-5">
                    <h2 className="font-display text-2xl font-semibold tracking-tight transition-colors duration-300 group-hover:text-gold sm:text-[1.65rem]">
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
                        {post.excerpt}
                      </p>
                    )}
                    <p className="mt-3.5 flex flex-wrap items-center gap-x-5 gap-y-1 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                      <span>{fmtDate(post.publishedAt)}</span>
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="h-3 w-3" aria-hidden /> {post.readingMinutes} min read
                      </span>
                    </p>
                  </div>
                </Link>
              </motion.article>
            ))}
          </AnimatePresence>
        </div>

        {filtered.length === 0 && (
          <Reveal className="mt-16 text-center">
            <p className="text-muted-foreground">Nothing here yet — the first entry is being written.</p>
          </Reveal>
        )}
      </div>
    </section>
  );
}
