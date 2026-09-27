import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sha256 } from "@/lib/admin-users";

/**
 * GET /api/admin/invite/validate?token=… — pre-auth endpoint used by the
 * public invite-setup page to show WHO the invite is for before revealing
 * the password form. Never returns the token; only metadata.
 */
export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token") ?? "";
  if (!token) {
    return NextResponse.json({ ok: false, error: "Missing invite token." }, { status: 400 });
  }

  const admin = await db.adminUser.findFirst({
    where: { inviteTokenHash: sha256(token) },
    select: { name: true, email: true, status: true, inviteExpiresAt: true },
  });

  if (!admin) {
    return NextResponse.json(
      { ok: false, error: "This invite link is not valid. Ask the site owner to send a new one." },
      { status: 400 }
    );
  }
  if (admin.status !== "invited") {
    return NextResponse.json(
      { ok: false, error: "This invite has already been used. Sign in with your password instead." },
      { status: 400 }
    );
  }
  if (!admin.inviteExpiresAt || admin.inviteExpiresAt.getTime() < Date.now()) {
    return NextResponse.json(
      { ok: false, error: "This invite link has expired. Ask the site owner to send a new one." },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true, name: admin.name, email: admin.email });
}
