"use client";

import { useState } from "react";
import {
  Binary,
  Cloud,
  Code2,
  Cpu,
  Database,
  FileCode2,
  GitBranch,
  Headphones,
  Keyboard,
  LineChart,
  Mic,
  Monitor,
  Palette,
  Radio,
  Rocket,
  Server,
  Smartphone,
  Terminal,
  TrendingUp,
  Wallet,
  Wind,
} from "lucide-react";
import { GoldDivider } from "@/components/motion/gold-divider";
import { SectionHeading } from "@/components/motion/section-heading";
import { Stagger, StaggerItem } from "@/components/motion/reveal";
import { TextilePattern } from "@/components/effects/textile-pattern";
import { cn } from "@/lib/utils";

type Tool = { icon: typeof Code2; name: string; note: string };

const SECTIONS: { id: string; title: string; blurb: string; tools: Tool[] }[] = [
  {
    id: "development",
    title: "Development",
    blurb: "The build bench — where the ERPs, platforms and this site get made.",
    tools: [
      { icon: Code2, name: "TypeScript", note: "Strict mode always — the compiler is my first reviewer." },
      { icon: Rocket, name: "React + Next.js", note: "Fast to ship, fast in the browser. This very site runs on it." },
      { icon: FileCode2, name: "Vite", note: "Instant HMR keeps me in flow while prototyping dashboards." },
      { icon: Server, name: "Node + Express", note: "The glue of every realtime API I've shipped." },
      { icon: Database, name: "PostgreSQL", note: "Boring, reliable, everywhere. Supabase hosts mine." },
      { icon: Wind, name: "Tailwind CSS", note: "Design systems at the speed of thought." },
      { icon: Cloud, name: "Render", note: "Deploys that just happen — no server babysitting." },
      { icon: GitBranch, name: "Git + GitHub", note: "Codespaces lets me broadcast a build from any machine." },
      { icon: Terminal, name: "Warp", note: "A terminal that keeps up with how I actually think." },
    ],
  },
  {
    id: "trading",
    title: "Trading",
    blurb: "The market desk — research, execution and the streaming overlay.",
    tools: [
      { icon: TrendingUp, name: "MT5", note: "Execution and backtests; my first serious platform." },
      { icon: LineChart, name: "TradingView", note: "Where every idea gets charted before it gets traded." },
      { icon: Binary, name: "COT Reports", note: "Positioning first, price second — every weekend." },
      { icon: Radio, name: "JJ NEXUS PRO", note: "My own command center: charts, broadcast and research in one tab." },
      { icon: Wallet, name: "Prop firm accounts", note: "Discipline with someone else's risk rules — great teacher." },
      { icon: Smartphone, name: "Phone PWA", note: "My own camera-to-RTMP tool turns a phone into a stream source." },
    ],
  },
  {
    id: "hardware",
    title: "Hardware",
    blurb: "The physical desk — built for long builds and longer sessions.",
    tools: [
      { icon: Cpu, name: "Ryzen dev machine", note: "Compiles, compiles, and streams — often all three." },
      { icon: Monitor, name: "Dual monitors", note: "Charts on the left, editor on the right, sanity in the middle." },
      { icon: Keyboard, name: "Mechanical keyboard", note: "Tactile switches — shipping should feel like something." },
      { icon: Mic, name: "Broadcast mic", note: "Viewers forgive a bad webcam, never bad audio." },
      { icon: Headphones, name: "Closed-back headphones", note: "Focus mode for code, clarity mode for streams." },
      { icon: Palette, name: "Warm desk light", note: "Onyx-dark room, one gold glow — the palette is the mood." },
    ],
  },
];

/** Cinematic uses.tech-style toolkit — hover a tile to reveal why it earns its spot. */
export function UsesSections() {
  const [active, setActive] = useState<string | null>(null);

  return (
    <div className="relative pb-24 sm:pb-32">
      <TextilePattern mask className="opacity-15" />

      {SECTIONS.map((section, si) => (
        <section key={section.id} aria-label={section.title} className={cn("relative", si > 0 && "mt-6")}>
          {si > 0 && <GoldDivider className="my-10" />}
          <div className="mx-auto max-w-5xl px-5 sm:px-8">
            <SectionHeading
              kicker={String(si + 1).padStart(2, "0")}
              title={<>{section.title}</>}
              description={section.blurb}
            />

            <Stagger stagger={0.06} className="mt-10 grid grid-cols-2 gap-3.5 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
              {section.tools.map((tool) => {
                const isActive = active === `${section.id}-${tool.name}`;
                return (
                  <StaggerItem key={tool.name} className="h-full">
                    <button
                      type="button"
                      onMouseEnter={() => setActive(`${section.id}-${tool.name}`)}
                      onMouseLeave={() => setActive(null)}
                      onFocus={() => setActive(`${section.id}-${tool.name}`)}
                      onBlur={() => setActive(null)}
                      aria-describedby={`${section.id}-${tool.name}-note`}
                      data-cursor="hover"
                      className={cn(
                        "group relative flex h-full min-h-32 w-full flex-col justify-between overflow-hidden rounded-xl border bg-onyx-900/50 p-4 text-left transition-all duration-300 sm:min-h-36 sm:p-5",
                        isActive
                          ? "-translate-y-1 border-gold/50 shadow-[0_0_36px_-10px_rgba(212,168,87,0.4)]"
                          : "border-white/8 hover:border-gold/30"
                      )}
                    >
                      <tool.icon
                        aria-hidden
                        className={cn(
                          "h-6 w-6 transition-colors duration-300",
                          isActive ? "text-gold" : "text-gold/60"
                        )}
                      />
                      <p className="mt-4 text-sm font-semibold text-foreground">{tool.name}</p>
                      {/* one-line why — hover/focus reveal */}
                      <p
                        id={`${section.id}-${tool.name}-note`}
                        className={cn(
                          "mt-1 text-xs leading-snug text-muted-foreground transition-all duration-300",
                          "line-clamp-3",
                          isActive ? "opacity-100" : "opacity-0 sm:absolute sm:bottom-4 sm:left-5 sm:right-5"
                        )}
                      >
                        {tool.note}
                      </p>
                      <span
                        aria-hidden
                        className={cn(
                          "pointer-events-none absolute inset-x-0 bottom-0 h-px origin-left bg-gradient-to-r from-gold/70 to-transparent transition-transform duration-500",
                          isActive ? "scale-x-100" : "scale-x-0"
                        )}
                      />
                    </button>
                  </StaggerItem>
                );
              })}
            </Stagger>
          </div>
        </section>
      ))}
    </div>
  );
}
