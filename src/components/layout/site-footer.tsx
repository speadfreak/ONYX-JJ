import Link from "next/link";
import {
  Activity,
  ArrowRight,
  FileText,
  Github,
  Globe,
  Instagram,
  Linkedin,
  MapPin,
  Send,
  Twitch,
  Twitter,
  Wrench,
  Youtube,
} from "lucide-react";
import type { SocialLink } from "@/lib/content";
import { MarketPulseStrip } from "@/components/market/market-pulse-strip";
import { CommandHint } from "@/components/command/command-hint";
import { GradientMesh } from "@/components/effects/gradient-mesh";
import { GoldLineDraw } from "@/components/effects/gold-line-draw";
import { FooterClock } from "@/components/layout/footer-clock";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/work", label: "Work" },
  { href: "/startup", label: "Startup" },
  { href: "/blog", label: "Journal" },
  { href: "/contact", label: "Contact" },
];

const EXPLORE = [
  { href: "/uses", label: "Uses", icon: Wrench, hint: "Tools & setup" },
  { href: "/now", label: "Now", icon: Activity, hint: "Current focus" },
  { href: "/resume", label: "Resume", icon: FileText, hint: "Experience & CV" },
];

/** Platform → icon mapping for the CONNECT column (DB-driven socials). */
function platformIcon(platform: string) {
  const p = platform.trim().toLowerCase();
  if (p.includes("twitch")) return Twitch;
  if (p.includes("telegram")) return Send;
  if (p.includes("github")) return Github;
  if (p.includes("linked")) return Linkedin;
  if (p.includes("twitter") || p === "x" || p.includes("x (")) return Twitter;
  if (p.includes("youtube")) return Youtube;
  if (p.includes("instagram")) return Instagram;
  return Globe;
}

