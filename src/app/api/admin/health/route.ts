import { db } from "@/lib/db";
import { sessionSecret } from "@/lib/auth-edge";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/health — public, deliberately VALUELESS login-stack probe.
 *
 * Booleans and counts only — no emails, no hashes, no secret material. It
 * exists so the owner (and Z.ai) can verify the admin login stack from the
 * outside: is the database reachable, does an owner account exist, and is the
 * session-signing secret in a usable state. Exempt from the middleware gate
 * (see middleware.ts).
 */
export async function GET() {
  let dbReachable = false;
  let adminUsers = -1;
  let failedLoginAttempts = -1;
  try {
    adminUsers = await db.adminUser.count();
    failedLoginAttempts = await db.loginAttempt.count({ where: { success: false } });
    dbReachable = true;
  } catch {
    // reported as unreachable below
  }

  const explicit = process.env.ADMIN_SESSION_SECRET;

  return Response.json({
    ok: true,
    db: {
      reachable: dbReachable,
      adminUsers,
      failedLoginAttempts,
    },
    auth: {
      // true → a proper ADMIN_SESSION_SECRET (32+ chars) is set on the host
      sessionSecretExplicit: !!(explicit && explicit.length >= 32),
      // true → the signing secret in use is valid (explicit or deterministic fallback)
      sessionSecretOk: sessionSecret().length >= 32,
      // true → legacy bootstrap env (ADMIN_EMAIL) is present on the host
      legacyEnvEmailSet: !!process.env.ADMIN_EMAIL,
    },
  });
}
