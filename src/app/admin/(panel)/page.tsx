"use client";

import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  ArrowRight,
  FolderKanban,
  Gem,
  Inbox,
  Newspaper,
  Quote,
  Radio,
  SlidersHorizontal,
} from "lucide-react";
import { AdminPageHeader, Panel, ToggleRow } from "@/components/admin/kit";

const QUICK = [
  { href: "/admin/projects", label: "Projects", desc: "Case studies & ordering", icon: FolderKanban },
  { href: "/admin/home-content", label: "Home Content", desc: "Hero, stats & CTAs", icon: SlidersHorizontal },
  { href: "/admin/blog", label: "Journal", desc: "Write & publish posts", icon: Newspaper },
  { href: "/admin/testimonials", label: "Testimonials", desc: "Social proof carousel", icon: Quote },
  { href: "/admin/messages", label: "Inbox", desc: "Contact submissions", icon: Inbox },
];

interface ActivityRow {
  id: string;
  action: string;
  detail: string | null;
  createdAt: string;
}

export default function AdminDashboardPage() {
  const qc = useQueryClient();

  const activity = useQuery({
    queryKey: ["activity"],
    queryFn: async (): Promise<{ ok: boolean; activity: ActivityRow[]; unread: number }> => {
      const res = await fetch("/api/admin/activity");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const settings = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const res = await fetch("/api/admin/settings");
      if (!res.ok) throw new Error("Failed");
      return res.json() as Promise<{
        ok: boolean;
        settings: { liveStatus: boolean; audioEnabled: boolean; videoEnabled: boolean } | null;
      }>;
    },
  });

  const gemCount = useQuery({
    queryKey: ["gem-count"],
    queryFn: async (): Promise<number> => {
      const res = await fetch("/api/admin/gem-count");
      if (!res.ok) throw new Error("Failed");
      const data = (await res.json()) as { ok: boolean; count: number };
      return data.count;
    },
    refetchInterval: 30_000,
  });

  const liveMutation = useMutation({
    mutationFn: async (next: boolean) => {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ liveStatus: next }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings"] });
      qc.invalidateQueries({ queryKey: ["activity"] });
    },
  });

  const s = settings.data?.settings;
  const unread = activity.data?.unread ?? 0;
  const gems = gemCount.data ?? 0;

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
      <AdminPageHeader
        title="Dashboard"
        description="Quick glance — what's unread, what's live, what changed."
      />

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Unread messages */}
        <Panel className="lg:col-span-1">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-gold/80">Inbox</p>
              <p className="mt-3 font-display text-5xl font-semibold text-gold">{unread}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                unread message{unread === 1 ? "" : "s"}
              </p>
            </div>
            <Inbox className="h-8 w-8 text-gold/40" aria-hidden />
          </div>
          <Link
            href="/admin/messages"
            className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-gold transition-colors hover:text-gold-light"
          >
            Open inbox <ArrowRight className="h-4 w-4" />
          </Link>
        </Panel>

        {/* LIVE toggle */}
        <Panel>
          <div className="mb-4 flex items-center gap-2">
            <Radio className="h-4 w-4 text-mint" aria-hidden />
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-mint">Live status</p>
          </div>
          <ToggleRow
            title={s?.liveStatus ? "LIVE badge is ON" : "LIVE badge is off"}
            description="Pulses in the nav + home hero within seconds."
            checked={!!s?.liveStatus}
            onCheckedChange={(v) => liveMutation.mutate(v)}
            disabled={liveMutation.isPending || settings.isLoading}
          />
          <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
            Full control (stream URL, socials, feature toggles) in{" "}
            <Link href="/admin/settings" className="text-gold hover:underline">
              Settings
            </Link>
            .
          </p>
        </Panel>

        {/* Recent activity */}
        <Panel className="lg:row-span-2">
          <div className="mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4 text-gold" aria-hidden />
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-gold/80">Recent activity</p>
          </div>
          {activity.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (activity.data?.activity.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing yet — your edits will appear here.</p>
          ) : (
            <ul className="max-h-[26rem] space-y-3 overflow-y-auto pr-1">
              {activity.data!.activity.map((a) => (
                <li key={a.id} className="border-l border-white/10 pl-3.5">
                  <p className="text-sm font-medium text-foreground/90">{a.action}</p>
                  {a.detail && <p className="truncate text-xs text-muted-foreground">{a.detail}</p>}
                  <p className="mt-0.5 font-mono text-[10px] tracking-[0.08em] text-muted-foreground/70">
                    {new Date(a.createdAt).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {/* Quick links */}
        <div className="grid gap-5 sm:grid-cols-2 lg:col-span-2 lg:grid-cols-3">
          {QUICK.map((q) => (
            <Link
              key={q.href}
              href={q.href}
              className="group rounded-xl border border-white/8 bg-onyx-900/40 p-5 transition-all duration-300 hover:border-gold/40 hover:bg-onyx-900/70 hover:shadow-[0_0_40px_-12px_rgba(212,168,87,0.35)]"
            >
              <q.icon className="h-5 w-5 text-gold/70 transition-colors group-hover:text-gold" aria-hidden />
              <p className="mt-3 font-display text-lg font-semibold">{q.label}</p>
              <p className="mt-1 text-xs text-muted-foreground">{q.desc}</p>
            </Link>
          ))}
          <Panel className="flex flex-col justify-between">
            <div>
              <p className="text-sm font-medium">Feature toggles</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Audio {s?.audioEnabled ? "on" : "off"} · Video {s?.videoEnabled ? "on" : "off"}
              </p>
            </div>
            <Link href="/admin/settings" className="mt-3 text-xs font-medium text-gold hover:underline">
              Manage in Settings →
            </Link>
          </Panel>

          {/* Easter egg counter — /api/track { type: "gem" } events, polled */}
          <Panel>
            <div className="flex items-start justify-between">
              <Gem className="h-5 w-5 text-gold/70" aria-hidden />
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-gold/80">
                Easter egg
              </p>
            </div>
            <p className="mt-3 font-display text-3xl font-semibold text-gold" aria-live="polite">
              {gemCount.isLoading ? "—" : gems}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Gem clicked {gems === 1 ? "1 time" : `${gems} times`} site-wide
            </p>
          </Panel>
        </div>
      </div>
    </main>
  );
}
