import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getRemoteIp } from "@/lib/auth";

/**
 * v3 — Anonymous, privacy-respecting usage event sink (self-hosted analytics).
 *
 * Accepts exactly three event kinds from the public site:
 *   - pageview: { type, route, referrer }   — referrer is stored as a CLASS
 *     only (direct | search | social | other); the raw URL is never kept.
 *   - palette:  { type, action }            — command palette action id.
 *   - gem:      { type }                    — easter egg trigger counter.
 *
 * No cookies, no fingerprinting, no PII. Aggregate counts only.
 */

export const runtime = "nodejs";

const TYPES = new Set(["pageview", "palette", "gem"]);

const SEARCH_HOSTS = [
  "google.", "bing.com", "duckduckgo.com", "ecosia.org",
  "search.brave.com", "yandex.", "baidu.com", "yahoo.",
];
const SOCIAL_HOSTS = [
  "twitter.com", "x.com", "t.co", "linkedin.com", "lnkd.in", "t.me", "telegram.me",
  "twitch.tv", "youtube.com", "youtu.be", "facebook.com", "instagram.com",
  "reddit.com", "tiktok.com", "wa.me", "whatsapp.com", "discord.com",
];

function classifyReferrer(raw: string): "direct" | "search" | "social" | "other" {
  if (!raw) return "direct";
  try {
    const host = new URL(raw).hostname.toLowerCase().replace(/^www\./, "");
    if (SEARCH_HOSTS.some((s) => host.includes(s))) return "search";
    if (SOCIAL_HOSTS.some((s) => host === s || host.endsWith("." + s))) return "social";
    return "other";
  } catch {
    return "other";
  }
}

// ── Naive per-IP flood guard (in-memory, 60 events / minute) ────────────
const buckets = new Map<string, { n: number; reset: number }>();
function allow(ip: string): boolean {
  const now = Date.now();
  const b = buckets.get(ip);
  if (!b || now > b.reset) {
    buckets.set(ip, { n: 1, reset: now + 60_000 });
    if (buckets.size > 5_000) buckets.clear(); // hard cap memory
    return true;
  }
  b.n += 1;
  return b.n <= 60;
}

export async function POST(req: Request) {
  try {
    const ip = getRemoteIp(req);
    if (!allow(ip)) return NextResponse.json({ ok: true }, { status: 202 });

    const body = (await req.json().catch(() => null)) as {
      type?: unknown;
      route?: unknown;
      action?: unknown;
      referrer?: unknown;
    } | null;

    const type = typeof body?.type === "string" ? body.type : "";
    if (!TYPES.has(type)) {
      return NextResponse.json({ ok: false, error: "Unknown event type." }, { status: 400 });
    }

    const route =
      type === "pageview" && typeof body?.route === "string"
        ? body.route.slice(0, 200)
        : null;
    const action =
      type === "palette" && typeof body?.action === "string"
        ? body.action.slice(0, 80)
        : null;
    const referrer =
      type === "pageview"
        ? classifyReferrer(typeof body?.referrer === "string" ? body.referrer : "")
        : null;

    await db.eventLog.create({
      data: { type, route, action, referrer },
    });

    return NextResponse.json({ ok: true });
  } catch {
    // Analytics must never break the site — swallow and acknowledge.
    return NextResponse.json({ ok: true });
  }
}
