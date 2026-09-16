import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { db } from "@/lib/db";
import { requireAdmin, logActivity } from "@/lib/auth";

/**
 * POST /api/admin/upload — multipart asset upload with strict validation.
 *   images: image/jpeg|png|webp   ≤ 5MB
 *   audio:  audio/mpeg            ≤ 10MB
 *   video:  video/mp4|webm        ≤ 15MB
 * Files land in /public/uploads (served statically) and are recorded in the
 * Asset manifest. Body: { file: File, kind: "profile"|"ambient"|"video"|"poster"|"cover"|"photo" }
 *
 * NOTE (Phase 5): this file was restored from git history — it had been
 * silently deleted by a bulk auto-commit (0963a47), which made every admin
 * asset upload 404. Restore-quality fix: verbatim recovery, no rewrites.
 */

const RULES: Record<string, { mimes: string[]; exts: string[]; maxBytes: number; label: string }> = {
  image: { mimes: ["image/jpeg", "image/png", "image/webp"], exts: [".jpg", ".jpeg", ".png", ".webp"], maxBytes: 5 * 1024 * 1024, label: "images (jpg/png/webp ≤ 5MB)" },
  audio: { mimes: ["audio/mpeg"], exts: [".mp3"], maxBytes: 10 * 1024 * 1024, label: "audio (mp3 ≤ 10MB)" },
  video: { mimes: ["video/mp4", "video/webm"], exts: [".mp4", ".webm"], maxBytes: 15 * 1024 * 1024, label: "video (mp4/webm ≤ 15MB)" },
};

const KIND_TO_RULE: Record<string, string> = {
  profile: "image",
  cover: "image",
  photo: "image",
  poster: "image",
  ambient: "audio",
  video: "video",
};

export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) {
    // Defense in depth: middleware already returns 401, but this route must not
    // depend on it (e.g. if the matcher ever changes).
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  try {
    // Cheap pre-parse size gate so oversize bodies fail with a clean 413 instead
    // of a truncated-body FormData parse error (500). Content-Length is
    // client-controlled, so the authoritative size check still runs after parse.
    const declared = Number(req.headers.get("content-length") ?? "0");
    const maxAny = 16 * 1024 * 1024;
    if (declared > maxAny) {
      return NextResponse.json({ ok: false, error: "File too large (max 15MB)." }, { status: 413 });
    }

    const form = await req.formData();
    const file = form.get("file");
    const kind = String(form.get("kind") ?? "cover");

    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "No file provided." }, { status: 400 });
    }
    const ruleKey = KIND_TO_RULE[kind];
    if (!ruleKey) {
      return NextResponse.json({ ok: false, error: "Unknown asset kind." }, { status: 400 });
    }
    const rule = RULES[ruleKey]!;

    if (!rule.mimes.includes(file.type)) {
      return NextResponse.json(
        { ok: false, error: `Invalid file type. Allowed: ${rule.label}.` },
        { status: 415 }
      );
    }
    if (file.size > rule.maxBytes) {
      return NextResponse.json(
        { ok: false, error: `File too large. Max: ${Math.round(rule.maxBytes / 1024 / 1024)}MB.` },
        { status: 413 }
      );
    }

    // Extension check (defense in depth — mime alone is client-controlled)
    const ext = path.extname(file.name).toLowerCase() || rule.exts[0]!;
    if (!rule.exts.includes(ext)) {
      return NextResponse.json(
        { ok: false, error: `Invalid extension "${ext}". Allowed: ${rule.exts.join(", ")}` },
        { status: 415 }
      );
    }

    // Magic-byte check (content sniffing — mime + extension can both be faked)
    const head = Buffer.from(await file.slice(0, 16).arrayBuffer());
    const magicOk =
      (file.type === "image/jpeg" && head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) ||
      (file.type === "image/png" && head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47) ||
      (file.type === "image/webp" && head.subarray(0, 4).toString("ascii") === "RIFF" && head.subarray(8, 12).toString("ascii") === "WEBP") ||
      (file.type === "audio/mpeg" && (head.subarray(0, 3).toString("ascii") === "ID3" || (head[0] === 0xff && (head[1] & 0xe0) === 0xe0))) ||
      (file.type === "video/webm" && head[0] === 0x1a && head[1] === 0x45 && head[2] === 0xdf && head[3] === 0xa3) ||
      (file.type === "video/mp4" && head.subarray(4, 8).toString("ascii") === "ftyp");
    if (!magicOk) {
      return NextResponse.json(
        { ok: false, error: "File content does not match its claimed type." },
        { status: 415 }
      );
    }

    // Safe filename: kind + timestamp + sanitized extension
    const safeName = `${kind}-${Date.now()}${ext}`;
    const dir = path.join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true }); // self-healing if the dir is ever missing
    const bytes = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(dir, safeName), bytes);

    const url = `/uploads/${safeName}`;
    const asset = await db.asset.create({
      data: { kind, filename: safeName, url, mime: file.type, size: file.size },
    });
    await logActivity("Uploaded asset", `${kind} · ${safeName} (${Math.round(file.size / 1024)}KB)`);

    return NextResponse.json({ ok: true, asset, url });
  } catch (e) {
    console.error("[admin/upload]", e);
    return NextResponse.json({ ok: false, error: "Upload failed." }, { status: 500 });
  }
}
