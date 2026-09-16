import { db, ok, bad, asString, asBool, touched } from "@/lib/admin-api";
import { requireAdmin } from "@/lib/auth";
import { unlink } from "fs/promises";
import path from "path";

/**
 * Replace-cleanup (Phase 5 A4): when a settings asset field is swapped away
 * from a local /uploads/ file, delete that file + its Asset manifest row —
 * unless it is still referenced by another settings field, a project cover,
 * a blog cover, or a testimonial photo. Bundled defaults (/images, /audio)
 * are never touched.
 */
const ASSET_FIELDS = ["profileImage", "ambientAudio", "heroVideo", "heroPoster"] as const;

type AssetField = (typeof ASSET_FIELDS)[number];

async function cleanupReplacedAssets(oldValues: Record<AssetField, string>, newValues: Record<AssetField, string>) {
  for (const field of ASSET_FIELDS) {
    const oldUrl = oldValues[field];
    const newUrl = newValues[field];
    if (!oldUrl || oldUrl === newUrl) continue;
    if (!oldUrl.startsWith("/uploads/")) continue;

    const stillReferenced =
      ASSET_FIELDS.some((f) => f !== field && newValues[f] === oldUrl) ||
      (await db.project.count({ where: { image: oldUrl } })) > 0 ||
      (await db.blogPost.count({ where: { coverImage: oldUrl } })) > 0 ||
      (await db.testimonial.count({ where: { photo: oldUrl } })) > 0;
    if (stillReferenced) continue;

    try {
      await unlink(path.join(process.cwd(), "public", oldUrl));
    } catch {
      // File already gone (or uploaded pre-restore) — the manifest row still goes.
    }
    await db.asset.deleteMany({ where: { url: oldUrl } });
  }
}

/** GET /api/admin/settings — the singleton site settings row. */
export async function GET() {
  await requireAdmin();
  const settings = await db.siteSetting.findUnique({ where: { id: "site" } });
  return ok({ settings });
}

/** PUT /api/admin/settings — update any subset. */
export async function PUT(req: Request) {
  await requireAdmin();
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  const current = await db.siteSetting.findUnique({ where: { id: "site" } });
  if (!current) return bad("Settings row missing — seed the database.", 500);

  const data: Record<string, unknown> = {};
  if ("liveStatus" in body) data.liveStatus = asBool(body.liveStatus, current.liveStatus);
  if ("liveUrl" in body) data.liveUrl = asString(body.liveUrl).slice(0, 300);
  if ("audioEnabled" in body) data.audioEnabled = asBool(body.audioEnabled, current.audioEnabled);
  if ("videoEnabled" in body) data.videoEnabled = asBool(body.videoEnabled, current.videoEnabled);
  if ("profileImage" in body) data.profileImage = asString(body.profileImage, current.profileImage).slice(0, 300);
  if ("ambientAudio" in body) data.ambientAudio = asString(body.ambientAudio, current.ambientAudio).slice(0, 300);
  if ("heroVideo" in body) data.heroVideo = asString(body.heroVideo).slice(0, 300);
  if ("heroPoster" in body) data.heroPoster = asString(body.heroPoster, current.heroPoster).slice(0, 300);
  if ("nowContent" in body) {
    data.nowContent = asString(body.nowContent).slice(0, 20000);
    data.nowUpdatedAt = new Date();
  }
  // v3 — "Current Market Bias" note shown next to the Market Pulse widget
  if ("marketBias" in body) data.marketBias = asString(body.marketBias).slice(0, 200);

  // Socials — structured validation: [{ label, platform, href, note }]
  if ("socials" in body && Array.isArray(body.socials)) {
    const socials = (body.socials as unknown[])
      .filter((s): s is Record<string, unknown> => typeof s === "object" && s !== null)
      .map((s) => ({
        label: asString(s.label).slice(0, 40),
        platform: asString(s.platform).slice(0, 40),
        href: asString(s.href).slice(0, 300),
        note: asString(s.note).slice(0, 60),
      }))
      .filter((s) => s.label && s.href)
      .slice(0, 10);
    data.socials = JSON.stringify(socials);
  }

  const settings = await db.siteSetting.update({ where: { id: "site" }, data: data as never });

  // Old local uploads that were just swapped out get cleaned up (see docblock).
  const before = Object.fromEntries(ASSET_FIELDS.map((f) => [f, current[f] ?? ""])) as Record<AssetField, string>;
  const after = Object.fromEntries(
    ASSET_FIELDS.map((f) => [f, (data[f] as string | undefined) ?? current[f] ?? ""])
  ) as Record<AssetField, string>;
  await cleanupReplacedAssets(before, after).catch((e) => console.error("[settings] asset cleanup:", e));

  await touched(
    data.liveStatus !== undefined
      ? asBool(data.liveStatus)
        ? "Went LIVE"
        : "Ended live status"
      : "Updated site settings"
  );
  return ok({ settings });
}
