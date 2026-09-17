import { jwtVerify } from "jose";

/**
 * Edge-safe session verification — used by BOTH middleware (edge runtime) and
 * route handlers. No database, no "server-only" import here.
 *
 * v4 (Task A): sessions belong to a database AdminUser. The JWT carries the
 * admin's id, email, role and the sessionEpoch at issue time — requireAdmin()
 * (Node runtime, has DB) additionally checks that the account is still active
 * and that the epoch hasn't been bumped (disable / email change / password
 * change), so revocation is instant without a token blacklist.
 *
 * Token format v2: { ver: 2, sub: <adminId>, email, role, epoch }.
 * v1 tokens (single-admin, sub=email, no ver) are rejected — everyone simply
 * signs in again after this upgrade.
 */
export const SESSION_COOKIE = "jj_admin_session";

/**
 * Session signing secret — explicit env first, deterministic fallback second.
 *
 * The fallback exists so a missing/short ADMIN_SESSION_SECRET on the host can
 * NEVER lock the owner out of a single-admin site (it once silently killed
 * every existing session AND 500'd every fresh login — Task 13). Derived
 * purely from stable server-side env material with string ops only, so the
 * EXACT same value is computable in the Node runtime (route handlers) and the
 * edge runtime (middleware) — no node:crypto, no async WebCrypto.
 */
export function sessionSecret(): string {
  const explicit = process.env.ADMIN_SESSION_SECRET;
  if (explicit && explicit.length >= 32) return explicit;
  const derived = `onyx-session::${process.env.DATABASE_URL ?? ""}::${process.env.ADMIN_EMAIL ?? ""}::v1`;
  // Guarantee ≥32 chars even if the env material were (nearly) empty.
  return derived.length >= 32 ? derived : `${derived}::${"onyx-fallback-pad".repeat(3)}`;
}

export type AdminRole = "owner" | "admin";

export interface AdminSession {
  id: string;
  email: string;
  role: AdminRole;
}

/** Shape of the JWT payload (before DB re-validation). */
export interface SessionClaims {
  id: string;
  email: string;
  role: AdminRole;
  epoch: number;
}

export async function verifySessionEdge(token: string | undefined | null): Promise<AdminSession | null> {
  const claims = await verifyClaimsEdge(token);
  return claims ? { id: claims.id, email: claims.email, role: claims.role } : null;
}

/** Verify signature + v2 shape. Epoch/status re-validation happens in auth.ts. */
export async function verifyClaimsEdge(token: string | undefined | null): Promise<SessionClaims | null> {
  if (!token) return null;
  const secret = sessionSecret();
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    if (payload.ver !== 2) return null; // pre-v4 token — force re-login
    if (typeof payload.sub !== "string" || payload.sub.length === 0) return null;
    if (typeof payload.email !== "string" || payload.email.length === 0) return null;
    if (payload.role !== "owner" && payload.role !== "admin") return null;
    const epoch = typeof payload.epoch === "number" ? payload.epoch : -1;
    if (epoch < 0) return null;
    return { id: payload.sub, email: payload.email, role: payload.role, epoch };
  } catch {
    return null;
  }
}
