"use client";

import { Command } from "lucide-react";

/**
 * v3 — Persistent "⌘K" discovery pill (footer corner). Dispatches the same
 * global event the command palette listens for, so mouse-only visitors can
 * discover the palette without knowing the shortcut.
 */
export function CommandHint() {
  return (
    <button
      type="button"
      data-cursor="hover"
      aria-label="Open command palette"
      onClick={() => window.dispatchEvent(new CustomEvent("jj:command-palette"))}
      className="group flex items-center gap-2 rounded-full border border-white/10 bg-onyx-900/60 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground transition-all duration-300 hover:border-gold/50 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
    >
      <Command className="h-3 w-3 text-gold/70 transition-colors group-hover:text-gold" aria-hidden />
      <span className="hidden sm:inline">Command</span>
      <kbd className="rounded border border-white/10 bg-onyx-950 px-1.5 py-0.5 text-[9px] tracking-[0.1em] text-foreground/80 transition-colors group-hover:border-gold/30 group-hover:text-gold">
        ⌘K
      </kbd>
    </button>
  );
}
