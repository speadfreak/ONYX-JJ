import { db, ok } from "@/lib/admin-api";
import { requireAdmin } from "@/lib/auth";

/** GET /api/admin/gem-count — site-wide easter-egg counter for the dashboard. */
export async function GET() {
  await requireAdmin();
  const count = await db.eventLog.count({ where: { type: "gem" } });
  return ok({ count });
}
