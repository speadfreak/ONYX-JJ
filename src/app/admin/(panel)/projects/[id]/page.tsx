"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ArrowDown, ArrowUp, ExternalLink, Plus, Save, X } from "lucide-react";
import {
  AdminInput,
  AdminPageHeader,
  AdminTextarea,
  Field,
  Panel,
  SaveButton,
  StatusBadge,
  ToggleRow,
} from "@/components/admin/kit";
import { AssetUpload } from "@/components/admin/asset-upload";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { CaseStudySection } from "@/lib/content";

interface ProjectRow {
  id: string;
  slug: string;
  title: string;
  amharic: string | null;
  tagline: string;
  hook: string;
  tags: string;
  year: string;
  role: string;
  image: string;
  accent: string;
  stats: string;
  stack: string | null;
  sections: string | null;
  published: boolean;
}

const DEMOS: { id: string; label: string }[] = [
  { id: "orderFlow", label: "Order-flow diagram" },
  { id: "ticket", label: "Live ticket demo" },
  { id: "broadcast", label: "Broadcast mockup" },
  { id: "cot", label: "COT bars" },
  { id: "tutor", label: "AI tutor demo" },
  { id: "checkin", label: "Check-in demo" },
  { id: "stack", label: "Stack chips" },
];

const TAG_OPTIONS = ["Fullstack", "AI", "Real-Time", "Trading"];

type Stat = { value: string; label: string };

