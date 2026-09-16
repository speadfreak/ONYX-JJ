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
/**
 * Home hero stats have their OWN shape — { to: number, suffix?, label } —
 * unlike project stat bars ({ value, label }). Never mix the two: this
 * normalizer used to be missing and the project-shaped one silently
 * stripped every `to`, zeroing the homepage counter strip (Task 12).
 */
export function homeStatsArray(v: unknown): { to: number; suffix?: string; label: string }[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((x): x is Record<string, unknown> => typeof x === "object" && x !== null)
    .map((s) => {
      const n = Math.round(Number(s.to));
      const to = Number.isFinite(n) ? Math.max(0, Math.min(999_999, n)) : 0;
      const label = asString(s.label).slice(0, 80);
      const suffix = asString(s.suffix).slice(0, 8);
      return { to, label, ...(suffix ? { suffix } : {}) };
    })
    .filter((s) => s.label);
}
export function asHomeStats(v: unknown): string {
  return JSON.stringify(homeStatsArray(v));
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
