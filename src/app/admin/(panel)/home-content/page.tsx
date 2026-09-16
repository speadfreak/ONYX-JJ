"use client";

import { useEffect, useState } from "react";
import { Plus, Save, X } from "lucide-react";
import {
  AdminInput,
  AdminPageHeader,
  AdminTextarea,
  Field,
  Panel,
  SaveButton,
} from "@/components/admin/kit";
import { useToast } from "@/hooks/use-toast";

interface HomeRow {
  kicker: string;
  headlineLine1: string;
  headlineLine2: string;
  roles: string;
  subheadline: string;
  ctaPrimaryLabel: string;
  ctaPrimaryHref: string;
  ctaSecondaryLabel: string;
  ctaSecondaryHref: string;
  stats: string;
  featuredHeading: string;
  featuredSubheading: string;
}

type Stat = { to: number; suffix?: string; label: string };

function parse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export default function AdminHomeContentPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    kicker: "",
    headlineLine1: "",
    headlineLine2: "",
    subheadline: "",
    ctaPrimaryLabel: "",
    ctaPrimaryHref: "",
    ctaSecondaryLabel: "",
    ctaSecondaryHref: "",
    featuredHeading: "",
    featuredSubheading: "",
  });
  const [roles, setRoles] = useState<string[]>([]);
  const [stats, setStats] = useState<Stat[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/home-content");
        const data = (await res.json()) as { ok: boolean; content: HomeRow | null };
        if (data.content) {
          const c = data.content;
          setForm({
            kicker: c.kicker,
            headlineLine1: c.headlineLine1,
            headlineLine2: c.headlineLine2,
            subheadline: c.subheadline,
            ctaPrimaryLabel: c.ctaPrimaryLabel,
            ctaPrimaryHref: c.ctaPrimaryHref,
            ctaSecondaryLabel: c.ctaSecondaryLabel,
            ctaSecondaryHref: c.ctaSecondaryHref,
            featuredHeading: c.featuredHeading,
            featuredSubheading: c.featuredSubheading,
          });
          setRoles(parse<string[]>(c.roles, []));
          setStats(parse<Stat[]>(c.stats, []));
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/home-content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, roles, stats }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Save failed");
      toast({ title: "Home content saved", description: "The public home page updates on the next visit." });
    } catch (e) {
      toast({ title: "Save failed", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <main className="mx-auto max-w-5xl px-5 py-10 sm:px-8">Loading…</main>;

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }));

  return (
    <main className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-10">
      <AdminPageHeader
        title="Home content"
        description="Hero headline, rotating roles, stats strip, CTAs and the featured-work intro — all mirrored live on /."
        actions={
          <SaveButton pending={saving} onClick={save}>
            <Save className="h-4 w-4" /> Save home content
          </SaveButton>
        }
      />

      <div className="space-y-6">
        <Panel>
          <p className="mb-5 font-mono text-[10px] uppercase tracking-[0.3em] text-gold/80">Hero</p>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Kicker" hint="small line above the name" htmlFor="h-kicker" className="sm:col-span-2">
              <AdminInput id="h-kicker" value={form.kicker} onChange={set("kicker")} />
            </Field>
            <Field label="Headline line 1" hint="auto-uppercased" htmlFor="h-l1">
              <AdminInput id="h-l1" value={form.headlineLine1} onChange={set("headlineLine1")} />
            </Field>
            <Field label="Headline line 2" hint="rendered in gold" htmlFor="h-l2">
              <AdminInput id="h-l2" value={form.headlineLine2} onChange={set("headlineLine2")} />
            </Field>
            <Field label="Subheadline" htmlFor="h-sub" className="sm:col-span-2">
              <AdminTextarea id="h-sub" value={form.subheadline} onChange={set("subheadline")} />
            </Field>
          </div>

          <Field label="Rotating roles" hint="one per line, cycles on the hero" className="mt-5">
            <div className="space-y-2.5">
              {roles.map((r, i) => (
                <div key={i} className="flex gap-2.5">
                  <AdminInput
                    value={r}
                    onChange={(e) => setRoles((p) => p.map((x, idx) => (idx === i ? e.target.value : x)))}
                  />
                  <button
                    type="button"
                    aria-label="Remove role"
                    onClick={() => setRoles((p) => p.filter((_, idx) => idx !== i))}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-white/10 text-muted-foreground hover:border-red-500/40 hover:text-red-400"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setRoles((p) => [...p, ""])}
                className="inline-flex items-center gap-2 text-xs font-medium text-gold hover:underline"
              >
                <Plus className="h-3.5 w-3.5" /> Add role
              </button>
            </div>
          </Field>
        </Panel>

        <Panel>
          <p className="mb-5 font-mono text-[10px] uppercase tracking-[0.3em] text-gold/80">Stats strip</p>
          <Field label="Counting stats" hint="numbers count up on scroll">
            <div className="space-y-2.5">
              {stats.map((s, i) => (
                <div key={i} className="flex flex-wrap gap-2.5">
                  <AdminInput
                    type="number"
                    value={s.to}
                    onChange={(e) =>
                      setStats((p) => p.map((x, idx) => (idx === i ? { ...x, to: parseInt(e.target.value, 10) || 0 } : x)))
                    }
                    className="w-24 shrink-0"
                    aria-label="Number"
                  />
                  <AdminInput
                    value={s.suffix ?? ""}
                    placeholder="Suffix (+, %)"
                    onChange={(e) => setStats((p) => p.map((x, idx) => (idx === i ? { ...x, suffix: e.target.value || undefined } : x)))}
                    className="w-28 shrink-0"
                    aria-label="Suffix"
                  />
                  <AdminInput
                    value={s.label}
                    placeholder="Label"
                    onChange={(e) => setStats((p) => p.map((x, idx) => (idx === i ? { ...x, label: e.target.value } : x)))}
                    className="min-w-40 flex-1"
                    aria-label="Label"
                  />
                  <button
                    type="button"
                    aria-label="Remove stat"
                    onClick={() => setStats((p) => p.filter((_, idx) => idx !== i))}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-white/10 text-muted-foreground hover:border-red-500/40 hover:text-red-400"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setStats((p) => [...p, { to: 0, label: "" }])}
                className="inline-flex items-center gap-2 text-xs font-medium text-gold hover:underline"
              >
                <Plus className="h-3.5 w-3.5" /> Add stat
              </button>
            </div>
          </Field>
        </Panel>

        <Panel>
          <p className="mb-5 font-mono text-[10px] uppercase tracking-[0.3em] text-gold/80">CTAs & featured intro</p>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Primary CTA label" htmlFor="h-cp">
              <AdminInput id="h-cp" value={form.ctaPrimaryLabel} onChange={set("ctaPrimaryLabel")} />
            </Field>
            <Field label="Primary CTA link" htmlFor="h-cph">
              <AdminInput id="h-cph" value={form.ctaPrimaryHref} onChange={set("ctaPrimaryHref")} />
            </Field>
            <Field label="Secondary CTA label" htmlFor="h-cs">
              <AdminInput id="h-cs" value={form.ctaSecondaryLabel} onChange={set("ctaSecondaryLabel")} />
            </Field>
            <Field label="Secondary CTA link" htmlFor="h-csh">
              <AdminInput id="h-csh" value={form.ctaSecondaryHref} onChange={set("ctaSecondaryHref")} />
            </Field>
            <Field label="Featured heading" htmlFor="h-fh" className="sm:col-span-2">
              <AdminInput id="h-fh" value={form.featuredHeading} onChange={set("featuredHeading")} />
            </Field>
            <Field label="Featured subheading" htmlFor="h-fs" className="sm:col-span-2">
              <AdminTextarea id="h-fs" value={form.featuredSubheading} onChange={set("featuredSubheading")} />
            </Field>
          </div>
        </Panel>

        <SaveButton pending={saving} onClick={save} className="w-full sm:w-auto">
          <Save className="h-4 w-4" /> Save home content
        </SaveButton>
      </div>
    </main>
  );
}
