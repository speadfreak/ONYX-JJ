import { db, ok, bad, asString, asBool, asInt, slugify, touched } from "@/lib/admin-api";
import { requireAdmin } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };
const CATEGORIES = ["Dev Log", "Trading Insight", "Startup Notes"];

/** PATCH /api/admin/posts/[id] */
export async function PATCH(req: Request, ctx: Ctx) {
  await requireAdmin();
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  const current = await db.blogPost.findUnique({ where: { id } });
  if (!current) return bad("Post not found.", 404);

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
      const clash = await db.blogPost.findUnique({ where: { slug: nextSlug } });
      if (clash) return bad("A post with this slug already exists.", 409);
    }
    data.slug = nextSlug;
  }
  if ("category" in body && CATEGORIES.includes(asString(body.category))) data.category = asString(body.category);
  if ("excerpt" in body) data.excerpt = asString(body.excerpt).slice(0, 300);
  if ("content" in body) data.content = asString(body.content);
  if ("coverImage" in body) data.coverImage = asString(body.coverImage) || null;
  if ("readingMinutes" in body) data.readingMinutes = Math.min(60, Math.max(1, asInt(body.readingMinutes, current.readingMinutes)));
  if ("published" in body) {
    const pub = asBool(body.published, current.published);
    data.published = pub;
    // First publish stamps publishedAt; unpublish keeps the stamp for ordering.
    if (pub && !current.publishedAt) data.publishedAt = new Date();
  }

  const post = await db.blogPost.update({ where: { id }, data: data as never });
  await touched(data.published === false ? "Unpublished post" : "Updated post", post.title);
  return ok({ post });
}

/** DELETE /api/admin/posts/[id] */
export async function DELETE(_req: Request, ctx: Ctx) {
  await requireAdmin();
  const { id } = await ctx.params;
  const post = await db.blogPost.delete({ where: { id } }).catch(() => null);
  if (!post) return bad("Post not found.", 404);
  await touched("Deleted post", post.title);
  return ok({ deleted: post.id });
}
