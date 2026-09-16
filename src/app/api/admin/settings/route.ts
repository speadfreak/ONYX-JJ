import { db, ok, bad, asString, asBool, touched } from "@/lib/admin-api";
import { requireAdmin } from "@/lib/auth";

/**
 * Replace-cleanup (Phase 5 A4): when a settings asset field is swapped away
 * from an uploaded file, delete its Asset manifest row (bytes included) —
 * unless it is still referenced by another settings field, a project cover,
 * a blog cover, or a testimonial photo. Bundled defaults (/images, /audio)
 * are never touched. Uploads live in the DB (Asset.data), so cleanup is a
 * row delete — no filesystem involvement.
 */
const ASSET_FIELDS = ["profileImage", "ambientAudio", "heroVideo", "heroPoster"] as const;

type AssetField = (typeof ASSET_FIELDS)[number];

/** Bundled fallbacks — keep in sync with the SiteSetting column defaults. */
const ASSET_DEFAULTS: Record<AssetField, string> = {
  profileImage: "/images/jj-profile.jpg",
  ambientAudio: "/audio/ambient-theme.mp3",
  heroVideo: "",
  heroPoster: "/images/hero-bg.jpg",
};

/**
 * Self-healing dead asset references (Task 10):
 *
 * History left production settings pointing at /uploads/… paths whose files
 * were destroyed by Render's ephemeral filesystem — every render of the
 * admin form (and the public hero) then showed a broken image / placeholder
 * even after the DB-backed upload system shipped. Rather than asking JJ to
 * hand-edit rows, any asset field that references:
 *   • a legacy /uploads/… path with no DB row carrying real bytes, or
 *   • an /api/assets/<id> whose row is missing or byteless
 * is healed back to its bundled default on GET. Healing only ever fires in
 * the admin context, is idempotent, and deletes the stale manifest rows it
 * orphaned. Local dev uploads with real on-disk+DB bytes are never touched.
 */
async function assetRefIsDead(url: string): Promise<boolean> {
  if (!url.startsWith("/uploads/") && !url.startsWith("/api/assets/")) return false;
  const row = await db.asset.findFirst({
    where: { url },
    select: { data: true },
  });
  if (!row) return true;
  const bytes = row.data as unknown as Uint8Array | null;
  return !bytes || bytes.byteLength === 0;
}

async function healDeadAssetRefs(settings: {
  profileImage: string;
  ambientAudio: string;
  heroVideo: string;
  heroPoster: string;
}): Promise<{ settings: typeof settings; healed: string[] }> {
  const patched: Partial<Record<AssetField, string>> = {};
  const healed: string[] = [];

  for (const field of ASSET_FIELDS) {
    const url = settings[field];
    if (!url || !(await assetRefIsDead(url))) continue;
    patched[field] = ASSET_DEFAULTS[field];
    healed.push(field);
    await db.asset.deleteMany({ where: { url } }).catch(() => undefined);
  }

  if (!healed.length) return { settings, healed };

  const updated = await db.siteSetting.update({
    where: { id: "site" },
    data: patched as never,
  });
  await db.activityLog
    .create({
      data: {
        action: "Healed dead asset references",
        detail: `${healed.join(", ")} → bundled defaults (files no longer exist)`,
      },
    })
    .catch(() => undefined);
  return { settings: updated, healed };
}

async function cleanupReplacedAssets(oldValues: Record<AssetField, string>, newValues: Record<AssetField, string>) {
  for (const field of ASSET_FIELDS) {
    const oldUrl = oldValues[field];
    const newUrl = newValues[field];
    if (!oldUrl || oldUrl === newUrl) continue;
    if (!oldUrl.startsWith("/uploads/") && !oldUrl.startsWith("/api/assets/")) continue;

    const stillReferenced =
      ASSET_FIELDS.some((f) => f !== field && newValues[f] === oldUrl) ||
      (await db.project.count({ where: { image: oldUrl } })) > 0 ||
      (await db.blogPost.count({ where: { coverImage: oldUrl } })) > 0 ||
      (await db.testimonial.count({ where: { photo: oldUrl } })) > 0;
    if (stillReferenced) continue;

    await db.asset.deleteMany({ where: { url: oldUrl } });
  }
}

/** GET /api/admin/settings — the singleton site settings row, self-healed. */
export async function GET() {
  await requireAdmin();
  const current = await db.siteSetting.findUnique({ where: { id: "site" } });
  if (!current) return bad("Settings row missing — seed the database.", 500);

  const { settings, healed } = await healDeadAssetRefs(current).catch((e) => {
    console.error("[settings] asset heal:", e);
    return { settings: current, healed: [] as string[] };
  });
  return ok({ settings, healed });
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

  // Footer trust chip — editable availability line
  if ("availabilityStatus" in body) data.availabilityStatus = asString(body.availabilityStatus).slice(0, 120);

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
