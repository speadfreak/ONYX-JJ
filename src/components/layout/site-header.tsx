"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { MuteToggle } from "@/components/layout/mute-toggle";
import { TextilePattern } from "@/components/effects/textile-pattern";
import { stopScroll, startScroll } from "@/components/providers/smooth-scroll";
import { cn } from "@/lib/utils";
import type { SocialLink } from "@/lib/content";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/work", label: "Work" },
  { href: "/startup", label: "Startup" },
  { href: "/blog", label: "Journal" },
  { href: "/contact", label: "Contact" },
];

const MORE = [
  { href: "/uses", label: "The Toolkit", hint: "gear & software" },
  { href: "/now", label: "Now", hint: "current focus" },
  { href: "/resume", label: "Resume", hint: "CV & PDF" },
];

/** Onyx diamond glyph used in the wordmark. */
function GemMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M12 2 22 12 12 22 2 12Z" stroke="#D4A857" strokeWidth="1.6" />
      <path d="M12 6.5 17.5 12 12 17.5 6.5 12Z" fill="rgba(212,168,87,0.18)" stroke="#D4A857" strokeOpacity="0.6" strokeWidth="1" />
    </svg>
  );
}

/**
 * Real LIVE badge — driven by /admin/settings (liveStatus), polled every 30s
 * so it appears/disappears within seconds of JJ toggling it.
 */
function LiveBadge({ initial }: { initial: { liveStatus: boolean; liveUrl: string } }) {
  const [live, setLive] = useState(initial.liveStatus);
  const [url, setUrl] = useState(initial.liveUrl);

  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      try {
        const res = await fetch("/api/public/settings", { cache: "no-store" });
        const data = (await res.json()) as { ok: boolean; liveStatus?: boolean; liveUrl?: string };
        if (!cancelled && data.ok) {
          setLive(!!data.liveStatus);
          setUrl(data.liveUrl ?? "");
        }
      } catch {
        /* keep last known state */
      }
    };
    const id = setInterval(poll, 30_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  if (!live) return null;

  return (
    <a
      href={url || "#"}
      target={url ? "_blank" : undefined}
      rel={url ? "noreferrer noopener" : undefined}
      aria-label="JJ is live — join the stream"
      className="group flex items-center gap-2 rounded-full border border-mint/40 bg-mint/10 py-1.5 pl-2.5 pr-3 backdrop-blur-sm transition-all duration-300 hover:border-mint hover:shadow-[0_0_20px_-4px_rgba(0,229,160,0.6)]"
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mint opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-mint" />
      </span>
      <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.3em] text-mint">
        LIVE
      </span>
    </a>
  );
}

