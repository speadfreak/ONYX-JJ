import { db, ok, bad, asString, asStringArray, asHomeStats, touched } from "@/lib/admin-api";
import { requireAdmin } from "@/lib/auth";

/** GET /api/admin/home-content — the singleton home content row. */
export async function GET() {
  await requireAdmin();
  const content = await db.homeContent.findUnique({ where: { id: "home" } });
  return ok({ content });
}

const MAX = {
  kicker: 120,
  headline: 40,
  sub: 400,
  ctaLabel: 40,
  ctaHref: 200,
  featuredHeading: 140,
  featuredSub: 400,
};

/** PUT /api/admin/home-content — upsert the singleton. */
export async function PUT(req: Request) {
  await requireAdmin();
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  const roles = Array.isArray(body.roles)
    ? (body.roles as unknown[]).filter((r): r is string => typeof r === "string").map((r) => r.trim()).filter(Boolean).slice(0, 8)
    : null;

  const content = await db.homeContent.upsert({
    where: { id: "home" },
    create: { id: "home" },
    update: {},
  });

  const data: Record<string, unknown> = {};
  if ("kicker" in body) data.kicker = asString(body.kicker).slice(0, MAX.kicker);
  if ("headlineLine1" in body) data.headlineLine1 = asString(body.headlineLine1).slice(0, MAX.headline).toUpperCase();
  if ("headlineLine2" in body) data.headlineLine2 = asString(body.headlineLine2).slice(0, MAX.headline).toUpperCase();
  if (roles) data.roles = JSON.stringify(roles);
  if ("subheadline" in body) data.subheadline = asString(body.subheadline).slice(0, MAX.sub);
  if ("ctaPrimaryLabel" in body) data.ctaPrimaryLabel = asString(body.ctaPrimaryLabel).slice(0, MAX.ctaLabel);
  if ("ctaPrimaryHref" in body) data.ctaPrimaryHref = asString(body.ctaPrimaryHref).slice(0, MAX.ctaHref);
  if ("ctaSecondaryLabel" in body) data.ctaSecondaryLabel = asString(body.ctaSecondaryLabel).slice(0, MAX.ctaLabel);
  if ("ctaSecondaryHref" in body) data.ctaSecondaryHref = asString(body.ctaSecondaryHref).slice(0, MAX.ctaHref);
  if ("stats" in body) data.stats = asHomeStats(body.stats);
  if ("featuredHeading" in body) data.featuredHeading = asString(body.featuredHeading).slice(0, MAX.featuredHeading);
  if ("featuredSubheading" in body) data.featuredSubheading = asString(body.featuredSubheading).slice(0, MAX.featuredSub);

  const updated = await db.homeContent.update({ where: { id: content.id }, data: data as never });
  await touched("Updated home content");
  return ok({ content: updated });
}
