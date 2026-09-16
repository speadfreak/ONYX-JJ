import { serveAsset } from "@/lib/serve-asset";

/**
 * GET /api/assets/[id]/[name] — cosmetic-filename variant of the asset
 * route. The trailing name (e.g. "ambient-1737000000000.wav") is ignored —
 * only the unguessable id selects the row — but it lets players that sniff
 * codecs from the URL (Howler.js) detect the format, which the bare
 * /api/assets/[id] form cannot. See src/lib/serve-asset.ts.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; name: string }> }
) {
  const { id } = await params;
  return serveAsset(id);
}
