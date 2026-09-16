import { db, ok, bad, asStringArray, touched } from "@/lib/admin-api";
import { requireAdmin } from "@/lib/auth";

/** POST /api/admin/projects/reorder — body: { ids: string[] } in the new order. */
export async function POST(req: Request) {
  await requireAdmin();
  const body = (await req.json().catch(() => ({}))) as { ids?: unknown };
  const ids = asStringArray(body.ids);
  if (!ids.length) return bad("ids array is required.");

  const projects = await db.project.findMany({ select: { id: true } });
  const known = new Set(projects.map((p) => p.id));
  if (!ids.every((id) => known.has(id))) return bad("Unknown project id in list.", 400);

  await db.$transaction(ids.map((id, i) => db.project.update({ where: { id }, data: { order: i } })));
  await touched("Reordered projects", `${ids.length} projects`);
  return ok({ reordered: ids.length });
}
