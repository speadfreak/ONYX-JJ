import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireOwner, logActivity } from "@/lib/auth";
import { generateInviteToken, INVITE_TTL_HOURS } from "@/lib/admin-users";

/**
 * POST /api/admin/team/[id]/invite — regenerate the invite link for an admin
 * whose invite expired (or that the owner wants to re-issue). Only applies to
 * accounts still in "invited" status. The old token dies the moment the new
 * hash is stored (the hash column is overwritten).
 */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const actor = await requireOwner();
  if (actor?.role !== "owner") {
    return NextResponse.json(
      { ok: false, error: "Only the owner can manage the team." },
      { status: 403 }
    );
  }

  const { id } = await ctx.params;
  const target = await db.adminUser.findUnique({ where: { id } });
  if (!target) {
    return NextResponse.json({ ok: false, error: "Admin not found." }, { status: 404 });
  }
  if (target.role === "owner" || target.status !== "invited") {
    return NextResponse.json(
      { ok: false, error: "Only pending (invited) accounts can be re-invited." },
      { status: 400 }
    );
  }

  const { token, tokenHash, expiresAt } = generateInviteToken();
  await db.adminUser.update({
    where: { id },
    data: { inviteTokenHash: tokenHash, inviteExpiresAt: expiresAt },
  });

  await logActivity(
    "Re-invited admin",
    `${target.email} — new invite expires in ${INVITE_TTL_HOURS}h — by ${actor.email}`
  );

  const origin =
    req.headers.get("origin") ??
    req.headers.get("referer")?.replace(/\/$/, "") ??
    new URL(req.url).origin;
  let url = `/admin/invite/${token}`;
  try {
    url = new URL(`/admin/invite/${token}`, origin).toString();
  } catch {
    /* relative fallback already set */
  }

  return NextResponse.json({ ok: true, invite: { url, expiresAt } });
}
