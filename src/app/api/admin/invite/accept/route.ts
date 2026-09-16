import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  hashPassword,
  isValidPassword,
  sha256,
} from "@/lib/admin-users";
import { logActivity } from "@/lib/auth";

/**
 * POST /api/admin/invite/accept — the single-use completion of an invite.
 * Body: { token, password }
 *
 * - Rejects unknown / used / expired tokens with a CLEAR error (never silent).
 * - Hashes the chosen password with bcrypt (plaintext is never stored, even
 *   transiently, beyond the request lifetime).
 * - Flips the account from "invited" → "active" and clears the invite fields
 *   (the token cannot be reused).
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const token = typeof body.token === "string" ? body.token : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!token) {
    return NextResponse.json({ ok: false, error: "Missing invite token." }, { status: 400 });
  }
  if (!password) {
    return NextResponse.json({ ok: false, error: "Choose a password to continue." }, { status: 400 });
  }
  if (!isValidPassword(password)) {
    return NextResponse.json(
      { ok: false, error: "Password must be at least 8 characters long." },
      { status: 400 }
    );
  }

  const admin = await db.adminUser.findFirst({
    where: { inviteTokenHash: sha256(token) },
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

  const passwordHash = await hashPassword(password);

  await db.adminUser.update({
    where: { id: admin.id },
    data: {
      passwordHash,
      status: "active",
      inviteTokenHash: null, // single-use — the token dies here
      inviteExpiresAt: null,
      lastLoginAt: new Date(),
    },
  });

  await logActivity("Invite accepted", `${admin.email} (${admin.name}) completed setup — account active`);

  return NextResponse.json({ ok: true });
}
