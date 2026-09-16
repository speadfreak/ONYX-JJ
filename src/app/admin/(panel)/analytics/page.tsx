"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Command, Eye, Gem, Mail, Sparkles } from "lucide-react";
import { AdminPageHeader, Panel } from "@/components/admin/kit";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * /admin/analytics — anonymous, self-hosted usage dashboard.
 * Charts are hand-rolled inline SVG (gold #D4A857 / mint #00E5A0 on onyx),
 * matching the public site's hand-authored chart language. No chart library.
 */

// ── Types ────────────────────────────────────────────────────────────────

type DayBucket = { day: string; count: number };
type NamedCount = { name: string; count: number };

type Analytics = {
  ok: boolean;
  days: number;
  totals: {
    pageviews: number;
    aiChats: number;
    paletteUses: number;
    gemClicks: number;
    contactMessages: number;
  };
  viewsPerDay: DayBucket[];
  topRoutes: NamedCount[];
  topCaseStudies: NamedCount[];
  referrers: { source: string; count: number }[];
  topPaletteActions: NamedCount[];
  aiTopics: NamedCount[];
  aiRecent: { question: string; topic: string; createdAt: string }[];
  contactPerDay: DayBucket[];
};

// ── Chart helpers (SVG, onyx/gold/mint language) ─────────────────────────

const GOLD = "#D4A857";
const MINT = "#00E5A0";
const GRID = "rgba(255,255,255,0.07)";
const LABEL = "rgba(255,255,255,0.45)";

/** Pick a max divisible by 4 so 4 integer gridlines read cleanly. */
function niceMax(m: number): number {
  const steps = [4, 8, 12, 16, 20, 40, 60, 80, 100, 200, 400, 600, 800, 1000, 2000, 4000, 8000];
  for (const s of steps) if (m <= s) return s;
  return Math.ceil(m / 4000) * 4000;
}

function GridY({
  padL,
  padT,
  innerH,
  max,
  width,
}: {
  padL: number;
  padT: number;
  innerH: number;
  max: number;
  width: number;
}) {
  return (
    <g>
      {[1, 2, 3, 4].map((i) => {
        const y = padT + innerH - (innerH * i) / 4;
        return (
          <g key={i}>
            <line x1={padL} x2={width - 6} y1={y} y2={y} stroke={GRID} strokeWidth={1} />
            <text
              x={padL - 6}
              y={y + 3}
              textAnchor="end"
              fontSize={9}
              fill={LABEL}
              className="font-mono"
            >
              {(max * i) / 4}
            </text>
          </g>
        );
      })}
    </g>
  );
}

/** a. Page views — gold bar chart, viewBox 0 0 640 180. */
function PageViewsBarChart({ data }: { data: DayBucket[] }) {
  const W = 640;
  const H = 180;
  const PAD_L = 34;
  const PAD_B = 22;
  const PAD_T = 12;
  const innerW = W - PAD_L - 8;
  const innerH = H - PAD_B - PAD_T;
  const max = niceMax(Math.max(1, ...data.map((d) => d.count)));
  const slot = innerW / data.length;
  const barW = Math.min(28, slot * 0.6);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-auto w-full"
      role="img"
      aria-label={`Page views per day, peak ${max}`}
    >
      <GridY padL={PAD_L} padT={PAD_T} innerH={innerH} max={max} width={W} />
      {data.map((d, i) => {
        const h = (d.count / max) * innerH;
        if (h <= 0) return null;
        return (
          <rect
            key={d.day}
            x={PAD_L + i * slot + (slot - barW) / 2}
            y={PAD_T + innerH - h}
            width={barW}
            height={h}
            rx={2}
            fill={GOLD}
            fillOpacity={0.85}
          />
        );
      })}
      {data.map((d, i) =>
        i % 5 === 0 || i === data.length - 1 ? (
          <text
            key={d.day}
            x={PAD_L + i * slot + slot / 2}
            y={H - 6}
            textAnchor="middle"
            fontSize={9}
            fill={LABEL}
            className="font-mono"
          >
            {d.day}
          </text>
        ) : null
      )}
    </svg>
  );
}

