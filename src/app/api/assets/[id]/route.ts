import { serveAsset } from "@/lib/serve-asset";

/**
 * GET /api/assets/[id] — serve a DB-stored upload (image / audio / video).
 * Public: assets render on the public site; ids are unguessable UUIDs.
 * See src/lib/serve-asset.ts for the storage rationale and cache policy.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return serveAsset(id);
}
