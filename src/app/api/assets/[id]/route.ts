import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/assets/[id] — serve a DB-stored upload (image / audio / video).
 *
 * Uploaded assets live in the database (Asset.data — Postgres bytea) rather
 * than on disk: Render's container filesystem is ephemeral and the standalone
 * server's static file set is fixed at boot, so disk-based /uploads files
 * 404'd in production. This route is PUBLIC (assets render on the public
 * site); ids are unguessable random UUIDs created at upload time.
 *
 * Caching: every upload mints a new id, so responses are immutable — cache
 * hard on shared CDNs/browsers.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

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
