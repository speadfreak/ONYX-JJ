import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Shared serving logic for uploaded assets (Task 11).
 *
 * Uploaded files live in the database (Asset.data — Postgres bytea) because
 * Render's filesystem is ephemeral and the standalone server's static file
 * set is fixed at boot — anything written to disk at runtime 404'd.
 *
 * Two routes expose the same bytes:
 *   GET /api/assets/[id]           — the original extension-less form
 *   GET /api/assets/[id]/[name]    — cosmetic-filename form (e.g. …/x.wav)
 *
 * The [name] form exists for players that sniff the codec from the URL:
 * Howler.js refuses to load extension-less sources ("No file extension was
 * found"), so every NEW upload mints URLs that end in the real extension
 * while the id stays the unguessable secret.
 *
 * Caching: every upload mints a new id, so responses are immutable — cache
 * hard on shared CDNs/browsers.
 */
export async function serveAsset(id: string): Promise<NextResponse> {
  if (!id || id.length > 64 || !/^[0-9a-f-]+$/i.test(id)) {
    return NextResponse.json({ ok: false, error: "Invalid asset id." }, { status: 400 });
  }

  const asset = await db.asset.findUnique({
    where: { id },
    select: { data: true, mime: true, size: true, filename: true },
  });

  if (!asset) {
    return NextResponse.json({ ok: false, error: "Asset not found." }, { status: 404 });
  }

  const body = asset.data as unknown as Uint8Array;

  return new NextResponse(body as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": asset.mime || "application/octet-stream",
      "Content-Length": String(body.byteLength ?? asset.size ?? 0),
      "Content-Disposition": `inline; filename="${asset.filename.replace(/"/g, "")}"`,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