export function SiteFooter({
  socials = [],
  marketBias = "",
  liveStatus = false,
  liveUrl = "",
  availabilityStatus = "",
  shippedCount = 0,
}: {
  socials?: SocialLink[];
  marketBias?: string;
  liveStatus?: boolean;
  liveUrl?: string;
  availabilityStatus?: string;
  shippedCount?: number;
}) {
  const year = new Date().getFullYear();

  return (
    <footer className="relative mt-auto border-t border-white/5 bg-onyx-950">
      {/* v3 — Live Market Pulse ticker strip (unchanged — sits above the footer proper) */}
      <MarketPulseStrip bias={marketBias} />

      {/* Cinematic backdrop for the closing section — very low opacity so it
          reads as atmosphere, not decoration (killed for reduced-motion). */}
      <div className="relative overflow-hidden">
        <GradientMesh className="opacity-30 motion-reduce:hidden" />

        <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
          {/* ══ ZONE 1 — Brand + closing statement ══════════════════════ */}
          <div className="flex flex-col items-center gap-8 py-16 text-center sm:py-20 lg:flex-row lg:items-end lg:justify-between lg:text-left">
            <div>
              <p className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
                <span className="gold-text drop-shadow-[0_0_28px_rgba(212,168,87,0.35)]">JJ</span>
                <span className="ml-2.5 text-[0.62em] font-medium uppercase tracking-[0.42em] text-foreground/90">
                  Onyx
                </span>
              </p>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
                Polished under pressure — from Addis Ababa to everywhere.
              </p>
              {/* closing CTA — magnetic arrow hover, site hover language */}
              <Link
                href="/contact"
                data-cursor="hover"
                className="group mt-7 inline-flex items-center gap-3 font-display text-lg italic text-gold/90 transition-colors duration-300 hover:text-gold sm:text-xl"
              >
                <span className="relative">
                  Have something worth building? Let&apos;s talk.
                  <span
                    aria-hidden
                    className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-gold/60 transition-transform duration-500 ease-out group-hover:scale-x-100"
                  />
                </span>
                <ArrowRight
                  aria-hidden
                  className="h-5 w-5 transition-transform duration-500 ease-out group-hover:translate-x-1.5 motion-reduce:transition-none"
                />
              </Link>
            </div>

            {/* live status cluster — Addis Ababa clock + LIVE badge when streaming */}
            <div className="flex flex-col items-center gap-3 lg:items-end">
              <FooterClock liveStatus={liveStatus} liveUrl={liveUrl} />
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                His desk, right now
              </p>
            </div>
          </div>

          <GoldLineDraw />

          {/* ══ ZONE 2 — three-column link architecture ═════════════════ */}
          <div className="grid gap-12 py-14 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
            {/* SITE */}
            <nav aria-label="Footer site" className="flex flex-col gap-3.5">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-gold/60">Site</p>
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="w-fit text-[13px] font-medium uppercase tracking-[0.18em] text-foreground/70 transition-colors duration-300 hover:text-gold"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* EXPLORE — icons for quicker visual scanning */}
            <nav aria-label="Explore" className="flex flex-col gap-3.5">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-gold/60">Explore</p>
              {EXPLORE.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex w-fit items-center gap-3 text-[13px] font-medium uppercase tracking-[0.18em] text-foreground/70 transition-colors duration-300 hover:text-gold"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-white/[0.03] transition-all duration-300 group-hover:border-gold/40 group-hover:bg-gold/10">
                    <item.icon
                      aria-hidden
                      className="h-3.5 w-3.5 text-muted-foreground transition-colors duration-300 group-hover:text-gold"
                    />
                  </span>
                  {item.label}
                  <span className="font-mono text-[9px] normal-case tracking-[0.08em] text-muted-foreground/0 transition-colors duration-300 group-hover:text-muted-foreground/80">
                    {item.hint}
                  </span>
                </Link>
              ))}
            </nav>

            {/* CONNECT — real platform icons, DB-driven socials */}
            <nav aria-label="Connect" className="flex flex-col gap-3.5">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-gold/60">Connect</p>
              {socials.length === 0 && (
                <p className="text-[13px] text-muted-foreground">Links coming soon.</p>
              )}
              {socials.map((s) => {
                const Icon = platformIcon(s.platform);
                return (
                  <a
                    key={s.label}
                    href={s.href}
                    title={s.note}
                    target={s.href.startsWith("http") ? "_blank" : undefined}
                    rel={s.href.startsWith("http") ? "noreferrer noopener" : undefined}
                    className="group flex w-fit items-center gap-3 text-[13px] font-medium uppercase tracking-[0.18em] text-foreground/70 transition-colors duration-300 hover:text-gold"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-white/[0.03] transition-all duration-300 group-hover:border-gold/40 group-hover:bg-gold/10">
                      <Icon
                        aria-hidden
                        className="h-3.5 w-3.5 text-muted-foreground transition-all duration-300 group-hover:text-gold group-hover:drop-shadow-[0_0_6px_rgba(212,168,87,0.6)]"
                      />
                    </span>
                    <span className="border-b border-transparent transition-colors duration-300 group-hover:border-gold/50">
                      {s.label}
                    </span>
                  </a>
                );
              })}
            </nav>
          </div>

          <GoldLineDraw />

          {/* ══ ZONE 3 — trust / detail strip ═══════════════════════════ */}
          <ul className="flex flex-wrap items-center justify-center gap-2.5 py-8 sm:justify-start">
            <li className="flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              <MapPin aria-hidden className="h-3 w-3 text-gold/60" />
              Based in Addis Ababa, Ethiopia
            </li>
            <li className="flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              <span aria-hidden className="font-semibold text-gold/80 tabular-nums">
                {shippedCount}
              </span>
              shipped platform{shippedCount === 1 ? "" : "s"}
            </li>
            {availabilityStatus.trim() && (
              <li className="flex items-center gap-2 rounded-full border border-gold/25 bg-gold/[0.06] px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-gold/90">
                <span aria-hidden className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-60 motion-reduce:animate-none" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-gold" />
                </span>
                {availabilityStatus.trim()}
              </li>
            )}
          </ul>

          {/* ══ ZONE 4 — legal + utility line ═══════════════════════════ */}
          <div className="flex flex-col items-center gap-5 border-t border-white/5 py-7 sm:flex-row sm:justify-between">
            <p className="font-mono text-[11px] tracking-[0.14em] text-muted-foreground">
              © {year} Joseph James — JJ ONYX. All rights reserved.
            </p>

            <div className="flex flex-col items-center gap-2.5 sm:items-end">
              {/* ⌘K hint, integrated — pill + one-line discoverability microcopy */}
              <div className="flex items-center gap-3">
                <CommandHint />
                <span className="hidden text-[11px] text-muted-foreground/80 md:inline">
                  to navigate anywhere
                </span>
              </div>
            </div>
          </div>

          {/* kicker — proper eyebrow with thin gold divider */}
          <div className="flex items-center justify-center gap-4 pb-10">
            <span aria-hidden className="h-px w-14 bg-gradient-to-r from-transparent to-gold/40" />
            <p className="font-mono text-[10px] uppercase tracking-[0.42em] text-gold/50">
              Builder · Trader · Storyteller
            </p>
            <span aria-hidden className="h-px w-14 bg-gradient-to-l from-transparent to-gold/40" />
          </div>
        </div>
      </div>
    </footer>
  );
}
