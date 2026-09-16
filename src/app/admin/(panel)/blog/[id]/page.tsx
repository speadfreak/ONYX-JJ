"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Eye, ExternalLink, Save } from "lucide-react";
import ReactMarkdown from "react-markdown";
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
import { cn } from "@/lib/utils";

interface PostRow {
  id: string;
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  content: string;
  coverImage: string | null;
  readingMinutes: number;
  published: boolean;
}

const CATEGORIES = ["Dev Log", "Trading Insight", "Startup Notes"];

/** Prose styling shared with the public blog renderer (admin preview). */
export function MarkdownPreview({ content }: { content: string }) {
  return (
    <div className="prose-onyx">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}

export default function AdminBlogEditPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]!);
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [readingMinutes, setReadingMinutes] = useState(4);
  const [published, setPublished] = useState(false);
  const [found, setFound] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/posts");
        const data = (await res.json()) as { ok: boolean; posts: PostRow[] };
        const post = data.posts.find((p) => p.id === id);
        if (!post) return;
        setFound(true);
        setTitle(post.title);
        setSlug(post.slug);
        setCategory(post.category);
        setExcerpt(post.excerpt);
        setContent(post.content);
        setCoverImage(post.coverImage ?? "");
        setReadingMinutes(post.readingMinutes);
        setPublished(post.published);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const save = async () => {
    if (!title.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/posts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, slug, category, excerpt, content, coverImage, readingMinutes, published }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Save failed");
      toast({ title: "Post saved" });
    } catch (e) {
      toast({ title: "Save failed", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <main className="mx-auto max-w-5xl px-5 py-10 sm:px-8">Loading…</main>;
  if (!found) {
    return (
      <main className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
        <Panel>
          Post not found.{" "}
          <Link href="/admin/blog" className="text-gold hover:underline">
            Back to Journal
          </Link>
        </Panel>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-10">
      <AdminPageHeader
        title="Edit post"
        description="Markdown supported — headings, lists, blockquotes (render as pull-quotes), bold and links."
        actions={
          <div className="flex items-center gap-3">
            <Link
              href={`/blog/${slug}`}
              target="_blank"
              className="inline-flex h-10 items-center gap-2 rounded-md border border-white/10 px-4 text-sm text-foreground/80 transition-colors hover:border-gold/40 hover:text-gold"
            >
              <ExternalLink className="h-4 w-4" /> Preview live
            </Link>
            <SaveButton pending={saving} onClick={save}>
              <Save className="h-4 w-4" /> Save post
            </SaveButton>
          </div>
        }
      />

      <div className="space-y-6">
        <Panel>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Title" htmlFor="b-title">
              <AdminInput id="b-title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </Field>
            <Field label="Slug" hint="/blog/…" htmlFor="b-slug">
              <AdminInput id="b-slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
            </Field>
            <Field label="Category" htmlFor="b-cat">
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-pressed={category === c}
                    onClick={() => setCategory(c)}
                    className={cn(
                      "rounded-full border px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] transition-colors",
                      category === c ? "border-gold/60 bg-gold/10 text-gold" : "border-white/10 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Reading time" hint="minutes" htmlFor="b-min">
              <AdminInput
                id="b-min"
                type="number"
                min={1}
                max={60}
                value={readingMinutes}
                onChange={(e) => setReadingMinutes(parseInt(e.target.value, 10) || 1)}
              />
            </Field>
            <Field label="Excerpt" hint="card teaser" htmlFor="b-excerpt" className="sm:col-span-2">
              <AdminTextarea id="b-excerpt" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} className="min-h-16" />
            </Field>
          </div>

          <Field label="Cover image" hint="jpg/png/webp ≤5MB" className="mt-5">
            <AssetUpload kind="cover" value={coverImage} onChange={setCoverImage} maxWidth={280} />
          </Field>
        </Panel>

        <Panel>
          <div className="mb-4 flex items-center gap-2">
            {(["write", "preview"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                aria-pressed={tab === t}
                className={cn(
                  "inline-flex items-center gap-2 rounded-md px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition-colors",
                  tab === t ? "bg-gold/15 text-gold" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t === "write" ? "Write" : <><Eye className="h-3.5 w-3.5" /> Preview</>}
              </button>
            ))}
          </div>

          {tab === "write" ? (
            <AdminTextarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={"## Start with a story\n\nMarkdown **works** here.\n\n> Pull-quotes use blockquotes."}
              className="min-h-[26rem] font-mono text-[13px] leading-relaxed"
            />
          ) : (
            <div className="max-h-[26rem] overflow-y-auto rounded-lg border border-white/8 bg-onyx-950/60 p-6">
              <MarkdownPreview content={content} />
            </div>
          )}
        </Panel>

        <Panel className="flex flex-wrap items-center justify-between gap-4">
          <ToggleRow
            title={published ? "Published — live on /blog" : "Draft — hidden from visitors"}
            description="Publishing stamps the date shown on the public card."
            checked={published}
            onCheckedChange={setPublished}
            className="min-w-64 flex-1"
          />
          <SaveButton pending={saving} onClick={save}>
            <Save className="h-4 w-4" /> Save post
          </SaveButton>
        </Panel>

        <Link href="/admin/blog" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-gold">
          <ArrowLeft className="h-4 w-4" /> Back to Journal
        </Link>
      </div>
    </main>
  );
}
