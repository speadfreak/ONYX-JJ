import { db, ok } from "@/lib/admin-api";
import { requireAdmin } from "@/lib/auth";

/**
 * GET /api/admin/ai-insights — anonymized "Ask JJ" conversation intel.
 * What visitors are actually curious about, aggregated + recent snippets.
 * No PII: questions are stored as-typed but contain no identity fields.
 */

export async function GET() {
  await requireAdmin();

  const [total, byTopic, recent] = await Promise.all([
    db.aiChat.count(),
    db.aiChat.groupBy({
      by: ["topic"],
      _count: { _all: true },
      orderBy: { _count: { topic: "desc" } },
      take: 8,
    }),
    db.aiChat.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, question: true, topic: true, answer: true, createdAt: true },
    }),
  ]);

  return ok({
    total,
    topics: byTopic.map((t) => ({ topic: t.topic, count: t._count._all })),
    recent: recent.map((r) => ({
      id: r.id,
      question: r.question.slice(0, 200),
      topic: r.topic,
      answer: (r.answer ?? "").slice(0, 160),
      createdAt: r.createdAt.toISOString(),
    })),
  });
}