function parse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export default function AdminProjectEditPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();

  const [row, setRow] = useState<ProjectRow | null>(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [amharic, setAmharic] = useState("");
  const [tagline, setTagline] = useState("");
  const [hook, setHook] = useState("");
  const [year, setYear] = useState("");
  const [role, setRole] = useState("");
  const [accent, setAccent] = useState("gold");
  const [tags, setTags] = useState<string[]>([]);
  const [image, setImage] = useState("");
  const [stats, setStats] = useState<Stat[]>([]);
  const [stack, setStack] = useState<string[]>([]);
  const [sections, setSections] = useState<CaseStudySection[]>([]);
  const [published, setPublished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/projects");
        const data = (await res.json()) as { ok: boolean; projects: ProjectRow[] };
        const found = data.projects.find((p) => p.id === id);
        if (!found) {
          toast({ title: "Project not found", variant: "destructive" });
          return;
        }
        setRow(found);
        setTitle(found.title);
        setSlug(found.slug);
        setAmharic(found.amharic ?? "");
        setTagline(found.tagline);
        setHook(found.hook);
        setYear(found.year);
        setRole(found.role);
        setAccent(found.accent);
        setTags(parse<string[]>(found.tags, []));
        setImage(found.image);
        setStats(parse<Stat[]>(found.stats, []));
        setStack(parse<string[]>(found.stack, []));
        setSections(parse<CaseStudySection[]>(found.sections, []));
        setPublished(found.published);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, toast]);

  const save = async () => {
    if (!title.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title, slug, amharic, tagline, hook, year, role, accent,
          tags, image, stats, stack, sections, published,
        }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Save failed");
      toast({ title: "Project saved", description: "Live on the public site immediately." });
    } catch (e) {
      toast({ title: "Save failed", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <main className="mx-auto max-w-5xl px-5 py-10 sm:px-8">Loading…</main>;
  if (!row) {
    return (
      <main className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
        <Panel>Project not found. <Link href="/admin/projects" className="text-gold hover:underline">Back to projects</Link></Panel>
      </main>
    );
  }

  const updateSection = (i: number, patch: Partial<CaseStudySection>) =>
    setSections((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));

  const moveSection = (i: number, dir: -1 | 1) =>
    setSections((prev) => {
      const next = [...prev];
      const j = i + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j]!, next[i]!];
      return next;
    });

  return (
    <main className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-10">
      <AdminPageHeader
        title="Edit project"
        description="Every field here feeds the public site instantly — cards, /work grid and the full case study."
        actions={
          <div className="flex items-center gap-3">
            <Link
              href={`/work/${slug}`}
              target="_blank"
              className="inline-flex h-10 items-center gap-2 rounded-md border border-white/10 px-4 text-sm text-foreground/80 transition-colors hover:border-gold/40 hover:text-gold"
            >
              <ExternalLink className="h-4 w-4" /> Preview
            </Link>
            <SaveButton pending={saving} onClick={save}>
              <Save className="h-4 w-4" /> Save project
            </SaveButton>
          </div>
        }
      />

      <div className="space-y-6">
        {/* ── Identity ── */}
        <Panel>
          <p className="mb-5 font-mono text-[10px] uppercase tracking-[0.3em] text-gold/80">Identity</p>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Title" htmlFor="p-title">
              <AdminInput id="p-title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </Field>
            <Field label="Slug" hint="URL path" htmlFor="p-slug">
              <AdminInput id="p-slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
            </Field>
            <Field label="Amharic name" hint="optional" htmlFor="p-amharic">
              <AdminInput id="p-amharic" value={amharic} onChange={(e) => setAmharic(e.target.value)} />
            </Field>
            <Field label="Year" htmlFor="p-year">
              <AdminInput id="p-year" value={year} onChange={(e) => setYear(e.target.value)} />
            </Field>
            <Field label="Tagline" hint="card one-liner" htmlFor="p-tagline" className="sm:col-span-2">
              <AdminInput id="p-tagline" value={tagline} onChange={(e) => setTagline(e.target.value)} />
            </Field>
            <Field label="Hook" hint="case-study intro" htmlFor="p-hook" className="sm:col-span-2">
              <AdminTextarea id="p-hook" value={hook} onChange={(e) => setHook(e.target.value)} />
            </Field>
            <Field label="Role" htmlFor="p-role">
              <AdminInput id="p-role" value={role} onChange={(e) => setRole(e.target.value)} />
            </Field>
            <Field label="Accent" htmlFor="p-accent">
              <div className="flex gap-2">
                {(["gold", "mint", "ice"] as const).map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setAccent(a)}
                    className={cn(
                      "rounded-md border px-4 py-2 font-mono text-xs uppercase tracking-[0.2em] transition-colors",
                      accent === a ? "border-gold bg-gold/15 text-gold" : "border-white/10 text-muted-foreground hover:text-foreground"
                    )}
                    aria-pressed={accent === a}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </Field>
          </div>

          <Field label="Tags" hint="click to toggle" className="mt-5">
            <div className="flex flex-wrap gap-2">
              {TAG_OPTIONS.map((t) => {
                const on = tags.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setTags((prev) => (on ? prev.filter((x) => x !== t) : [...prev, t]))}
                    className={cn(
                      "rounded-full border px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] transition-colors",
                      on ? "border-gold/60 bg-gold/10 text-gold" : "border-white/10 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </Field>
        </Panel>

        {/* ── Cover + stats ── */}
        <Panel>
          <p className="mb-5 font-mono text-[10px] uppercase tracking-[0.3em] text-gold/80">Cover & stats</p>
          <Field label="Cover image" hint="jpg/png/webp ≤5MB">
            <AssetUpload kind="cover" value={image} onChange={setImage} maxWidth={280} />
          </Field>

          <Field label="Stat callouts" hint="shown on cards & case-study hero" className="mt-6">
            <div className="space-y-2.5">
              {stats.map((s, i) => (
                <div key={i} className="flex gap-2.5">
                  <AdminInput
                    value={s.value}
                    placeholder="Value (e.g. <1s)"
                    onChange={(e) => setStats((p) => p.map((x, idx) => (idx === i ? { ...x, value: e.target.value } : x)))}
                    className="w-36 shrink-0"
                  />
                  <AdminInput
                    value={s.label}
                    placeholder="Label"
                    onChange={(e) => setStats((p) => p.map((x, idx) => (idx === i ? { ...x, label: e.target.value } : x)))}
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
                onClick={() => setStats((p) => [...p, { value: "", label: "" }])}
                className="inline-flex items-center gap-2 text-xs font-medium text-gold hover:underline"
              >
                <Plus className="h-3.5 w-3.5" /> Add stat
              </button>
            </div>
          </Field>
        </Panel>

        {/* ── Case study sections ── */}
        <Panel>
          <div className="mb-5 flex items-center justify-between">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-gold/80">Case-study sections</p>
            <button
              type="button"
              onClick={() =>
                setSections((p) => [...p, { title: "New Section", body: "", demos: [], statBar: null }])
              }
              className="inline-flex items-center gap-2 rounded-md border border-gold/40 bg-gold/10 px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-gold hover:bg-gold/20"
            >
              <Plus className="h-3.5 w-3.5" /> Add section
            </button>
          </div>

          <div className="space-y-4">
            {sections.map((s, i) => (
              <div key={i} className="rounded-xl border border-white/8 bg-onyx-950/40 p-4">
                <div className="mb-4 flex items-center gap-2">
                  <StatusBadge tone="muted">{String(i + 1).padStart(2, "0")}</StatusBadge>
                  <AdminInput
                    value={s.title}
                    placeholder="Section title"
                    onChange={(e) => updateSection(i, { title: e.target.value })}
                    className="flex-1"
                  />
                  <button type="button" aria-label="Move up" onClick={() => moveSection(i, -1)} className="flex h-9 w-9 items-center justify-center rounded-md border border-white/10 text-muted-foreground hover:text-gold">
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button type="button" aria-label="Move down" onClick={() => moveSection(i, 1)} className="flex h-9 w-9 items-center justify-center rounded-md border border-white/10 text-muted-foreground hover:text-gold">
                    <ArrowDown className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Delete section"
                    onClick={() => setSections((p) => p.filter((_, idx) => idx !== i))}
                    className="flex h-9 w-9 items-center justify-center rounded-md border border-white/10 text-muted-foreground hover:border-red-500/40 hover:text-red-400"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <AdminTextarea
                  value={s.body}
                  placeholder="Markdown supported — **bold**, > pull-quote, - lists. Leave empty for demo-only sections."
                  onChange={(e) => updateSection(i, { body: e.target.value })}
                  className="min-h-28"
                />

                <p className="mb-2 mt-4 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                  Live demo components
                </p>
                <div className="flex flex-wrap gap-2">
                  {DEMOS.map((d) => {
                    const on = s.demos.includes(d.id);
                    return (
                      <button
                        key={d.id}
                        type="button"
                        aria-pressed={on}
                        onClick={() =>
                          updateSection(i, {
                            demos: on ? s.demos.filter((x) => x !== d.id) : [...s.demos, d.id],
                          })
                        }
                        className={cn(
                          "rounded-full border px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.15em] transition-colors",
                          on ? "border-gold/60 bg-gold/10 text-gold" : "border-white/10 text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {d.label}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4">
                  <ToggleRow
                    title="Attach stat bar"
                    description={s.statBar ? `${s.statBar.stats.length} stats · ${s.statBar.accent}` : "Optional 4-up metric strip"}
                    checked={!!s.statBar}
                    onCheckedChange={(v) =>
                      updateSection(i, {
                        statBar: v ? { accent: accent as "gold" | "mint" | "ice", stats: [{ value: "", label: "" }, { value: "", label: "" }, { value: "", label: "" }, { value: "", label: "" }] } : null,
                      })
                    }
                  />
                  {s.statBar && (
                    <div className="mt-3 space-y-3 rounded-lg border border-white/8 p-3.5">
                      <div className="flex gap-2">
                        {(["gold", "mint", "ice"] as const).map((a) => (
                          <button
                            key={a}
                            type="button"
                            aria-pressed={s.statBar?.accent === a}
                            onClick={() => s.statBar && updateSection(i, { statBar: { ...s.statBar, accent: a } })}
                            className={cn(
                              "rounded-md border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em]",
                              s.statBar?.accent === a ? "border-gold bg-gold/15 text-gold" : "border-white/10 text-muted-foreground"
                            )}
                          >
                            {a}
                          </button>
                        ))}
                      </div>
                      {s.statBar.stats.map((st, si) => (
                        <div key={si} className="flex gap-2.5">
                          <AdminInput
                            value={st.value}
                            placeholder="Value"
                            onChange={(e) =>
                              s.statBar &&
                              updateSection(i, {
                                statBar: {
                                  ...s.statBar,
                                  stats: s.statBar.stats.map((x, idx) => (idx === si ? { ...x, value: e.target.value } : x)),
                                },
                              })
                            }
                            className="w-36 shrink-0"
                          />
                          <AdminInput
                            value={st.label}
                            placeholder="Label"
                            onChange={(e) =>
                              s.statBar &&
                              updateSection(i, {
                                statBar: {
                                  ...s.statBar,
                                  stats: s.statBar.stats.map((x, idx) => (idx === si ? { ...x, label: e.target.value } : x)),
                                },
                              })
                            }
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {sections.length === 0 && (
              <p className="text-sm text-muted-foreground">No sections yet — add the Problem/Solution/System/Stack/Impact arc.</p>
            )}
          </div>
        </Panel>

        {/* ── Stack chips ── */}
        <Panel>
          <Field label="Stack chips" hint="rendered by the “Stack chips” demo">
            <div className="space-y-2.5">
              {stack.map((chip, i) => (
                <div key={i} className="flex gap-2.5">
                  <AdminInput
                    value={chip}
                    onChange={(e) => setStack((p) => p.map((x, idx) => (idx === i ? e.target.value : x)))}
                  />
                  <button
                    type="button"
                    aria-label="Remove chip"
                    onClick={() => setStack((p) => p.filter((_, idx) => idx !== i))}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-white/10 text-muted-foreground hover:border-red-500/40 hover:text-red-400"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setStack((p) => [...p, ""])}
                className="inline-flex items-center gap-2 text-xs font-medium text-gold hover:underline"
              >
                <Plus className="h-3.5 w-3.5" /> Add chip
              </button>
            </div>
          </Field>
        </Panel>

        {/* ── Publish ── */}
        <Panel className="flex flex-wrap items-center justify-between gap-4">
          <ToggleRow
            title={published ? "Published — visible on the public site" : "Draft — hidden from visitors"}
            description="Drafts never appear on /work, home or case-study routes."
            checked={published}
            onCheckedChange={setPublished}
            className="min-w-64 flex-1"
          />
          <SaveButton pending={saving} onClick={save}>
            <Save className="h-4 w-4" /> Save project
          </SaveButton>
        </Panel>

        <Link href="/admin/projects" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-gold">
          <ArrowLeft className="h-4 w-4" /> Back to all projects
        </Link>
      </div>
    </main>
  );
}
