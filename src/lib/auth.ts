import "server-only";
import { SignJWT } from "jose";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import {
  SESSION_COOKIE,
  verifyClaimsEdge,
  verifySessionEdge,
  type AdminRole,
  type AdminSession,
  type SessionClaims,
} from "@/lib/auth-edge";

/**
 * Multi-admin session auth (v4 Task A) — stateless JWT in an httpOnly cookie,
 * re-validated against the AdminUser table on every server-side check.
 *
 * - Credentials live in the AdminUser table (bcrypt hashes), migrated from the
 *   original env-var credential by ensureOwnerMigrated() (lib/admin-users.ts).
 * - Session payload: { id, email, role } so permission checks (owner-only team
 *   management) are possible.
 * - The token also carries sessionEpoch; requireAdmin() rejects it if the
 *   account's epoch was bumped (disabled / email changed / password changed)
 *   or the account is no longer active — instant revocation, no blacklist.
 */

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

function secretKey(): Uint8Array {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("ADMIN_SESSION_SECRET is missing or too short (min 32 chars).");
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(admin: {
  id: string;
  email: string;
  role: AdminRole;
  epoch: number;
}): Promise<string> {
  return new SignJWT({ ver: 2, email: admin.email, role: admin.role, epoch: admin.epoch })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(admin.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secretKey());
}

export async function verifySessionToken(
  token: string | undefined | null
): Promise<AdminSession | null> {
  return verifySessionEdge(token);
}

/**
 * Route-handler / server-component guard: verifies the JWT, then re-validates
 * the account against the DB (exists, active, epoch unchanged).
 */
export async function requireAdmin(): Promise<AdminSession | null> {
  const store = await cookies();
  const claims: SessionClaims | null = await verifyClaimsEdge(
    store.get(SESSION_COOKIE)?.value
  );
  if (!claims) return null;

  const admin = await db.adminUser.findUnique({ where: { id: claims.id } }).catch(() => null);
  if (!admin) return null; // deleted
  if (admin.status !== "active") return null; // disabled (or still invited)
  if (admin.sessionEpoch !== claims.epoch) return null; // superseded session
  if (admin.email !== claims.email) return null; // email rotated

  return { id: admin.id, email: admin.email, role: admin.role as AdminRole };
}

/** Owner-only guard for team management endpoints/pages. */
export async function requireOwner(): Promise<AdminSession | null> {
  const admin = await requireAdmin();
  return admin?.role === "owner" ? admin : null;
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    // The sandbox preview proxies over plain http; INSECURE_COOKIES=1 opts out.
    secure: process.env.INSECURE_COOKIES !== "1",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  };
}

// ── Support helpers ───────────────────────────────────────────────────────

export async function logActivity(action: string, detail?: string) {
  try {
    await db.activityLog.create({ data: { action, detail: detail ?? null } });
  } catch (e) {
    console.error("[activity] failed to log:", e);
  }
}

export function getRemoteIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "127.0.0.1";
}
