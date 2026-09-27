import "server-only";
import { createHash, randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { logActivity } from "@/lib/auth";

/**
 * AdminUser domain helpers (v4 Task A).
 *
 * ensureOwnerMigrated() performs the one-time migration of the original
 * env-var credential (ADMIN_EMAIL / ADMIN_PASSWORD_HASH) into the AdminUser
 * table as the first account with role="owner" — the role that can never be
 * deleted, disabled, or demoted. It is idempotent and safe to call on every
 * login attempt.
 */

export const INVITE_TTL_HOURS = 48; // invite links are valid for 24–48h; we use 48
export const MIN_PASSWORD_LENGTH = 8;
export const BCRYPT_ROUNDS = 10;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email) && email.length <= 160;
}

export function normalizeEmail(v: unknown): string {
  return typeof v === "string" ? v.trim().toLowerCase() : "";
}

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/** A fresh single-use invite: raw token (goes in the link) + stored hash + expiry. */
export function generateInviteToken(): { token: string; tokenHash: string; expiresAt: Date } {
  const token = randomBytes(32).toString("base64url"); // 43 URL-safe chars
  return { token, tokenHash: sha256(token), expiresAt: new Date(Date.now() + INVITE_TTL_HOURS * 3600_000) };
}

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string | null): Promise<boolean> {
  if (!hash) {
    // No password set yet (invited account) — burn a compare so timing doesn't
    // reveal which accounts exist / which are pending.
    await bcrypt.compare(plain, "$2b$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinv");
    return false;
  }
  return bcrypt.compare(plain, hash);
}

/**
 * Password strength: minimum 8 characters (spec). Cheap server-side rules —
 * length + not entirely whitespace.
 */
export function isValidPassword(pw: string): boolean {
  return typeof pw === "string" && pw.length >= MIN_PASSWORD_LENGTH && pw.trim().length >= MIN_PASSWORD_LENGTH;
}

/**
 * One-time, idempotent migration: if the AdminUser table is empty, create the
 * owner account from environment credentials (the ONLY source — no hardcoded
 * fallbacks: a known default password in source code would ship to the repo).
 *
 * Required env (first boot only):
 *   ADMIN_EMAIL                    — owner email
 *   ADMIN_PASSWORD  (plaintext) or
 *   ADMIN_PASSWORD_HASH (bcrypt)  — owner credential
 *
 * If the table is empty and these are missing, login stays DISABLED and a
 * loud error is logged — deliberately fail-closed instead of insecure.
 * (Set the vars, restart, first login bootstraps the owner.)
 */
let ownerEnsured = false;

export async function ensureOwnerMigrated(): Promise<void> {
  if (ownerEnsured) return;

  const count = await db.adminUser.count();
  if (count > 0) {
    ownerEnsured = true;
    return;
  }

  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!email) {
    console.error(
      "[admin-users] AdminUser table is empty and ADMIN_EMAIL is not set. " +
        "Set ADMIN_EMAIL + ADMIN_PASSWORD (or ADMIN_PASSWORD_HASH) to bootstrap " +
        "the owner account — login stays disabled until then."
    );
    ownerEnsured = true;
    return;
  }

  let passwordHash: string;
  if (process.env.ADMIN_PASSWORD_HASH) {
    passwordHash = process.env.ADMIN_PASSWORD_HASH;
  } else if (process.env.ADMIN_PASSWORD) {
    passwordHash = await hashPassword(process.env.ADMIN_PASSWORD);
  } else {
    console.error(
      "[admin-users] ADMIN_EMAIL is set but neither ADMIN_PASSWORD nor " +
        "ADMIN_PASSWORD_HASH is — cannot bootstrap the owner account."
    );
    ownerEnsured = true;
    return;
  }

  try {
    await db.adminUser.create({
      data: {
        email,
        name: "Joseph James",
        role: "owner",
        status: "active",
        passwordHash,
      },
    });
    await logActivity(
      "Owner migrated",
      `legacy env credential → AdminUser "${email}" (role owner) — multi-admin system initialized`
    );
  } catch {
    // Unique-violation race (concurrent logins during cold start) — someone
    // else created it; either way an owner exists now.
  }
  ownerEnsured = true;
}
