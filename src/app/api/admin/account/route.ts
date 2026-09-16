import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

/** GET /api/admin/account — the signed-in admin's own profile. */
export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  const admin = await db.adminUser.findUnique({
    where: { id: session.id },
    select: {
      email: true,
      name: true,
      role: true,
      status: true,
      createdAt: true,
      lastLoginAt: true,
    },
  });

  if (!admin) {
    return NextResponse.json({ ok: false, error: "Account not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, account: admin });
}
