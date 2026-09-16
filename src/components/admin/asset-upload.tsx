"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, UploadCloud } from "lucide-react";
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
 * Asset upload/replace widget. Uploads through /api/admin/upload (which
 * validates type + size server-side) and hands the resulting URL to onChange.
 */
export function AssetUpload({
  kind,
  value,
  onChange,
  label = "Replace",
  preview = "image",
  maxWidth = 220,
}: {
  kind: "profile" | "cover" | "photo" | "poster" | "ambient" | "video";
  value: string;
  onChange: (url: string) => void;
  label?: string;
  preview?: "image" | "audio" | "video" | "none";
  maxWidth?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const { toast } = useToast();

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
      toast({ title: "Asset uploaded" });
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex flex-wrap items-start gap-4">
      {preview === "image" && value && (
        <div
          className="relative overflow-hidden rounded-lg border border-white/10 bg-onyx-950"
          style={{ width: maxWidth, height: Math.round(maxWidth * 0.62) }}
        >
          { }
          <img src={value} alt="Current asset" className="h-full w-full object-cover" />
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
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={pending}
          className="inline-flex h-9 items-center gap-2 rounded-md border border-gold/40 bg-gold/10 px-4 text-xs font-semibold uppercase tracking-[0.15em] text-gold transition-colors hover:bg-gold/20 disabled:opacity-60"
        >
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UploadCloud className="h-3.5 w-3.5" />}
          {pending ? "Uploading…" : label}
        </button>
        <p className="text-[11px] leading-snug text-muted-foreground">
          {kind === "ambient"
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
