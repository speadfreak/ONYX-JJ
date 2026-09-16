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
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) return null;
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
