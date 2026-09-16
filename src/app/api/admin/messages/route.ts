import { db, ok, asString, touched } from "@/lib/admin-api";
import { requireAdmin } from "@/lib/auth";

/** GET /api/admin/messages — inbox, newest first. Query: ?filter=all|unread|archived */
export async function GET(req: Request) {
  await requireAdmin();
  const filter = asString(new URL(req.url).searchParams.get("filter"), "all");

  const where =
    filter === "unread"
      ? { read: false, archived: false }
      : filter === "archived"
        ? { archived: true }
        : {};

  const [messages, unread, total] = await Promise.all([
    db.message.findMany({ where, orderBy: { createdAt: "desc" }, take: 200 }),
    db.message.count({ where: { read: false, archived: false } }),
    db.message.count({ where: { archived: false } }),
  ]);

  return ok({ messages, unread, total });
}

/** DELETE /api/admin/messages?id=… is on [id]; this route also allows bulk-mark-read. */
export async function POST() {
  await requireAdmin();
  await db.message.updateMany({ where: { read: false, archived: false }, data: { read: true } });
  await touched("Marked all messages read");
  return ok({ done: true });
}
