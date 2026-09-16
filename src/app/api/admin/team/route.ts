import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireOwner, logActivity } from "@/lib/auth";
import {
  generateInviteToken,
  INVITE_TTL_HOURS,
  isValidEmail,
  normalizeEmail,
} from "@/lib/admin-users";
import { asString } from "@/lib/admin-api";

/**
 * Owner-only team management (v4 Task A).
 *
 * GET  /api/admin/team  — list every admin account.
 * POST /api/admin/team  — create a pending admin + a single-use invite link.
 *                         The raw token is returned ONCE, in this response;
 *                         only its SHA-256 hash is stored.
 */

function isOwner(admin: { role: string } | null): boolean {
  return admin?.role === "owner";
}

/** Build an absolute invite link from the request (proxy-aware, best effort). */
function inviteLink(req: Request, token: string): string {
  const origin =
    req.headers.get("origin") ??
    req.headers.get("referer")?.replace(/\/$/, "") ??
    new URL(req.url).origin;
  try {
    return new URL(`/admin/invite/${token}`, origin).toString();
  } catch {
    return `/admin/invite/${token}`;
  }
}

export async function GET(req: Request) {
  const actor = await requireOwner();
  if (!isOwner(actor)) {
    return NextResponse.json(
      { ok: false, error: "Only the owner can manage the team." },
      { status: 403 }
    );
  }

  const admins = await db.adminUser.findMany({
    orderBy: [{ role: "desc" }, { createdAt: "asc" }], // owner first, then oldest
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      createdAt: true,
      lastLoginAt: true,
      inviteExpiresAt: true,
      invitedBy: { select: { email: true } },
    },
  });

  return NextResponse.json({
    ok: true,
    admins: admins.map((a) => ({
      id: a.id,
      email: a.email,
      name: a.name,
      role: a.role,
      status: a.status,
      createdAt: a.createdAt,
      lastLoginAt: a.lastLoginAt,
      inviteExpiresAt: a.status === "invited" ? a.inviteExpiresAt : null,
      invitedByEmail: a.invitedBy?.email ?? null,
    })),
  });
}

export async function POST(req: Request) {
  const actor = await requireOwner();
  if (!isOwner(actor)) {
    return NextResponse.json(
      { ok: false, error: "Only the owner can manage the team." },
      { status: 403 }
    );
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const email = normalizeEmail(body.email);
  const name = asString(body.name).trim().slice(0, 80);
  const role = asString(body.role, "admin");

  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ ok: false, error: "A valid email address is required." }, { status: 400 });
  }
  if (!name) {
    return NextResponse.json({ ok: false, error: "A name is required." }, { status: 400 });
  }
  // Role escalation guard: the owner is unique — no API path may mint another.
  if (role !== "admin") {
    return NextResponse.json(
      { ok: false, error: 'New admins are created with the "admin" role. There is exactly one owner.' },
      { status: 400 }
    );
  }

  const existing = await db.adminUser.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { ok: false, error: "An admin account with this email already exists." },
      { status: 409 }
    );
  }

  const { token, tokenHash, expiresAt } = generateInviteToken();

  const created = await db.adminUser.create({
    data: {
      email,
      name,
      role: "admin",
      status: "invited",
      passwordHash: null,
      inviteTokenHash: tokenHash,
      inviteExpiresAt: expiresAt,
      invitedById: actor!.id,
    },
  });

  await logActivity(
    "Invited admin",
    `${email} (${name}, role admin) — invite expires in ${INVITE_TTL_HOURS}h — by ${actor!.email}`
  );

  return NextResponse.json({
    ok: true,
    admin: { id: created.id, email: created.email, name: created.name, status: created.status },
    invite: {
      // Shown ONCE in the UI — the owner copies it and sends it to the new
      // admin through a secure channel.
      // TODO(email): wire Resend/SendGrid to deliver this automatically.
      url: inviteLink(req, token),
      expiresAt,
    },
  });
}
