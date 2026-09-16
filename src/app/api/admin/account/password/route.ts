import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  createSessionToken,
  logActivity,
  requireAdmin,
  sessionCookieOptions,
} from "@/lib/auth";
import { SESSION_COOKIE } from "@/lib/auth-edge";
import { hashPassword, isValidPassword, verifyPassword } from "@/lib/admin-users";

/**
 * POST /api/admin/account/password — change the signed-in admin's own password.
 * Requires the CURRENT password + a new one (min 8 chars). The new password is
 * bcrypt-hashed — plaintext is never stored, even temporarily.
 * On success sessionEpoch is bumped (all OTHER sessions die) and a fresh
 * cookie is issued for THIS browser.
 */
export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";
  const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";
  const confirmPassword = typeof body.confirmPassword === "string" ? body.confirmPassword : "";

  if (!currentPassword) {
    return NextResponse.json(
      { ok: false, error: "Confirm your current password to change it." },
      { status: 400 }
    );
  }
  if (!newPassword) {
    return NextResponse.json({ ok: false, error: "Enter a new password." }, { status: 400 });
  }
  if (!isValidPassword(newPassword)) {
    return NextResponse.json(
      { ok: false, error: "New password must be at least 8 characters long." },
      { status: 400 }
    );
  }
  if (confirmPassword && confirmPassword !== newPassword) {
    return NextResponse.json({ ok: false, error: "New passwords do not match." }, { status: 400 });
  }

  const admin = await db.adminUser.findUnique({ where: { id: session.id } });
  if (!admin) {
    return NextResponse.json({ ok: false, error: "Account not found." }, { status: 404 });
  }

  const valid = await verifyPassword(currentPassword, admin.passwordHash);
  if (!valid) {
    return NextResponse.json({ ok: false, error: "Current password is incorrect." }, { status: 403 });
  }

  const passwordHash = await hashPassword(newPassword);
  const updated = await db.adminUser.update({
    where: { id: admin.id },
    data: { passwordHash, sessionEpoch: admin.sessionEpoch + 1 },
  });

  const token = await createSessionToken({
    id: updated.id,
    email: updated.email,
    role: updated.role === "owner" ? "owner" : "admin",
    epoch: updated.sessionEpoch,
  });

  await logActivity(
    "Changed password",
    `admin ${updated.email} rotated their password — other sessions invalidated`
  );

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return res;
}
