import { db, ok, bad, asString, asBool, asStringArray, asStats, slugify, touched } from "@/lib/admin-api";
import { requireAdmin } from "@/lib/auth";

/** GET /api/admin/projects — full list (incl. drafts), ordered. */
export async function GET() {
  await requireAdmin();
  const projects = await db.project.findMany({ orderBy: [{ order: "asc" }, { createdAt: "asc" }] });
  return ok({ projects });
}

/** POST /api/admin/projects — create a draft project. */
export async function POST(req: Request) {
  await requireAdmin();
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  const title = asString(body.title).trim();
  if (!title) return bad("Title is required.");

  const slug = slugify(asString(body.slug).trim() || title);
  if (!slug) return bad("Slug is required.");
  const existing = await db.project.findUnique({ where: { slug } });
  if (existing) return bad("A project with this slug already exists.", 409);

  const count = await db.project.count();

  const project = await db.project.create({
    data: {
      slug,
      title,
      tagline: asString(body.tagline, "Short one-line hook for the card."),
      hook: asString(body.hook, taglineFallback()),
      tags: JSON.stringify(asStringArray(body.tags)),
      year: asString(body.year, String(new Date().getFullYear())),
      role: asString(body.role, "Founder & Engineer"),
      image: asString(body.image, "/images/hero-bg.jpg"),
      accent: ["gold", "mint", "ice"].includes(asString(body.accent)) ? asString(body.accent) : "gold",
      stats: asStats(body.stats),
      published: asBool(body.published, false),
      order: count,
    },
  });

  await touched("Created project", project.title);
  return ok({ project }, { status: 201 });
}

function taglineFallback() {
  return "A few lines about what this system does and why it matters.";
}
