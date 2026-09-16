"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BarChart3,
  CircleUser,
  Gem,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  Newspaper,
  Quote,
  Settings,
  SlidersHorizontal,
  Sparkles,
  FolderKanban,
  Users,
  ExternalLink,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
  /** Shown only to the owner (team management). */
  ownerOnly?: boolean;
}

const NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/projects", label: "Projects", icon: FolderKanban },
  { href: "/admin/home-content", label: "Home Content", icon: SlidersHorizontal },
  { href: "/admin/blog", label: "Journal", icon: Newspaper },
  { href: "/admin/testimonials", label: "Testimonials", icon: Quote },
  { href: "/admin/messages", label: "Inbox", icon: Inbox },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/ai-insights", label: "AI Insights", icon: Sparkles },
  { href: "/admin/settings", label: "Settings", icon: Settings },
  { href: "/admin/team", label: "Team", icon: Users, ownerOnly: true },
  { href: "/admin/account", label: "My Account", icon: CircleUser },
];

async function fetchUnread(): Promise<number> {
  const res = await fetch("/api/admin/activity");
  if (!res.ok) return 0;
  const data = (await res.json()) as { ok: boolean; unread?: number };
  return data.unread ?? 0;
}

export function AdminShell({
  email,
  role,
  children,
}: {
  email: string;
  role: "owner" | "admin";
  children: React.ReactNode;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 5_000, refetchOnWindowFocus: false } },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-screen bg-onyx-950 text-foreground">
        <Sidebar email={email} role={role} />
        <div className="min-w-0 flex-1 pt-14 lg:pt-0">{children}</div>
      </div>
    </QueryClientProvider>
  );
}

function Sidebar({ email, role }: { email: string; role: "owner" | "admin" }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: unread = 0 } = useQuery({
    queryKey: ["unread-count"],
    queryFn: fetchUnread,
    refetchInterval: 30_000,
  });

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" }).catch(() => {});
    router.replace("/admin/login");
    router.refresh();
  };

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  const links = (
    <nav aria-label="Admin" className="flex flex-1 flex-col gap-1 px-3">
      {NAV.filter((item) => !item.ownerOnly || role === "owner").map((item) => {
        const active = isActive(item.href, item.exact);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-all duration-200",
              active
                ? "bg-gold/10 text-gold shadow-[inset_0_0_0_1px_rgba(212,168,87,0.25)]"
                : "text-foreground/65 hover:bg-white/5 hover:text-foreground"
            )}
          >
            <item.icon
              className={cn("h-4 w-4 shrink-0", active ? "text-gold" : "text-muted-foreground group-hover:text-gold/70")}
            />
            <span className="flex-1">{item.label}</span>
            {item.href === "/admin/messages" && unread > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1.5 font-mono text-[10px] font-bold text-onyx-950">
                {unread > 99 ? "99+" : unread}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  const footer = (
    <div className="border-t border-white/5 p-3">
      <a
        href="/"
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm text-foreground/65 transition-colors hover:bg-white/5 hover:text-foreground"
      >
        <ExternalLink className="h-4 w-4 text-muted-foreground" /> View public site
      </a>
      <button
        onClick={logout}
        className="flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm text-foreground/65 transition-colors hover:bg-red-500/10 hover:text-red-300"
      >
        <LogOut className="h-4 w-4 text-muted-foreground" /> Sign out
      </button>
      <p className="truncate px-3.5 pt-2 font-mono text-[10px] tracking-[0.1em] text-muted-foreground" title={email}>
        {email}
      </p>
      <p className="px-3.5 pb-2 font-mono text-[9px] uppercase tracking-[0.3em] text-gold/60">
        {role === "owner" ? "★ Owner" : "Admin"}
      </p>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-white/5 bg-onyx-900/40 lg:flex">
        <Link href="/admin" className="flex items-center gap-2.5 px-5 py-5">
          <Gem className="h-5 w-5 text-gold" aria-hidden />
          <span className="font-display text-base font-semibold tracking-tight">
            <span className="gold-text">JJ</span> Control Room
          </span>
        </Link>
        {links}
        {footer}
      </aside>

      {/* Mobile top bar + drawer */}
      <div className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-white/5 bg-onyx-950/90 px-4 backdrop-blur-md lg:hidden">
        <Link href="/admin" className="flex items-center gap-2 font-display text-sm font-semibold">
          <Gem className="h-4 w-4 text-gold" aria-hidden /> Control Room
        </Link>
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open admin menu"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/70" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-64 flex-col border-r border-white/10 bg-onyx-950 pt-4">
            <div className="mb-2 flex items-center justify-between px-5">
              <span className="font-display text-sm font-semibold">
                <span className="gold-text">JJ</span> Control Room
              </span>
              <button onClick={() => setMobileOpen(false)} aria-label="Close menu" className="p-2 text-muted-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            {links}
            {footer}
          </div>
        </div>
      )}
    </>
  );
}
