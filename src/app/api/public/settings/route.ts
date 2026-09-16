import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/public/settings — safe, public subset of site settings.
 * Consumed by the nav LIVE badge (polled ~30s), the audio gate, hero media.
 * Exposes ONLY booleans/URLs meant for visitors — never admin secrets.
 */
export async function GET() {
  try {
    const s = await db.siteSetting.findUnique({ where: { id: "site" } });
    if (!s) throw new Error("missing");
    return NextResponse.json({
      ok: true,
      liveStatus: s.liveStatus,
      liveUrl: s.liveUrl,
      audioEnabled: s.audioEnabled,
      videoEnabled: s.videoEnabled,
      socials: JSON.parse(s.socials || "[]"),
      profileImage: s.profileImage,
      heroVideo: s.heroVideo,
      heroPoster: s.heroPoster,
      availabilityStatus: s.availabilityStatus ?? "",
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Settings unavailable." }, { status: 500 });
  }
}
