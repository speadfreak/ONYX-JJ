import { db, ok } from "@/lib/admin-api";
import { requireAdmin } from "@/lib/auth";

/** GET /api/admin/activity — last 20 activity entries for the dashboard feed. */
export async function GET() {
  await requireAdmin();
  const [activity, unread] = await Promise.all([
    db.activityLog.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
    db.message.count({ where: { read: false, archived: false } }),
  ]);
  return ok({ activity, unread });
}
