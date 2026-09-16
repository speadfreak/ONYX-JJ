import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireOwner, logActivity } from "@/lib/auth";
import { asString } from "@/lib/admin-api";

/**
 * Owner-only edit/delete of a single admin account (v4 Task A).
 *
 * OWNER SAFEGUARDS (API-level, not just UI): the account with role="owner"
 * can NEVER be deleted, disabled, or demoted — any such mutation is rejected
 * with 403 even if crafted outside the UI. Its name may still be edited.
 */

type RouteContext = { params: Promise<{ id: string }> };

function isOwner(actor: { role: string } | null): boolean {
  return actor?.role === "owner";
}

export async function PATCH(req: Request, ctx: RouteContext) {
  const actor = await requireOwner();
  if (!isOwner(actor)) {
    return NextResponse.json(
      { ok: false, error: "Only the owner can manage the team." },
      { status: 403 }
    );
  }

  const { id } = await ctx.params;
  const target = await db.adminUser.findUnique({ where: { id } });
  if (!target) {
    return NextResponse.json({ ok: false, error: "Admin not found." }, { status: 404 });
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const data: { name?: string; role?: string; status?: string; sessionEpoch?: number } = {};
  const changes: string[] = [];

  // ── Name ────────────────────────────────────────────────────────────────
  if (typeof body.name === "string") {
    const name = body.name.trim().slice(0, 80);
    if (!name) {
      return NextResponse.json({ ok: false, error: "Name cannot be empty." }, { status: 400 });
    }
    if (name !== target.name) {
      data.name = name;
      changes.push("name");
    }
  }

  // ── Role ────────────────────────────────────────────────────────────────
  if (typeof body.role === "string" && body.role !== target.role) {
    // Safeguard 1: the owner can never be demoted — by anyone, ever.
    if (target.role === "owner") {
      return NextResponse.json(
        { ok: false, error: "The owner account can never be demoted." },
        { status: 403 }
      );
    }
    // Safeguard 2: no path may mint a second owner (no escalation).
    if (body.role !== "admin") {
      return NextResponse.json(
        { ok: false, error: 'Invalid role — only "admin" can be assigned.' },
        { status: 400 }
      );
    }
    data.role = "admin";
    changes.push("role → admin");
  }

  // ── Status ──────────────────────────────────────────────────────────────
  if (typeof body.status === "string" && body.status !== target.status) {
    // Safeguard 3: the owner can never be disabled — by anyone, ever.
    if (target.role === "owner") {
      return NextResponse.json(
        { ok: false, error: "The owner account can never be disabled." },
        { status: 403 }
      );
    }
    if (body.status !== "active" && body.status !== "disabled") {
      return NextResponse.json(
        { ok: false, error: 'Invalid status — use "active" or "disabled".' },
        { status: 400 }
      );
    }
    if (body.status === "active" && !target.passwordHash) {
      return NextResponse.json(
        { ok: false, error: "This admin hasn't completed setup yet — resend the invite link instead." },
        { status: 400 }
      );
    }
    data.status = body.status;
    changes.push(`status → ${body.status}`);
    // Disabling must immediately invalidate any active sessions for the account.
    if (body.status === "disabled") {
      data.sessionEpoch = target.sessionEpoch + 1;
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ ok: true, unchanged: true, admin: { id: target.id } });
  }

  const updated = await db.adminUser.update({ where: { id }, data });

  await logActivity(
    "Edited admin",
    `${target.email} — ${changes.join(", ")} — by ${actor!.email}`
  );

  return NextResponse.json({
    ok: true,
    admin: {
      id: updated.id,
      email: updated.email,
      name: updated.name,
      role: updated.role,
      status: updated.status,
    },
  });
}

export async function DELETE(req: Request, ctx: RouteContext) {
  const actor = await requireOwner();
  if (!isOwner(actor)) {
    return NextResponse.json(
      { ok: false, error: "Only the owner can manage the team." },
      { status: 403 }
    );
  }

  const { id } = await ctx.params;
  const target = await db.adminUser.findUnique({ where: { id } });
  if (!target) {
    return NextResponse.json({ ok: false, error: "Admin not found." }, { status: 404 });
  }

  // Safeguard: the owner account can never be deleted — hard API block.
  if (target.role === "owner") {
    return NextResponse.json(
      { ok: false, error: "The owner account can never be deleted." },
      { status: 403 }
    );
  }

  await db.adminUser.delete({ where: { id } });
  await logActivity("Deleted admin", `${target.email} (${target.name}) — by ${actor!.email}`);

  return NextResponse.json({ ok: true });
}