/** b. Contact messages — mint line + subtle gradient area. */
function ContactAreaChart({ data }: { data: DayBucket[] }) {
  const W = 640;
  const H = 180;
  const PAD_L = 34;
  const PAD_B = 22;
  const PAD_T = 12;
  const innerW = W - PAD_L - 8;
  const innerH = H - PAD_B - PAD_T;
  const max = niceMax(Math.max(1, ...data.map((d) => d.count)));
  const slot = innerW / data.length;
  const pts = data.map((d, i) => ({
    x: PAD_L + i * slot + slot / 2,
    y: PAD_T + innerH - (d.count / max) * innerH,
  }));
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const area = `${line} L${pts[pts.length - 1]!.x.toFixed(1)},${PAD_T + innerH} L${pts[0]!.x.toFixed(1)},${PAD_T + innerH} Z`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-auto w-full"
      role="img"
      aria-label={`Contact messages per day, peak ${max}`}
    >
      <defs>
        <linearGradient id="jj-mint-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={MINT} stopOpacity={0.22} />
          <stop offset="100%" stopColor={MINT} stopOpacity={0} />
        </linearGradient>
      </defs>
      <GridY padL={PAD_L} padT={PAD_T} innerH={innerH} max={max} width={W} />
      <path d={area} fill="url(#jj-mint-area)" />
      <path d={line} fill="none" stroke={MINT} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
      {pts.map((p, i) => (
        <circle key={data[i]!.day} cx={p.x} cy={p.y} r={2} fill={MINT} fillOpacity={0.9} />
      ))}
      {data.map((d, i) =>
        i % 5 === 0 || i === data.length - 1 ? (
          <text
            key={d.day}
            x={PAD_L + i * slot + slot / 2}
            y={H - 6}
            textAnchor="middle"
            fontSize={9}
            fill={LABEL}
            className="font-mono"
          >
            {d.day}
          </text>
        ) : null
      )}
    </svg>
  );
}

