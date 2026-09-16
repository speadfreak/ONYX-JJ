import { NextResponse } from "next/server";
import { getMarketSnapshot, demoFallbackSnapshot } from "@/lib/market";
import type { ApiMarketResponse } from "@/lib/market-types";
import { getSiteSettings } from "@/lib/content";

// Freshness is owned by the lib-level 45s in-memory cache — never serve a
// route-cached stale response on top of it.
export const dynamic = "force-dynamic";

/**
 * GET /api/market — public Market Pulse feed.
 * Shape: { ok: true, source, updatedAt, instruments[], bias }
 * Total failure still returns 200 with a clearly-labeled demo snapshot —
 * the public site must never see a 500 from this route.
 */
export async function GET() {
  try {
    const [snapshot, settings] = await Promise.all([
      getMarketSnapshot(),
      getSiteSettings(),
    ]);
    const body: ApiMarketResponse = {
      ok: true,
      ...snapshot,
      bias: settings.marketBias ?? "",
    };
    return NextResponse.json(body);
  } catch (err) {
    // getMarketSnapshot() is designed not to throw — this is belt-and-braces.
    console.error("[api/market] unexpected failure — serving demo snapshot", err);
    const body: ApiMarketResponse = {
      ok: true,
      ...demoFallbackSnapshot(),
      bias: "",
    };
    return NextResponse.json(body);
  }
}
