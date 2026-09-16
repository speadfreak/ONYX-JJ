"use client";

import { useEffect, useState } from "react";
import { Download, Plus, RefreshCw, Save, X } from "lucide-react";
import {
  AdminInput,
  AdminPageHeader,
  AdminTextarea,
  Field,
  Panel,
  SaveButton,
  ToggleRow,
} from "@/components/admin/kit";
import { AssetUpload } from "@/components/admin/asset-upload";
import { useToast } from "@/hooks/use-toast";

interface SocialRow {
  label: string;
  platform: string;
  href: string;
  note: string;
}

interface SettingsRow {
  liveStatus: boolean;
  liveUrl: string;
  audioEnabled: boolean;
  videoEnabled: boolean;
  socials: string;
  profileImage: string;
  ambientAudio: string;
  heroVideo: string;
  heroPoster: string;
  nowContent: string;
  nowUpdatedAt: string | null;
  availabilityStatus?: string;
}

function parse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [s, setS] = useState<SettingsRow | null>(null);
  const [socials, setSocials] = useState<SocialRow[]>([]);
  const [regen, setRegen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/settings");
        const data = (await res.json()) as { ok: boolean; settings: SettingsRow | null };
        if (data.settings) {
          setS(data.settings);
          setSocials(parse<SocialRow[]>(data.settings.socials, []));
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const save = async (extra?: Record<string, unknown>) => {
    if (!s) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          liveStatus: s.liveStatus,
          liveUrl: s.liveUrl,
          audioEnabled: s.audioEnabled,
          videoEnabled: s.videoEnabled,
          socials,
          profileImage: s.profileImage,
          ambientAudio: s.ambientAudio,
          heroVideo: s.heroVideo,
          heroPoster: s.heroPoster,
          availabilityStatus: s.availabilityStatus ?? "",
          ...extra,
        }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string; settings?: SettingsRow };
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Save failed");
      if (data.settings) setS(data.settings);
      toast({ title: "Settings saved", description: "Public site reflects this immediately." });
    } catch (e) {
      toast({ title: "Save failed", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const regenerate = async () => {
    setRegen(true);
    try {
      const res = await fetch("/api/admin/regenerate-portfolio", { method: "POST" });
      const data = (await res.json()) as { ok: boolean; error?: string; bytes?: number };
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Regeneration failed");
      toast({
        title: "Portfolio deck regenerated",
        description: `Fresh PDF built from live content (${Math.round((data.bytes ?? 0) / 1024)} KB).`,
      });
    } catch (e) {
      toast({ title: "Regeneration failed", description: (e as Error).message, variant: "destructive" });
    } finally {
      setRegen(false);
    }
  };

  if (loading || !s) return <main className="mx-auto max-w-5xl px-5 py-10 sm:px-8">Loading…</main>;

  return (
    <main className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-10">
      <AdminPageHeader
        title="Site settings"
        description="LIVE badge, feature toggles, social links, managed assets and the /now page."
        actions={
          <SaveButton pending={saving} onClick={() => save()}>
            <Save className="h-4 w-4" /> Save settings
          </SaveButton>
        }
      />

      <div className="space-y-6">
        {/* LIVE */}
        <Panel>
          <p className="mb-5 font-mono text-[10px] uppercase tracking-[0.3em] text-gold/80">Live status</p>
          <div className="space-y-3">
            <ToggleRow
              title="I'm streaming LIVE right now"
              description="Shows a pulsing LIVE badge in the nav and on the home hero — updates within ~30 seconds."
              checked={s.liveStatus}
              onCheckedChange={(v) => setS({ ...s, liveStatus: v })}
            />
            <Field label="Stream URL" hint="where the LIVE badge links" htmlFor="s-liveurl">
              <AdminInput
                id="s-liveurl"
                placeholder="https://twitch.tv/…"
                value={s.liveUrl}
                onChange={(e) => setS({ ...s, liveUrl: e.target.value })}
              />
            </Field>
          </div>
        </Panel>

        {/* Feature toggles */}
        <Panel>
          <p className="mb-5 font-mono text-[10px] uppercase tracking-[0.3em] text-gold/80">Feature toggles</p>
          <div className="space-y-3">
            <ToggleRow
              title="Ambient audio system"
              description="Site-wide. Off = no background music + the mute control disappears."
              checked={s.audioEnabled}
              onCheckedChange={(v) => setS({ ...s, audioEnabled: v })}
            />
            <ToggleRow
              title="Video backgrounds"
              description="Site-wide. Off = heroes fall back to static art (also useful if an asset breaks)."
              checked={s.videoEnabled}
              onCheckedChange={(v) => setS({ ...s, videoEnabled: v })}
            />
          </div>
        </Panel>

        {/* Availability chip (footer trust strip) */}
        <Panel>
          <p className="mb-5 font-mono text-[10px] uppercase tracking-[0.3em] text-gold/80">Availability — footer chip</p>
          <Field
            label="Status line"
            hint="shown as a quiet chip in the footer · e.g. “Available for select projects” or “Not currently taking new projects” — leave empty to hide"
            htmlFor="s-availability"
          >
            <AdminInput
              id="s-availability"
              placeholder="Available for select projects"
              maxLength={120}
              value={s.availabilityStatus ?? ""}
              onChange={(e) => setS({ ...s, availabilityStatus: e.target.value })}
            />
          </Field>
        </Panel>

        {/* Asset manager */}
        <Panel>
          <p className="mb-5 font-mono text-[10px] uppercase tracking-[0.3em] text-gold/80">Asset manager</p>
          <div className="space-y-7">
            <Field label="Profile photo" hint="used on hero, about & contact">
              <AssetUpload kind="profile" value={s.profileImage} onChange={(url) => setS({ ...s, profileImage: url })} maxWidth={160} />
            </Field>
            <Field label="Ambient audio track" hint="mp3 ≤10MB">
              <AssetUpload kind="ambient" preview="audio" value={s.ambientAudio} onChange={(url) => setS({ ...s, ambientAudio: url })} />
            </Field>
            <Field label="Hero video loop" hint="mp4/webm ≤15MB · desktop only">
              <AssetUpload kind="video" preview="video" value={s.heroVideo} onChange={(url) => setS({ ...s, heroVideo: url })} />
            </Field>
            <Field label="Hero poster" hint="fallback still for mobile / reduced-motion">
              <AssetUpload kind="poster" value={s.heroPoster} onChange={(url) => setS({ ...s, heroPoster: url })} maxWidth={220} />
            </Field>
          </div>
        </Panel>

        {/* Socials */}
        <Panel>
          <p className="mb-5 font-mono text-[10px] uppercase tracking-[0.3em] text-gold/80">Social & platform links</p>
          <div className="space-y-3">
            {socials.map((row, i) => (
              <div key={i} className="grid gap-2.5 rounded-lg border border-white/8 bg-onyx-950/40 p-3.5 sm:grid-cols-[1fr_1fr_1.4fr_auto]">
                <AdminInput
                  value={row.label}
                  placeholder="Label"
                  aria-label="Label"
                  onChange={(e) => setSocials((p) => p.map((x, idx) => (idx === i ? { ...x, label: e.target.value } : x)))}
                />
                <AdminInput
                  value={row.platform}
                  placeholder="Platform"
                  aria-label="Platform"
                  onChange={(e) => setSocials((p) => p.map((x, idx) => (idx === i ? { ...x, platform: e.target.value } : x)))}
                />
                <AdminInput
                  value={row.href}
                  placeholder="https://…"
                  aria-label="URL"
                  onChange={(e) => setSocials((p) => p.map((x, idx) => (idx === i ? { ...x, href: e.target.value } : x)))}
                />
                <button
                  type="button"
                  aria-label="Remove link"
                  onClick={() => setSocials((p) => p.filter((_, idx) => idx !== i))}
                  className="flex h-10 w-10 items-center justify-center justify-self-end rounded-md border border-white/10 text-muted-foreground hover:border-red-500/40 hover:text-red-400"
                >
                  <X className="h-4 w-4" />
                </button>
                <AdminInput
                  value={row.note}
                  placeholder="Small note (e.g. Live desk)"
                  aria-label="Note"
                  className="sm:col-span-3"
                  onChange={(e) => setSocials((p) => p.map((x, idx) => (idx === i ? { ...x, note: e.target.value } : x)))}
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() => setSocials((p) => [...p, { label: "", platform: "", href: "", note: "" }])}
              className="inline-flex items-center gap-2 text-xs font-medium text-gold hover:underline"
            >
              <Plus className="h-3.5 w-3.5" /> Add link
            </button>
          </div>
        </Panel>

        {/* /now page */}
        <Panel>
          <div className="mb-1 flex items-baseline justify-between">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-gold/80">/now — current focus</p>
            {s.nowUpdatedAt && (
              <p className="font-mono text-[10px] text-muted-foreground">
                Last updated {new Date(s.nowUpdatedAt).toLocaleDateString()}
              </p>
            )}
          </div>
          <p className="mb-4 text-xs text-muted-foreground">
            Markdown. This is the honest, frequently-updated page — keep it short and current.
          </p>
          <AdminTextarea
            value={s.nowContent}
            onChange={(e) => setS({ ...s, nowContent: e.target.value })}
            className="min-h-64 font-mono text-[13px] leading-relaxed"
          />
        </Panel>

        {/* Portfolio deck */}
        <Panel>
          <p className="mb-5 font-mono text-[10px] uppercase tracking-[0.3em] text-gold/80">Portfolio deck</p>
          <p className="mb-4 text-xs text-muted-foreground">
            Multi-page PDF built from the live content — cover, duality, every published project, startup
            vision and contact. Regenerate after editing projects or socials.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <SaveButton pending={regen} onClick={regenerate} disabled={loading}>
              <RefreshCw className="h-4 w-4" /> {regen ? "Regenerating…" : "Regenerate deck"}
            </SaveButton>
            <a
              href="/portfolio/joseph-james-portfolio.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center gap-2 rounded-md border border-gold/40 px-5 text-sm font-medium text-gold transition-colors hover:bg-gold/10"
            >
              <Download className="h-4 w-4" /> Download current deck
            </a>
          </div>
        </Panel>

        <SaveButton
          pending={saving}
          onClick={() => save()}
          className="w-full sm:w-auto"
        >
          <Save className="h-4 w-4" /> Save settings
        </SaveButton>
      </div>
    </main>
  );
}
