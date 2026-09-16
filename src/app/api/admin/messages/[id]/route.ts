import { db, ok, bad, asBool, touched } from "@/lib/admin-api";
import { requireAdmin } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

/** PATCH /api/admin/messages/[id] — { read?, archived? } */
export async function PATCH(req: Request, ctx: Ctx) {
  await requireAdmin();
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  const current = await db.message.findUnique({ where: { id } });
  if (!current) return bad("Message not found.", 404);

  const data: Record<string, unknown> = {};
  if ("read" in body) data.read = asBool(body.read, current.read);
  if ("archived" in body) data.archived = asBool(body.archived, current.archived);

  const message = await db.message.update({ where: { id }, data: data as never });
  return ok({ message });
}

/** DELETE /api/admin/messages/[id] */
export async function DELETE(_req: Request, ctx: Ctx) {
  await requireAdmin();
  const { id } = await ctx.params;
  const message = await db.message.delete({ where: { id } }).catch(() => null);
  if (!message) return bad("Message not found.", 404);
  await touched("Deleted message", `${message.name} <${message.email}>`);
  return ok({ deleted: id });
}
