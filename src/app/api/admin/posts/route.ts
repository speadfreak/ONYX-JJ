import { db, ok, bad, asString, asBool, asInt, slugify, touched } from "@/lib/admin-api";
import { requireAdmin } from "@/lib/auth";

const CATEGORIES = ["Dev Log", "Trading Insight", "Startup Notes"];

/** GET /api/admin/posts — full list (incl. drafts), newest first. */
export async function GET() {
  await requireAdmin();
  const posts = await db.blogPost.findMany({ orderBy: { createdAt: "desc" } });
  return ok({ posts });
}

/** POST /api/admin/posts — create a draft post. */
export async function POST(req: Request) {
  await requireAdmin();
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  const title = asString(body.title).trim();
  if (!title) return bad("Title is required.");

  const slug = slugify(asString(body.slug).trim() || title);
  if (!slug) return bad("Slug is required.");
  if (await db.blogPost.findUnique({ where: { slug } })) {
    return bad("A post with this slug already exists.", 409);
  }

  const category = CATEGORIES.includes(asString(body.category)) ? asString(body.category) : "Dev Log";

  const post = await db.blogPost.create({
    data: {
      slug,
      title,
      category,
      excerpt: asString(body.excerpt).slice(0, 300),
      content: asString(body.content, "Start writing…"),
      coverImage: asString(body.coverImage) || null,
      readingMinutes: Math.min(60, Math.max(1, asInt(body.readingMinutes, 4))),
      published: asBool(body.published, false),
      publishedAt: asBool(body.published, false) ? new Date() : null,
    },
  });

  await touched("Created blog post", post.title);
  return ok({ post }, { status: 201 });
}
