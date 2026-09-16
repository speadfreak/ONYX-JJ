import { NextResponse } from "next/server";
import { logActivity } from "@/lib/auth";
import { SESSION_COOKIE } from "@/lib/auth-edge";

/** POST /api/admin/logout — clears the admin session cookie. */
export async function POST() {
  await logActivity("Signed out");
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