export function SiteHeader({
  liveStatus = false,
  liveUrl = "",
  socials = [],
}: {
  liveStatus?: boolean;
  liveUrl?: string;
  socials?: SocialLink[];
}) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the overlay on navigation
  useEffect(() => setOpen(false), [pathname]);

  // Close the More dropdown on outside click / Escape
  useEffect(() => {
    if (!moreOpen) return;
    const onDown = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMoreOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [moreOpen]);

  // Lock scroll while the fullscreen menu is open
  useEffect(() => {
    if (open) stopScroll();
    else startScroll();
    return () => startScroll();
  }, [open]);

  const isActive = useCallback(
    (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href)),
    [pathname]
  );
  const moreActive = MORE.some((m) => isActive(m.href));

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "fixed inset-x-0 top-0 z-[70] transition-all duration-500",
          scrolled ? "glass-panel border-b border-white/5" : "border-b border-transparent"
        )}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:h-[72px] sm:px-8">
          {/* Wordmark + LIVE */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="group flex items-center gap-2.5"
              aria-label="JJ ONYX — home"
            >
              <GemMark className="h-6 w-6 transition-transform duration-500 group-hover:rotate-90" />
              <span className="font-display text-lg font-semibold tracking-tight">
                <span className="gold-text">JJ</span>
                <span className="ml-1.5 text-[0.72rem] font-medium uppercase tracking-[0.34em] text-foreground/90">
                  Onyx
                </span>
              </span>
            </Link>
            <LiveBadge initial={{ liveStatus, liveUrl }} />
          </div>

          {/* Desktop nav */}
          <nav aria-label="Primary" className="hidden items-center gap-7 lg:flex">
            {NAV.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group relative py-2 text-[13px] font-medium uppercase tracking-[0.18em] transition-colors duration-300",
                    active ? "text-gold" : "text-foreground/70 hover:text-foreground"
                  )}
                >
                  {item.label}
                  {active ? (
                    <motion.span
                      layoutId="jj-nav-underline"
                      className="absolute inset-x-0 -bottom-0.5 h-px bg-gold shadow-[0_0_8px_rgba(212,168,87,0.8)]"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  ) : (
                    <span className="absolute inset-x-0 -bottom-0.5 h-px origin-left scale-x-0 bg-gold/50 transition-transform duration-300 group-hover:scale-x-100" />
                  )}
                </Link>
              );
            })}

            {/* More — Uses / Now / Resume grouped to keep the bar uncluttered */}
            <div ref={moreRef} className="relative">
              <button
                onClick={() => setMoreOpen((v) => !v)}
                aria-expanded={moreOpen}
                aria-haspopup="menu"
                className={cn(
                  "group flex items-center gap-1.5 py-2 text-[13px] font-medium uppercase tracking-[0.18em] transition-colors duration-300",
                  moreActive ? "text-gold" : "text-foreground/70 hover:text-foreground"
                )}
              >
                More
                <ChevronDown
                  className={cn("h-3.5 w-3.5 transition-transform duration-300", moreOpen && "rotate-180")}
                />
              </button>
              <AnimatePresence>
                {moreOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.98 }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    role="menu"
                    aria-label="More pages"
                    className="absolute right-0 top-full mt-3 w-56 overflow-hidden rounded-xl border border-white/10 bg-onyx-900/95 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] backdrop-blur-xl"
                  >
                    {MORE.map((m) => (
                      <Link
                        key={m.href}
                        href={m.href}
                        role="menuitem"
                        onClick={() => setMoreOpen(false)}
                        className={cn(
                          "flex items-baseline justify-between gap-3 px-5 py-3.5 transition-colors duration-200 hover:bg-gold/10",
                          isActive(m.href) ? "text-gold" : "text-foreground/85 hover:text-gold"
                        )}
                      >
                        <span className="text-[13px] font-medium uppercase tracking-[0.18em]">{m.label}</span>
                        <span className="font-mono text-[10px] lowercase tracking-[0.1em] text-muted-foreground">
                          {m.hint}
                        </span>
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </nav>

          <div className="flex items-center gap-3">
            <MuteToggle />
            {/* Hamburger (mobile) */}
            <button
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-label={open ? "Close menu" : "Open menu"}
              className="relative flex h-11 w-11 flex-col items-center justify-center gap-[7px] rounded-full border border-white/10 bg-onyx-900/60 backdrop-blur-sm lg:hidden"
            >
              <span
                className={cn(
                  "h-px w-5 bg-gold transition-all duration-300",
                  open && "translate-y-[4px] rotate-45"
                )}
              />
              <span
                className={cn(
                  "h-px w-5 bg-gold transition-all duration-300",
                  open && "-translate-y-[4px] -rotate-45"
                )}
              />
            </button>
          </div>
        </div>
      </motion.header>

      {/* ── Fullscreen mobile menu overlay ─────────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="fixed inset-0 z-[75] flex flex-col overflow-y-auto bg-onyx-950/[0.985] backdrop-blur-xl lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
          >
            <TextilePattern className="opacity-20 [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)]" />
            <nav aria-label="Mobile" className="relative flex flex-1 flex-col justify-center gap-1 px-8 py-24">
              {[...NAV, ...MORE].map((item, i) => {
                const active = isActive(item.href);
                return (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, y: 34 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ delay: 0.08 + i * 0.055, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "group flex items-baseline gap-4 py-2.5 font-display text-[2.4rem] font-semibold tracking-tight transition-colors duration-300",
                        active ? "gold-text" : "text-foreground hover:text-gold",
                        i >= NAV.length && "text-[1.7rem] text-foreground/70"
                      )}
                    >
                      <span className="font-mono text-xs tracking-[0.3em] text-gold/60">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      {item.label}
                    </Link>
                  </motion.div>
                );
              })}
            </nav>
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="relative flex flex-wrap items-center justify-between gap-4 border-t border-white/8 px-8 py-6"
            >
              <div className="flex gap-5">
                {socials.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    className="text-xs uppercase tracking-[0.22em] text-muted-foreground transition-colors hover:text-gold"
                  >
                    {s.label}
                  </a>
                ))}
              </div>
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-gold/60">
                Builder · Trader · Storyteller
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
