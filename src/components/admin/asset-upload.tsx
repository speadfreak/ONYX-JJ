"use client";

import { useEffect, useRef, useState } from "react";
import { CircleCheck, ImageOff, ImagePlus, Loader2, UploadCloud } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ACCEPT: Record<string, string> = {
  profile: "image/jpeg,image/png,image/webp",
  cover: "image/jpeg,image/png,image/webp",
  photo: "image/jpeg,image/png,image/webp",
  poster: "image/jpeg,image/png,image/webp",
  ambient: "audio/mpeg",
  video: "video/mp4,video/webm",
};

/**
 * Asset upload/replace widget.
 *
 * Uploads through /api/admin/upload (which validates type + size server-side)
 * and hands the resulting URL to onChange.
 *
 * `onUploaded` — OPTIONAL persistence hook. If provided, it is awaited right
 * after a successful upload (e.g. the settings page immediately PUTs the new
 * URL) and the widget surfaces the full lifecycle: Uploading… → Applying… →
 * Applied ✓. This exists because the #1 asset bug was exactly here: the
 * upload succeeded, the toast said "uploaded", but the URL only lived in
 * local form state until a separate Save button was clicked — which looked
 * like "replace doesn't work, it shows only the name". With onUploaded the
 * change is durable the moment the file picker closes.
 *
 * Broken-asset guard: if the current value fails to render (e.g. a legacy
 * /uploads/… path whose file no longer exists on ephemeral hosting), the
 * image preview shows an explicit "missing asset" placeholder instead of the
 * browser's broken-image glyph, so it's obvious the asset must be replaced.
 */
export function AssetUpload({
  kind,
  value,
  onChange,
  onUploaded,
  label = "Replace",
  preview = "image",
  maxWidth = 220,
}: {
  kind: "profile" | "cover" | "photo" | "poster" | "ambient" | "video";
  value: string;
  onChange: (url: string) => void;
  onUploaded?: (url: string) => Promise<void> | void;
  label?: string;
  preview?: "image" | "audio" | "video" | "none";
  maxWidth?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const { toast } = useToast();

  /* A fresh value (upload applied / settings reloaded) resets the broken-image state. */
  useEffect(() => setImgFailed(false), [value]);
  /* "Applied ✓" flashes briefly, then the chip fades back out. */
  useEffect(() => {
    if (!applied) return;
    const t = setTimeout(() => setApplied(false), 2600);
    return () => clearTimeout(t);
  }, [applied]);

  const upload = async (file: File) => {
    setPending(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("kind", kind);
      const res = await fetch("/api/admin/upload", { method: "POST", body: form });
      const data = (await res.json()) as { ok: boolean; url?: string; error?: string };
      if (!res.ok || !data.ok || !data.url) {
        toast({ title: "Upload rejected", description: data.error ?? "Unknown error", variant: "destructive" });
        return;
      }
      onChange(data.url);
      if (onUploaded) {
        /* Persist immediately — never leave the new asset stranded in form state. */
        setApplying(true);
        try {
          await onUploaded(data.url);
          setApplied(true);
        } catch (e) {
          toast({
            title: "Uploaded but not applied",
            description: (e as Error).message || "Persisting the new asset failed — press Save.",
            variant: "destructive",
          });
        } finally {
          setApplying(false);
        }
      } else {
        toast({ title: "Asset uploaded" });
      }
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setPending(false);
    }
  };

  const busy = pending || applying;

  return (
    <div className="flex flex-wrap items-start gap-4">
      {preview === "image" && value && (
        <div
          className="relative overflow-hidden rounded-lg border border-white/10 bg-onyx-950"
          style={{ width: maxWidth, height: Math.round(maxWidth * 0.62) }}
        >
          {imgFailed ? (
            <div
              role="img"
              aria-label="Current asset failed to load — replace it"
              className="flex h-full w-full flex-col items-center justify-center gap-1.5 border border-dashed border-gold/30 bg-gold/[0.04] text-center"
            >
              <ImageOff className="h-5 w-5 text-gold/60" aria-hidden />
              <p className="px-3 text-[10px] leading-snug text-muted-foreground">
                Asset missing — replace it
              </p>
            </div>
          ) : (
            <img
              src={value}
              alt="Current asset"
              className="h-full w-full object-cover"
              onError={() => setImgFailed(true)}
            />
          )}
        </div>
      )}
      {preview === "audio" && (
        <div className="min-w-56 flex-1 rounded-lg border border-white/10 bg-onyx-950 p-3">
          {value ? (
            <audio controls src={value} className="w-full" preload="none" />
          ) : (
            <p className="py-2 text-center text-xs text-muted-foreground">No audio set</p>
          )}
        </div>
      )}
      {preview === "video" && (
        <div className="min-w-56 flex-1 rounded-lg border border-white/10 bg-onyx-950 p-3">
          {value ? (
            <video controls src={value} className="w-full rounded" preload="metadata" />
          ) : (
            <p className="py-2 text-center text-xs text-muted-foreground">Using bundled hero-loop files</p>
          )}
        </div>
      )}

      <div className="flex flex-col items-start gap-2">
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT[kind]}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void upload(f);
            e.target.value = "";
          }}
        />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-gold/40 bg-gold/10 px-4 text-xs font-semibold uppercase tracking-[0.15em] text-gold transition-colors hover:bg-gold/20 disabled:opacity-60"
          >
            {pending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : applying ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <UploadCloud className="h-3.5 w-3.5" />
            )}
            {pending ? "Uploading…" : applying ? "Applying…" : label}
          </button>
          {applied && (
            <span
              role="status"
              className="inline-flex items-center gap-1.5 rounded-full border border-mint/40 bg-mint/10 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-mint"
            >
              <CircleCheck className="h-3.5 w-3.5" aria-hidden /> Applied
            </span>
          )}
        </div>
        <p className="text-[11px] leading-snug text-muted-foreground">
          {onUploaded
            ? kind === "ambient"
              ? "mp3 · max 10MB · applies instantly"
              : kind === "video"
                ? "mp4 / webm · max 15MB · applies instantly"
                : "jpg / png / webp · max 5MB · applies instantly"
            : kind === "ambient"
              ? "mp3 · max 10MB"
              : kind === "video"
                ? "mp4 / webm · max 15MB"
                : "jpg / png / webp · max 5MB"}
        </p>
      </div>
    </div>
  );
}

/** Icon-only hint (used in empty states). */
export function AssetHint() {
  return <ImagePlus className="h-4 w-4 text-muted-foreground" aria-hidden />;
}
