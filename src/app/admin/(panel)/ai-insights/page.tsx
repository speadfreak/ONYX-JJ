"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { AdminPageHeader, Panel, StatusBadge } from "@/components/admin/kit";

/**
 * /admin/ai-insights — what visitors are asking the "Ask JJ" assistant.
 * Business intelligence over anonymized conversation snippets.
 */

interface Insights {
  total: number;
  topics: { topic: string; count: number }[];
  recent: { id: string; question: string; topic: string; answer: string; createdAt: string }[];
}

const TOPIC_TONES: Record<string, "gold" | "mint" | "ice" | "muted"> = {
  inquiries: "mint",
  trading: "gold",
  "tgs-erp": "ice",
  attendx: "ice",
  nexus: "ice",
  learnyx: "gold",
  "tech-stack": "ice",
  startup: "gold",
  "about-jj": "muted",
  journal: "muted",
  general: "muted",
};

function timeAgo(iso: string): string {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function AiInsightsPage() {
  const [data, setData] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/ai-insights");
        if (!res.ok) throw new Error("failed");
        setData((await res.json()) as Insights);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const maxTopic = data?.topics?.[0]?.count ?? 1;

  return (
    <main className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-10">
      <AdminPageHeader
        title="AI Insights"
        description="What visitors ask the Ask JJ assistant — anonymized conversation intelligence. Grounded answers only, /contact redirects logged as inquiries."
      />

      {loading && <main className="text-sm text-muted-foreground">Loading…</main>}
      {error && (
        <main className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          Couldn&apos;t load insights. Try again.
        </main>
      )}

      {data && (
        <div className="space-y-6">
          {/* Totals + topic frequency */}
          <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
            <Panel className="flex flex-col items-center justify-center gap-1 px-10 py-8">
              <Sparkles className="mb-1 h-5 w-5 text-gold" aria-hidden />
              <p className="font-display text-5xl font-semibold text-gold">{data.total}</p>
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                Conversations
              </p>
            </Panel>

            <Panel>
              <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.3em] text-gold/80">
                Top question topics
              </p>
              {data.topics.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No conversations yet — they&apos;ll appear here as visitors use Ask JJ.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {data.topics.map((t) => (
                    <div key={t.topic} className="flex items-center gap-3">
                      <span className="w-24 shrink-0 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                        {t.topic}
                      </span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-gold-dark to-gold"
                          style={{ width: `${Math.max(6, (t.count / maxTopic) * 100)}%` }}
                        />
                      </div>
                      <span className="w-8 text-right font-mono text-xs text-foreground/80">{t.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </div>

          {/* Recent questions */}
          <Panel>
            <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.3em] text-gold/80">
              Recent questions
            </p>
            {data.recent.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nothing yet. Open the public site, click the gold bubble and ask something — it lands here instantly.
              </p>
            ) : (
              <ul className="max-h-[26rem] space-y-3 overflow-y-auto pr-1 [scrollbar-color:rgba(212,168,87,0.35)_transparent] [scrollbar-width:thin]">
                {data.recent.map((r) => (
                  <li key={r.id} className="rounded-lg border border-white/8 bg-onyx-950/40 p-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-medium leading-snug">{r.question}</p>
                      <StatusBadge tone={TOPIC_TONES[r.topic] ?? "muted"}>{r.topic}</StatusBadge>
                    </div>
                    {r.answer && (
                      <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                        {r.answer}
                      </p>
                    )}
                    <p className="mt-1.5 font-mono text-[10px] tracking-[0.1em] text-muted-foreground/70">
                      {timeAgo(r.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <p className="text-xs text-muted-foreground">
            Privacy: snippets are anonymized and never tied to identities. Aggregates also feed{" "}
            <Link href="/admin/analytics" className="text-gold hover:underline">
              Analytics
            </Link>
            .
          </p>
        </div>
      )}
    </main>
  );
}
