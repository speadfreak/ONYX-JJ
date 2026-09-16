import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  createSessionToken,
  logActivity,
  requireAdmin,
  sessionCookieOptions,
} from "@/lib/auth";
import { SESSION_COOKIE } from "@/lib/auth-edge";
import { isValidEmail, normalizeEmail, verifyPassword } from "@/lib/admin-users";

/**
 * POST /api/admin/account/email — change the signed-in admin's own email.
 * Requires the CURRENT password (never allow a hijacked tab to silently take
 * over the account). On success:
 *   - the email is updated (lowercased, unique-checked)
 *   - sessionEpoch is bumped → every OTHER session on this account dies
 *   - a fresh session cookie is issued for THIS browser (stays signed in)
 */
export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";
  const newEmail = normalizeEmail(body.newEmail);

  if (!currentPassword) {
    return NextResponse.json(
      { ok: false, error: "Confirm your current password to change your email." },
      { status: 400 }
    );
  }
  if (!newEmail || !isValidEmail(newEmail)) {
    return NextResponse.json({ ok: false, error: "Enter a valid new email address." }, { status: 400 });
  }

  const admin = await db.adminUser.findUnique({ where: { id: session.id } });
  if (!admin) {
    return NextResponse.json({ ok: false, error: "Account not found." }, { status: 404 });
  }

  const valid = await verifyPassword(currentPassword, admin.passwordHash);
  if (!valid) {
    return NextResponse.json({ ok: false, error: "Current password is incorrect." }, { status: 403 });
  }

  if (newEmail === admin.email) {
    return NextResponse.json({ ok: false, error: "That is already your email." }, { status: 400 });
  }

  const taken = await db.adminUser.findUnique({ where: { email: newEmail } });
  if (taken) {
    return NextResponse.json(
      { ok: false, error: "An admin account with this email already exists." },
      { status: 409 }
    );
  }

  const updated = await db.adminUser.update({
    where: { id: admin.id },
    data: { email: newEmail, sessionEpoch: admin.sessionEpoch + 1 },
  });

  // Re-issue for THIS browser only — every other device was just invalidated.
  const token = await createSessionToken({
    id: updated.id,
    email: updated.email,
    role: updated.role === "owner" ? "owner" : "admin",
    epoch: updated.sessionEpoch,
  });

  await logActivity("Changed email", `${admin.email} → ${updated.email} — other sessions invalidated`);

  const res = NextResponse.json({ ok: true, email: updated.email });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return res;
}
