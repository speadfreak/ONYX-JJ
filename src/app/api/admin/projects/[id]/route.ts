import { db, ok, bad, asString, asBool, asStringArray, asStats, statsArray, slugify, touched } from "@/lib/admin-api";
import { requireAdmin } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

/** PATCH /api/admin/projects/[id] — update any subset of fields. */
export async function PATCH(req: Request, ctx: Ctx) {
  await requireAdmin();
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  const current = await db.project.findUnique({ where: { id } });
  if (!current) return bad("Project not found.", 404);

  const data: Record<string, unknown> = {};

  if ("title" in body) {
    const title = asString(body.title).trim();
    if (!title) return bad("Title cannot be empty.");
    data.title = title;
  }
  if ("slug" in body || "title" in body) {
    const nextSlug = slugify(asString(body.slug, current.slug).trim() || asString(data.title as string, current.title));
    if (!nextSlug) return bad("Slug is required.");
    if (nextSlug !== current.slug) {
      const clash = await db.project.findUnique({ where: { slug: nextSlug } });
      if (clash) return bad("A project with this slug already exists.", 409);
    }
    data.slug = nextSlug;
  }
  if ("amharic" in body) data.amharic = asString(body.amharic).trim() || null;
  if ("tagline" in body) data.tagline = asString(body.tagline);
  if ("hook" in body) data.hook = asString(body.hook);
  if ("tags" in body) data.tags = JSON.stringify(asStringArray(body.tags));
  if ("year" in body) data.year = asString(body.year, current.year);
  if ("role" in body) data.role = asString(body.role, current.role);
  if ("image" in body) data.image = asString(body.image, current.image);
  if ("accent" in body && ["gold", "mint", "ice"].includes(asString(body.accent))) {
    data.accent = asString(body.accent);
  }
  if ("stats" in body) data.stats = asStats(body.stats);
  if ("stack" in body) data.stack = JSON.stringify(asStringArray(body.stack));
  if ("sections" in body && Array.isArray(body.sections)) {
    // Structured sections: { title, body (markdown), demos: string[], statBar? }
    const sections = (body.sections as unknown[])
      .filter((s): s is Record<string, unknown> => typeof s === "object" && s !== null)
      .slice(0, 12)
      .map((s) => ({
        title: asString(s.title).slice(0, 120),
        body: asString(s.body).slice(0, 20000),
        demos: asStringArray(s.demos).filter((d) =>
          ["orderFlow", "ticket", "broadcast", "cot", "tutor", "checkin", "stack"].includes(d)
        ),
        statBar:
          typeof s.statBar === "object" && s.statBar !== null
            ? (() => {
                const sb = s.statBar as Record<string, unknown>;
                const accent = ["gold", "mint", "ice"].includes(asString(sb.accent))
                  ? asString(sb.accent)
                  : "gold";
                return { accent, stats: statsArray(sb.stats) };
              })()
            : null,
      }));
    data.sections = JSON.stringify(sections);
  }
  if ("published" in body) data.published = asBool(body.published, current.published);

  const project = await db.project.update({ where: { id }, data: data as never });
  await touched(data.published === false ? "Unpublished project" : "Updated project", project.title);
  return ok({ project });
}

/** DELETE /api/admin/projects/[id] */
export async function DELETE(_req: Request, ctx: Ctx) {
  await requireAdmin();
  const { id } = await ctx.params;
  const project = await db.project.delete({ where: { id } }).catch(() => null);
  if (!project) return bad("Project not found.", 404);
  await touched("Deleted project", project.title);
  return ok({ deleted: project.id });
}
