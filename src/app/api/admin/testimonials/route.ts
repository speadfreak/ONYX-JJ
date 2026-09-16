import { db, ok, bad, asString, asBool, asInt, touched } from "@/lib/admin-api";
import { requireAdmin } from "@/lib/auth";

/** GET /api/admin/testimonials — full list (incl. unpublished), ordered. */
export async function GET() {
  await requireAdmin();
  const testimonials = await db.testimonial.findMany({ orderBy: [{ order: "asc" }, { createdAt: "asc" }] });
  return ok({ testimonials });
}

/** POST /api/admin/testimonials */
export async function POST(req: Request) {
  await requireAdmin();
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  const name = asString(body.name).trim();
  const quote = asString(body.quote).trim();
  if (!name || !quote) return bad("Name and quote are required.");

  const count = await db.testimonial.count();

  const testimonial = await db.testimonial.create({
    data: {
      name: name.slice(0, 80),
      role: asString(body.role).slice(0, 120),
      quote: quote.slice(0, 600),
      photo: asString(body.photo) || null,
      order: asInt(body.order, count),
      published: asBool(body.published, true),
    },
  });

  await touched("Added testimonial", testimonial.name);
  return ok({ testimonial }, { status: 201 });
}
