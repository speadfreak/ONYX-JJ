"use client";

import { useEffect, useState } from "react";

/**
 * Live local time in JJ's timezone (Africa/Addis_Ababa) for the footer's
 * status cluster — ticks every second, client-only (hydration-safe: renders
 * "—:— EAT" until mounted). Optionally shows the pulsing LIVE badge when JJ
 * is streaming (same treatment as the nav/hero badge, surfaced for
 * consistency).
 */
export function FooterClock({ liveStatus, liveUrl }: { liveStatus: boolean; liveUrl: string }) {
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Africa/Addis_Ababa",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    const tick = () => setTime(fmt.format(new Date()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const hhmm = time ? time.slice(0, 5) : null;
  const ss = time ? time.slice(6, 8) : null;

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
      <p
        className="flex items-baseline gap-1.5 font-mono text-[13px] tracking-[0.18em] text-foreground/80"
        aria-label={`Current local time in Addis Ababa: ${hhmm ?? "loading"} EAT`}
      >
        {/* gold pulse dot */}
        <span aria-hidden className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-60 motion-reduce:animate-none" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-gold" />
        </span>
        <span className="tabular-nums">
          {hhmm ?? "--:--"}
          {ss && <span className="text-[10px] text-muted-foreground">:{ss}</span>}
        </span>
        <span className="text-[10px] uppercase text-muted-foreground">EAT · Addis Ababa</span>
      </p>

      {liveStatus && (
        <a
          href={liveUrl || "#"}
          target={liveUrl ? "_blank" : undefined}
          rel={liveUrl ? "noreferrer noopener" : undefined}
          className="flex items-center gap-2 rounded-full border border-mint/40 bg-mint/10 px-3 py-1 backdrop-blur-sm transition-all duration-300 hover:border-mint hover:shadow-[0_0_20px_-4px_rgba(0,229,160,0.6)]"
          aria-label="JJ is live now — join the stream"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mint opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-mint" />
          </span>
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.3em] text-mint">
            LIVE
          </span>
        </a>
      )}
    </div>
  );
}
