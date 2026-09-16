import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";

export const metadata: Metadata = {
  title: { absolute: "Control Room — JJ ONYX" },
  robots: { index: false, follow: false },
};

/**
 * Protected admin workspace shell. Middleware already gates /admin/* — this
 * server-side check is defense in depth (e.g. if middleware is bypassed).
 */
export default async function AdminPanelLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");

  return <AdminShell email={admin.email} role={admin.role}>{children}</AdminShell>;
}
