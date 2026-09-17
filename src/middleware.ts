import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionEdge } from "@/lib/auth-edge";

/**
 * JJ ONYX v2 — admin gatekeeper.
 *
 * - ALL /admin/* pages require a valid session; unauthenticated visitors are
 *   redirected to /admin/login (with a ?from= return path).
 * - Authenticated visitors hitting /admin/login are bounced to /admin.
 * - ALL /api/admin/* endpoints require a valid session, EXCEPT the login
 *   endpoint itself (which is rate-limited internally).
 */

const LOGIN_PATH = "/admin/login";
const LOGIN_API = "/api/admin/login";
const HEALTH_API = "/api/admin/health";
// Pre-auth invite endpoints + the public invite-setup page (token IS the secret).
const INVITE_API_PREFIX = "/api/admin/invite/";
const INVITE_PAGE_PREFIX = "/admin/invite/";

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // The single public door — handled by its own route + rate limiter.
  if (pathname === LOGIN_API) return NextResponse.next();

  // Valueless login-stack diagnostics (booleans/counts only).
  if (pathname === HEALTH_API) return NextResponse.next();

  // Invite endpoints are used BEFORE an account has a session (new admins
  // validating + accepting their one-time invite link).
  if (pathname.startsWith(INVITE_API_PREFIX)) return NextResponse.next();

  const session = await verifySessionEdge(req.cookies.get(SESSION_COOKIE)?.value);

  // Admin API surface
  if (pathname.startsWith("/api/admin/")) {
    if (session) return NextResponse.next();
    return NextResponse.json(
      { ok: false, error: "Unauthorized." },
      { status: 401 }
    );
  }

  // Admin pages
  if (pathname === LOGIN_PATH) {
    if (session) return NextResponse.redirect(new URL("/admin", req.url));
    return NextResponse.next();
  }

  // Public invite-setup page — reachable only with a valid token in the URL.
  if (pathname.startsWith(INVITE_PAGE_PREFIX)) return NextResponse.next();

  if (!session) {
    const login = new URL(LOGIN_PATH, req.url);
    login.searchParams.set("from", pathname + search);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
