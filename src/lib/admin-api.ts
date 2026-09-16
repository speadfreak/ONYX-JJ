import "server-only";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logActivity } from "@/lib/auth";

/** Shared JSON response helpers for admin API routes. */
export const ok = <T>(data: T, init?: ResponseInit) =>
  NextResponse.json({ ok: true, ...data }, init);
export const bad = (error: string, status = 400) =>
  NextResponse.json({ ok: false, error }, { status });

export function asString(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}
export function asBool(v: unknown, fallback = false): boolean {
  return typeof v === "boolean" ? v : fallback;
}
export function asInt(v: unknown, fallback = 0): number {
  const n = typeof v === "number" ? v : typeof v === "string" ? parseInt(v, 10) : NaN;
  return Number.isFinite(n) ? n : fallback;
}
export function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string").map((s) => s.trim()).filter(Boolean);
}
export function statsArray(v: unknown): { value: string; label: string }[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((x): x is Record<string, unknown> => typeof x === "object" && x !== null)
    .map((s) => ({ value: asString(s.value).slice(0, 40), label: asString(s.label).slice(0, 80) }))
    .filter((s) => s.value || s.label);
}
export function asStats(v: unknown): string {
  return JSON.stringify(statsArray(v));
}
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

/** Record an admin action to the activity feed (best-effort). */
export async function touched(action: string, detail?: string) {
  await logActivity(action, detail);
}

export { db };
