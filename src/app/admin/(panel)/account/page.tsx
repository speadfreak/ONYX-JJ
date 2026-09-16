import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { AccountManager } from "./account-manager";

export const metadata: Metadata = {
  title: { absolute: "My Account — Control Room · JJ ONYX" },
  robots: { index: false, follow: false },
};

/**
 * Self-service account management — available to EVERY admin (owner included),
 * separate from the owner-only Team section.
 */
export default async function AdminAccountPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");

  return <AccountManager />;
}
