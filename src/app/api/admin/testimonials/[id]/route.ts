import { db, ok, bad, asString, asBool, asInt, touched } from "@/lib/admin-api";
import { requireAdmin } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

/** PATCH /api/admin/testimonials/[id] */
export async function PATCH(req: Request, ctx: Ctx) {
  await requireAdmin();
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  const current = await db.testimonial.findUnique({ where: { id } });
  if (!current) return bad("Testimonial not found.", 404);

  const data: Record<string, unknown> = {};
  if ("name" in body) {
    const name = asString(body.name).trim().slice(0, 80);
    if (!name) return bad("Name cannot be empty.");
    data.name = name;
  }
  if ("role" in body) data.role = asString(body.role).slice(0, 120);
  if ("quote" in body) {
    const quote = asString(body.quote).trim().slice(0, 600);
    if (!quote) return bad("Quote cannot be empty.");
    data.quote = quote;
  }
  if ("photo" in body) data.photo = asString(body.photo) || null;
  if ("order" in body) data.order = asInt(body.order, current.order);
  if ("published" in body) data.published = asBool(body.published, current.published);

  const testimonial = await db.testimonial.update({ where: { id }, data: data as never });
  await touched("Updated testimonial", testimonial.name);
  return ok({ testimonial });
}

/** DELETE /api/admin/testimonials/[id] */
export async function DELETE(_req: Request, ctx: Ctx) {
  await requireAdmin();
  const { id } = await ctx.params;
  const testimonial = await db.testimonial.delete({ where: { id } }).catch(() => null);
  if (!testimonial) return bad("Testimonial not found.", 404);
  await touched("Deleted testimonial", testimonial.name);
  return ok({ deleted: testimonial.id });
}
