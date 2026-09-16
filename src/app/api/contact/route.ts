import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getRemoteIp } from "@/lib/auth";

/**
 * Contact endpoint — validates, spam-checks, and persists to the Message
 * table so JJ can read submissions from /admin/messages (mailto quick-action
 * for replies). Max 3 submissions per IP per 10 minutes.
 */
export async function POST(req: Request) {
  const ip = getRemoteIp(req);

  try {
    const body = (await req.json()) as Record<string, unknown>;
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";
    // Honeypot — real users never fill this (rendered off-screen / aria-hidden)
    const honeypot = typeof body.website === "string" ? body.website.trim() : "";

    if (honeypot) {
      // Silently accept so bots think it worked, but don't store anything.
      return NextResponse.json({ ok: true });
    }

    if (!name || !email || !message) {
      return NextResponse.json(
        { ok: false, error: "Name, email and message are required." },
        { status: 400 }
      );
    }
    if (name.length < 2 || name.length > 80) {
      return NextResponse.json({ ok: false, error: "Please provide your name (2–80 characters)." }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) {
      return NextResponse.json(
        { ok: false, error: "Please provide a valid email address." },
        { status: 400 }
      );
    }
    if (message.length < 10 || message.length > 5000) {
      return NextResponse.json(
        { ok: false, error: "Message should be 10–5000 characters." },
        { status: 400 }
      );
    }

    // ── Spam heuristics ────────────────────────────────────────────────
    const linkCount = (message.match(/https?:\/\//g) ?? []).length;
    if (linkCount > 2) {
      return NextResponse.json(
        { ok: false, error: "Too many links in the message. Trim it down and retry." },
        { status: 400 }
      );
    }

    const since = new Date(Date.now() - 10 * 60 * 1000);
    const recent = await db.message.count({ where: { ip, createdAt: { gte: since } } });
    if (recent >= 3) {
      return NextResponse.json(
        { ok: false, error: "Too many messages sent recently. Please wait a bit." },
        { status: 429 }
      );
    }

    // Simulated delivery latency keeps the UX's sending state visible
    await new Promise((r) => setTimeout(r, 650));
    await db.message.create({ data: { name, email, message, ip } });
    console.log(`[contact] stored ${name} <${email}>: ${message.slice(0, 120).replace(/\n/g, " ")}`);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 400 });
  }
}