/** c. Traffic sources — gold bars on white/5 tracks. */
function TrafficSources({ data }: { data: { source: string; count: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <ul className="space-y-4">
      {data.map((r) => (
        <li key={r.source}>
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
              {r.source}
            </span>
            <span className="font-display text-lg font-semibold text-gold">{r.count}</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full bg-gold transition-[width] duration-500"
              style={{ width: `${(r.count / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** d. Top case studies — ranked rows with thin relative bars. */
function CaseStudyRanking({ data }: { data: NamedCount[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <ol className="space-y-3.5">
      {data.map((r, i) => (
        <li key={r.name}>
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-[10px] tracking-[0.1em] text-gold/60">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="min-w-0 flex-1 truncate font-mono text-xs text-foreground/85">{r.name}</span>
            <span className="font-display text-base font-semibold text-gold">{r.count}</span>
          </div>
          <div className="ml-7 mt-1.5 h-1 overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full bg-gold/80 transition-[width] duration-500"
              style={{ width: `${(r.count / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ol>
  );
}

// ── Small pieces ─────────────────────────────────────────────────────────

function EmptyLine() {
  return (
    <p className="py-8 text-center font-mono text-[11px] tracking-[0.08em] text-muted-foreground/70">
      No data yet — browse the public site to populate.
    </p>
  );
}

function PanelTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.3em] text-gold/80">{children}</p>
  );
}

function relTime(iso: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ── Page ─────────────────────────────────────────────────────────────────

const STAT_CARDS = [
  { key: "pageviews", label: "Page views", icon: Eye, tone: "text-gold" },
  { key: "aiChats", label: "Ask JJ chats", icon: Sparkles, tone: "text-mint" },
  { key: "paletteUses", label: "Palette uses", icon: Command, tone: "text-gold" },
  { key: "gemClicks", label: "Gem clicks", icon: Gem, tone: "text-gold" },
  { key: "contactMessages", label: "Contact msgs", icon: Mail, tone: "text-mint" },
] as const;

export default function AdminAnalyticsPage() {
  const [days, setDays] = useState<7 | 30>(7);

  const q = useQuery({
    queryKey: ["analytics", days],
    queryFn: async (): Promise<Analytics> => {
      const res = await fetch(`/api/admin/analytics?days=${days}`);
      if (!res.ok) throw new Error("Failed to load analytics");
      return res.json();
    },
    staleTime: 15_000,
  });

  const d = q.data;
  const totals = d?.totals;
  const viewsEmpty = !!d && d.viewsPerDay.every((x) => x.count === 0);
  const contactEmpty = !!d && d.contactPerDay.every((x) => x.count === 0);
  const referrersEmpty = !!d && d.referrers.every((x) => x.count === 0);
  const casesEmpty = !!d && d.topCaseStudies.length === 0;

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
      <AdminPageHeader
        title="Analytics"
        description="Anonymous, self-hosted usage — no cookies, no PII."
        actions={
          <div
            role="group"
            aria-label="Time window"
            className="flex items-center gap-1 rounded-lg border border-white/10 bg-onyx-950/60 p-1"
          >
            {([7, 30] as const).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setDays(n)}
                aria-pressed={days === n}
                className={cn(
                  "h-7 rounded-md px-3 font-mono text-[11px] tracking-[0.15em] transition-colors",
                  days === n
                    ? "bg-gold/15 text-gold shadow-[inset_0_0_0_1px_rgba(212,168,87,0.3)]"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {n}D
              </button>
            ))}
          </div>
        }
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        {STAT_CARDS.map((s) => (
          <Panel key={s.key} className="p-5">
            <div className="flex items-center justify-between">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                {s.label}
              </p>
              <s.icon className={cn("h-4 w-4 opacity-70", s.tone)} aria-hidden />
            </div>
            {q.isLoading ? (
              <Skeleton className="mt-3 h-9 w-16" />
            ) : (
              <p className="mt-2 font-display text-3xl font-semibold text-foreground">
                {totals?.[s.key] ?? 0}
              </p>
            )}
          </Panel>
        ))}
      </div>

      {/* Charts — pageviews + contact trend */}
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Panel>
          <PanelTitle>Page views — last {days} days</PanelTitle>
          {q.isLoading ? (
            <Skeleton className="h-[180px] w-full" />
          ) : viewsEmpty ? (
            <EmptyLine />
          ) : (
            d && <PageViewsBarChart data={d.viewsPerDay} />
          )}
        </Panel>
        <Panel>
          <PanelTitle>Contact messages — last {days} days</PanelTitle>
          {q.isLoading ? (
            <Skeleton className="h-[180px] w-full" />
          ) : contactEmpty ? (
            <EmptyLine />
          ) : (
            d && <ContactAreaChart data={d.contactPerDay} />
          )}
        </Panel>
      </div>

      {/* Charts — sources + case studies */}
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Panel>
          <PanelTitle>Traffic sources</PanelTitle>
          {q.isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : referrersEmpty ? (
            <EmptyLine />
          ) : (
            d && <TrafficSources data={d.referrers} />
          )}
        </Panel>
        <Panel>
          <PanelTitle>Top case studies</PanelTitle>
          {q.isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : casesEmpty ? (
            <EmptyLine />
          ) : (
            d && <CaseStudyRanking data={d.topCaseStudies} />
          )}
        </Panel>
      </div>

      {/* Lists row */}
      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Panel>
          <PanelTitle>Top routes</PanelTitle>
          {q.isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : (d?.topRoutes.length ?? 0) === 0 ? (
            <EmptyLine />
          ) : (
            <ul className="max-h-72 space-y-2.5 overflow-y-auto pr-1">
              {d!.topRoutes.map((r) => (
                <li key={r.name} className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0 truncate font-mono text-xs text-foreground/85">{r.name}</span>
                  <span className="font-display text-sm font-semibold text-gold">{r.count}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel>
          <PanelTitle>Command palette — top actions</PanelTitle>
          {q.isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : (d?.topPaletteActions.length ?? 0) === 0 ? (
            <EmptyLine />
          ) : (
            <ul className="max-h-72 space-y-2.5 overflow-y-auto pr-1">
              {d!.topPaletteActions.map((a) => (
                <li key={a.name} className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0 truncate font-mono text-xs text-foreground/85">{a.name}</span>
                  <span className="font-display text-sm font-semibold text-gold">{a.count}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel>
          <PanelTitle>Ask JJ — top topics</PanelTitle>
          {q.isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : (d?.aiTopics.length ?? 0) === 0 && (d?.aiRecent.length ?? 0) === 0 ? (
            <EmptyLine />
          ) : (
            <>
              {d && d.aiTopics.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {d.aiTopics.map((t) => (
                    <span
                      key={t.name}
                      className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-gold"
                    >
                      {t.name}
                      <span className="text-gold/70">{t.count}</span>
                    </span>
                  ))}
                </div>
              )}
              {d && d.aiRecent.length > 0 && (
                <>
                  <p className="mb-2 mt-5 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                    Recent questions
                  </p>
                  <ul className="max-h-44 space-y-3 overflow-y-auto pr-1">
                    {d.aiRecent.map((r, i) => (
                      <li key={`${r.createdAt}-${i}`} className="border-l border-white/10 pl-3">
                        <p className="truncate text-xs text-foreground/85">{r.question}</p>
                        <p className="mt-0.5 flex items-center gap-2 font-mono text-[10px] tracking-[0.08em] text-muted-foreground/70">
                          <span>{relTime(r.createdAt)}</span>·
                          <span className="uppercase tracking-[0.14em] text-gold/70">{r.topic}</span>
                        </p>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </>
          )}
        </Panel>
      </div>

      {q.isError && (
        <p className="mt-6 text-center font-mono text-[11px] tracking-[0.08em] text-red-400">
          Failed to load analytics — try again.
        </p>
      )}
    </main>
  );
}
