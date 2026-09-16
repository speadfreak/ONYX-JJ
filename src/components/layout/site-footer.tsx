import Link from "next/link";
import type { SocialLink } from "@/lib/content";
import { MarketPulseStrip } from "@/components/market/market-pulse-strip";
import { CommandHint } from "@/components/command/command-hint";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/work", label: "Work" },
  { href: "/startup", label: "Startup" },
  { href: "/blog", label: "Journal" },
  { href: "/contact", label: "Contact" },
];

const QUICK = [
  { href: "/uses", label: "Uses" },
  { href: "/now", label: "Now" },
  { href: "/resume", label: "Resume" },
];

export function SiteFooter({
  socials = [],
  marketBias = "",
}: {
  socials?: SocialLink[];
  marketBias?: string;
}) {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-auto border-t border-white/5 bg-onyx-950/70">
      {/* v3 — Live Market Pulse ticker strip (real/delayed data or clearly-labeled demo) */}
      <MarketPulseStrip bias={marketBias} />
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
        <div className="flex flex-col items-start justify-between gap-10 lg:flex-row lg:items-start">
          {/* Wordmark */}
          <div>
            <p className="font-display text-xl font-semibold tracking-tight">
              <span className="gold-text">JJ</span>
              <span className="ml-1.5 text-[0.72rem] font-medium uppercase tracking-[0.34em] text-foreground/90">
                Onyx
              </span>
            </p>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Polished under pressure — from Addis Ababa to everywhere.
            </p>
          </div>

          {/* Nav + quick links */}
          <div className="flex flex-wrap gap-16">
            <nav aria-label="Footer" className="flex flex-col gap-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-gold/60">Site</p>
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-[13px] font-medium uppercase tracking-[0.18em] text-foreground/70 transition-colors duration-300 hover:text-gold"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <nav aria-label="Quick links" className="flex flex-col gap-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-gold/60">More</p>
              {QUICK.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-[13px] font-medium uppercase tracking-[0.18em] text-foreground/70 transition-colors duration-300 hover:text-gold"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Socials — managed from /admin/settings */}
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                title={s.note}
                className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground transition-colors duration-300 hover:text-gold"
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-white/5 pt-6 sm:flex-row sm:items-center">
          <p className="font-mono text-[11px] tracking-[0.14em] text-muted-foreground">
            © {year} Joseph James — JJ ONYX. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <CommandHint />
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-gold/50">
              Builder · Trader · Storyteller
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
