import { db, ok, bad } from "@/lib/admin-api";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";

/**
 * GET /api/admin/analytics?days=7|30
 *
 * One payload powering the /admin/analytics dashboard. Every query is bounded
 * by the window [start-of-day N-1 days ago → now]. Aggregate counts only —
 * anonymous, privacy-respecting (no PII is ever stored in EventLog/AiChat).
 */

type Days = 7 | 30;
type DayBucket = { day: string; count: number };
type NamedCount = { name: string; count: number };

const REFERRER_CLASSES = ["direct", "search", "social", "other"] as const;
type ReferrerClass = (typeof REFERRER_CLASSES)[number];

function parseDays(v: string | null): Days | null {
  if (v === null || v === "") return 7;
  if (v === "7") return 7;
  if (v === "30") return 30;
  return null;
}

/** Start of the window: local midnight, days-1 days back (window covers N day-buckets). */
function windowStart(days: Days): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - (days - 1));
  return d;
}

/** "MM-DD" local day key. */
function dayKey(d: Date): string {
  return `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Bucket createdAt dates into N consecutive day buckets (oldest → today). */
function bucketByDay(dates: Date[], days: Days): DayBucket[] {
  const noon = new Date();
  noon.setHours(12, 0, 0, 0); // noon anchor avoids DST boundary edges
  const counts = new Map<string, number>();
  const order: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(noon);
    d.setDate(d.getDate() - i);
    const key = dayKey(d);
    order.push(key);
    counts.set(key, 0);
  }
  for (const date of dates) {
    const key = dayKey(date);
    const cur = counts.get(key);
    if (cur !== undefined) counts.set(key, cur + 1);
  }
  return order.map((day) => ({ day, count: counts.get(day) ?? 0 }));
}

function topNamed(groups: { key: string; count: number }[], limit: number): NamedCount[] {
  return groups
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map((g) => ({ name: g.key, count: g.count }));
}

/**
 * AiChat reads, isolated defensively: if the Ask JJ widget (Task 3-5) hasn't
 * landed / the running client predates the model, analytics must still answer
 * with empty AI sections instead of a 500.
 */
async function aiStats(since: Date) {
  try {
    const [total, topicGroups, recentRows] = await Promise.all([
      db.aiChat.count({ where: { createdAt: { gte: since } } }),
      db.aiChat.groupBy({
        by: ["topic"],
        where: { createdAt: { gte: since } },
        _count: { topic: true },
      }),
      db.aiChat.findMany({
        where: { createdAt: { gte: since } },
        orderBy: { createdAt: "desc" },
        take: 8,
        select: { question: true, topic: true, createdAt: true },
      }),
    ]);
    return {
      total,
      topics: topNamed(
        topicGroups.map((g) => ({ key: g.topic, count: g._count.topic })),
        6
      ),
      recent: recentRows.map((r) => ({
        question: r.question.length > 120 ? `${r.question.slice(0, 120)}…` : r.question,
        topic: r.topic,
        createdAt: r.createdAt,
      })),
    };
  } catch {
    return {
      total: 0,
      topics: [] as NamedCount[],
      recent: [] as { question: string; topic: string; createdAt: Date }[],
    };
  }
}

export async function GET(req: Request) {
  const session = await requireAdmin();
  if (!session) return bad("Unauthorized", 401);

  const days = parseDays(new URL(req.url).searchParams.get("days"));
  if (days === null) return bad("Invalid ?days — use 7 or 30.", 400);

  const since = windowStart(days);

  const [
    pageviews,
    paletteUses,
    gemClicks,
    contactMessages,
    pageviewRows,
    contactRows,
    routeGroups,
    referrerGroups,
    paletteGroups,
    ai,
  ] = await Promise.all([
    db.eventLog.count({ where: { type: "pageview", createdAt: { gte: since } } }),
    db.eventLog.count({ where: { type: "palette", createdAt: { gte: since } } }),
    db.eventLog.count({ where: { type: "gem", createdAt: { gte: since } } }),
    db.message.count({ where: { createdAt: { gte: since } } }),
    // createdAt-only rows → bucketed in JS (simplest robust day grouping on SQLite)
    db.eventLog.findMany({
      where: { type: "pageview", createdAt: { gte: since } },
      select: { createdAt: true },
    }),
    db.message.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true },
    }),
    db.eventLog.groupBy({
      by: ["route"],
      where: { type: "pageview", createdAt: { gte: since }, route: { not: null } },
      _count: { route: true },
    }),
    db.eventLog.groupBy({
      by: ["referrer"],
      where: { type: "pageview", createdAt: { gte: since } },
      _count: { referrer: true },
    }),
    db.eventLog.groupBy({
      by: ["action"],
      where: { type: "palette", createdAt: { gte: since }, action: { not: null } },
      _count: { action: true },
    }),
    aiStats(since),
  ]);

  const routes = routeGroups
    .filter((g): g is typeof g & { route: string } => g.route !== null)
    .map((g) => ({ key: g.route, count: g._count.route }));

  const palette = paletteGroups
    .filter((g): g is typeof g & { action: string } => g.action !== null)
    .map((g) => ({ key: g.action, count: g._count.action }));

  const referrerCounts = new Map<ReferrerClass, number>(
    REFERRER_CLASSES.map((c) => [c, 0])
  );
  for (const g of referrerGroups) {
    if (
      g.referrer !== null &&
      (REFERRER_CLASSES as readonly string[]).includes(g.referrer)
    ) {
      const c = g.referrer as ReferrerClass;
      referrerCounts.set(c, (referrerCounts.get(c) ?? 0) + g._count.referrer);
    }
  }

  const viewsPerDay = bucketByDay(
    pageviewRows.map((r) => r.createdAt),
    days
  );

  return ok({
    days,
    totals: {
      pageviews,
      aiChats: ai.total,
      paletteUses,
      gemClicks,
      contactMessages,
    },
    viewsPerDay,
    topRoutes: topNamed(routes, 8),
    topCaseStudies: topNamed(
      routes.filter((r) => r.key.startsWith("/work/")),
      8
    ),
    referrers: REFERRER_CLASSES.map((source) => ({
      source,
      count: referrerCounts.get(source) ?? 0,
    })),
    topPaletteActions: topNamed(palette, 8),
    aiTopics: ai.topics,
    aiRecent: ai.recent,
    contactPerDay: bucketByDay(
      contactRows.map((r) => r.createdAt),
      days
    ),
  });
}
