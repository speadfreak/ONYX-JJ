import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  createSessionToken,
  getRemoteIp,
  logActivity,
  sessionCookieOptions,
} from "@/lib/auth";
import { SESSION_COOKIE } from "@/lib/auth-edge";
import {
  ensureOwnerMigrated,
  isValidEmail,
  normalizeEmail,
  verifyPassword,
} from "@/lib/admin-users";

/**
 * POST /api/admin/login — database-backed multi-admin credential check (v4).
 * Brute-force protection: max 5 failed attempts per IP / 15 minutes (unchanged).
 * Passwords are bcrypt hashes in the AdminUser table — never plaintext, never env.
 *
 * Status handling:
 *  - "invited"  → the account exists but has no password yet; the user must
 *                 complete setup via their one-time invite link.
 *  - "disabled" → hard block; disabling also bumps sessionEpoch so any live
 *                 session dies immediately.
 */
export async function POST(req: Request) {
  const ip = getRemoteIp(req);

  try {
    const body = (await req.json()) as { email?: unknown; password?: unknown };
    const email = normalizeEmail(body.email);
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json({ ok: false, error: "Email and password are required." }, { status: 400 });
    }
    if (!isValidEmail(email)) {
      return NextResponse.json({ ok: false, error: "Invalid credentials." }, { status: 401 });
    }

    // ── Rate limit: 5 failures / 15 min / IP (unchanged from v2) ─────────
    const since = new Date(Date.now() - 15 * 60 * 1000);
    const recent = await db.loginAttempt.count({
      where: { ip, success: false, createdAt: { gte: since } },
    });
    if (recent >= 5) {
      return NextResponse.json(
        { ok: false, error: "Too many attempts. Try again in 15 minutes." },
        { status: 429 }
      );
    }

    // One-time legacy migration (no-op once an owner exists).
    await ensureOwnerMigrated();

    const admin = await db.adminUser.findUnique({ where: { email } });

    let valid = false;
    if (admin && admin.status !== "invited" && admin.passwordHash) {
      valid = await verifyPassword(password, admin.passwordHash);
    } else {
      // Burn a compare anyway so response timing doesn't leak valid emails.
      await verifyPassword(password, null);
    }

    if (!valid || !admin) {
      await db.loginAttempt.create({ data: { ip, success: false } });
      await new Promise((r) => setTimeout(r, 350)); // slow the probe down
      return NextResponse.json({ ok: false, error: "Invalid credentials." }, { status: 401 });
    }

    if (admin.status === "invited") {
      await db.loginAttempt.create({ data: { ip, success: false } });
      return NextResponse.json(
        {
          ok: false,
          error:
            "This account has an invite pending. Open the invite link you were sent to set your password first.",
        },
        { status: 403 }
      );
    }

    if (admin.status === "disabled") {
      await db.loginAttempt.create({ data: { ip, success: false } });
      await new Promise((r) => setTimeout(r, 350));
      return NextResponse.json(
        { ok: false, error: "This account has been disabled. Contact the site owner." },
        { status: 403 }
      );
    }

    // Success — clear the failure counter for this IP and mint the session.
    await db.loginAttempt.deleteMany({ where: { ip, success: false } });
    await db.adminUser.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    const token = await createSessionToken({
      id: admin.id,
      email: admin.email,
      role: admin.role === "owner" ? "owner" : "admin",
      epoch: admin.sessionEpoch,
    });

    await logActivity("Signed in", `admin ${admin.email} (${admin.role})`);

    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
    return res;
  } catch (e) {
    console.error("[admin/login]", e);
    return NextResponse.json({ ok: false, error: "Login failed. Try again." }, { status: 500 });
  }
}
