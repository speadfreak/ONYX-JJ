import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { TeamManager } from "./team-manager";

export const metadata: Metadata = {
  title: { absolute: "Team — Control Room · JJ ONYX" },
  robots: { index: false, follow: false },
};

/**
 * Owner-only admin management. The page-level role check is defense in depth
 * on top of the API-level checks — a non-owner hitting this URL directly is
 * redirected (the nav item is hidden for them, but the URL is the real gate).
 */
export default async function AdminTeamPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");
  if (admin.role !== "owner") redirect("/admin");

  return <TeamManager />;
}
