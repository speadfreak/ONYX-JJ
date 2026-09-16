"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useExperience } from "@/lib/store/experience";

/**
 * v3 — Anonymous page-view beacon.
 *
 * Fires one event per pathname change (deduped within 30s so remounts and
 * re-renders don't double count). Also re-hydrates the experience store on
 * every public route — the preloader only does it on "/". No cookies, no
 * PII: only the pathname + referrer class reach the server.
 */
export function PageViewTracker() {
  const pathname = usePathname();
  const lastRef = useRef<{ path: string; t: number }>({ path: "", t: 0 });

  useEffect(() => {
    useExperience.getState().hydrate();
    if (!pathname) return;

    const now = Date.now();
    const last = lastRef.current;
    if (last.path === pathname && now - last.t < 30_000) return;
    lastRef.current = { path: pathname, t: now };

    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "pageview", route: pathname, referrer: document.referrer || "" }),
      keepalive: true,
    }).catch(() => {});
  }, [pathname]);

  return null;
}
