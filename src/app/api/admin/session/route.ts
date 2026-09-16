import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

/** GET /api/admin/session — returns the signed-in admin identity (or 401). */
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ ok: false }, { status: 401 });
  return NextResponse.json({ ok: true, email: admin.email, role: admin.role, id: admin.id });
}
