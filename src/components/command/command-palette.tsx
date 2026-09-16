"use client";

/**
 * v3 — Global command palette (Cmd+K / Ctrl+K).
 *
 * Linear/Vercel/Raycast-style launcher, on the JJ ONYX onyx/gold system:
 *  - Opens from any public page via ⌘K (Mac) / Ctrl+K (Win/Linux), or from the
 *    footer ⌘K pill which dispatches the global "jj:command-palette" event.
 *  - Fuzzy search (cmdk) across Navigate / Case Studies / Actions groups.
 *  - Every executed action fires a fire-and-forget analytics beacon to
 *    /api/track as { type: "palette", action: "<id>" }.
 *  - Closes instantly on selection, Esc, or overlay click (Radix waits for the
 *    180ms CSS exit animation before unmounting — no framer AnimatePresence
 *    needed, and reduced-motion visitors get plain fast fades via the
 *    motion-reduce overrides below + the global MotionConfig).
 *
 * Layering: palette sits at z-[85] — above the site header (z-[70]/[75]) and
 * film grain (z-[80]), below the home preloader (z-[90]) and the custom
 * cursor (z-[95]). While the home preloader gate is up, open requests are
 * deferred: the gate owns "/" until the visitor has entered.
 *
 * OWNED BY TASK 3-1. companion registry: ./palette-actions.ts
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAmbientAudio } from "@/components/providers/audio-provider";
import { nextAccent, useExperience } from "@/lib/store/experience";
import { useMounted } from "@/lib/hooks";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  buildPaletteActions,
  GROUP_HEADING,
  PALETTE_EMAIL,
  PALETTE_GITHUB_URL,
  PALETTE_GROUPS,
  type PaletteActionDef,
} from "./palette-actions";

/** Fire-and-forget analytics beacon — same shape as PageViewTracker's. */
function trackPaletteAction(actionId: string): void {
  void fetch("/api/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "palette", action: actionId }),
    keepalive: true,
  }).catch(() => {});
}

/** Programmatic same-tab download of a static /public asset. */
function downloadFile(href: string, filename: string): void {
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

/** execCommand fallback for non-secure contexts (clipboard API needs https/localhost). */
function legacyCopy(text: string): boolean {
  try {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  } catch {
    return false;
  }
}

function Kbd({ children }: { children: string }) {
  return (
    <span className="rounded border border-white/10 bg-onyx-950 px-1.5 py-0.5 text-[9px] leading-none tracking-[0.1em] text-foreground/80">
      {children}
    </span>
  );
}

interface PaletteRowProps {
  def: PaletteActionDef;
  onSelect: (def: PaletteActionDef) => void;
}

function PaletteRow({ def, onSelect }: PaletteRowProps) {
  const Icon = def.icon;
  return (
    <CommandItem
      value={[def.label, def.keywords].filter(Boolean).join(" ")}
      onSelect={() => onSelect(def)}
      className={cn(
        "group relative gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground/90",
        "data-[selected=true]:bg-gold/10 data-[selected=true]:text-gold",
        // left gold bar on the highlighted item
        "before:absolute before:left-0 before:top-1/2 before:h-5 before:w-0.5 before:-translate-y-1/2 before:rounded-full before:bg-gold before:opacity-0 before:transition-opacity",
        "data-[selected=true]:before:opacity-100"
      )}
    >
      <Icon
        aria-hidden
        className="size-4 shrink-0 text-gold/60 transition-colors group-data-[selected=true]:text-gold"
      />
      <span className="truncate">{def.label}</span>
      {def.route ? (
        <span className="ml-auto font-mono text-[10px] tracking-[0.15em] text-muted-foreground/50 transition-colors group-data-[selected=true]:text-gold/50">
          {def.route}
        </span>
      ) : null}
    </CommandItem>
  );
}

export function CommandPalette() {
  const mounted = useMounted();
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { muted, toggleMute } = useAmbientAudio();
  const accent = useExperience((s) => s.accent);
  const gemUnlocked = useExperience((s) => s.gemUnlocked);
  const setAccent = useExperience((s) => s.setAccent);

  const openPalette = useCallback(() => {
    // The home preloader gate owns "/" until the visitor has entered —
    // don't open an invisible palette underneath it.
    const experience = useExperience.getState();
    if (!experience.entered && window.location.pathname === "/") return;
    setOpen(true);
  }, []);

  // ⌘K / Ctrl+K from any public page + the footer ⌘K pill's global event.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || event.shiftKey || event.altKey) return;
      if (event.key.toLowerCase() !== "k" || !(event.metaKey || event.ctrlKey)) return;
      event.preventDefault(); // never let the browser steal the shortcut
      if (open) setOpen(false);
      else openPalette();
    };
    const onPaletteEvent = () => openPalette();
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("jj:command-palette", onPaletteEvent);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("jj:command-palette", onPaletteEvent);
    };
  }, [open, openPalette]);

  const actions = useMemo(
    () => buildPaletteActions({ muted, accent, gemUnlocked }),
    [muted, accent, gemUnlocked]
  );

  const grouped = useMemo(
    () =>
      PALETTE_GROUPS.map((group) => ({
        group,
        heading: GROUP_HEADING[group],
        items: actions.filter((action) => action.group === group),
      })),
    [actions]
  );

  const runAction = useCallback(
    (def: PaletteActionDef) => {
      setOpen(false); // close instantly — actions must feel immediate
      trackPaletteAction(def.id);

      if (def.route) {
        router.push(def.route); // no-op when already on the route; closing is the feedback
        return;
      }
      if (def.file) {
        downloadFile(def.file.href, def.file.filename);
        return;
      }

      switch (def.id) {
        case "toggle-sound":
          toggleMute();
          break;
        case "toggle-accent": {
          // Read fresh state in case the store moved between render and select.
          const experience = useExperience.getState();
          setAccent(nextAccent(experience.accent, experience.gemUnlocked));
          break;
        }
        case "copy-email": {
          const notifyCopied = () =>
            toast({ title: "Email copied", description: PALETTE_EMAIL });
          const notifyFailed = () =>
            toast({
              title: "Copy failed",
              description: PALETTE_EMAIL,
              variant: "destructive",
            });
          if (navigator.clipboard?.writeText) {
            void navigator.clipboard
              .writeText(PALETTE_EMAIL)
              .then(notifyCopied)
              .catch(() => {
                if (legacyCopy(PALETTE_EMAIL)) notifyCopied();
                else notifyFailed();
              });
          } else if (legacyCopy(PALETTE_EMAIL)) {
            notifyCopied();
          } else {
            notifyFailed();
          }
          break;
        }
        case "open-github":
          // PLACEHOLDER URL — same placeholder used across the site's socials.
          window.open(PALETTE_GITHUB_URL, "_blank", "noopener,noreferrer");
          break;
        default:
          break;
      }
    },
    [router, toggleMute, setAccent, toast]
  );

  if (!mounted) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogPortal>
        <DialogOverlay
          className={cn(
            "z-[85] bg-black/60 backdrop-blur-md",
            "duration-[180ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
            "motion-reduce:duration-75"
          )}
        />
        <DialogPrimitive.Content
          aria-label="Command palette"
          className={cn(
            // Centered top panel — above header (z-[70]/[75]) + grain (z-[80]),
            // below preloader (z-[90]) + custom cursor (z-[95]).
            "fixed left-1/2 top-[18vh] z-[85] flex w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 flex-col overflow-hidden rounded-xl outline-none",
            // Glass surface — glass-panel is unlayered CSS, so its bg/border
            // need the Tailwind v4 important suffix to be overridable. Its
            // backdrop-filter is currently dropped by the CSS build, so the
            // blur is restated as utilities to guarantee the glassmorphism.
            "glass-panel border-white/10! bg-onyx-900/80! backdrop-blur-[18px] saturate-[1.2]",
            "shadow-[0_40px_120px_-20px_rgba(0,0,0,0.8)]",
            // Entrance/exit: scale 0.96 ↔ 1 + fade, 180ms, signature ease.
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
            "data-[state=open]:zoom-in-96 data-[state=closed]:zoom-out-96",
            "duration-[180ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
            // Reduced motion → simple fast fade only.
            "motion-reduce:duration-75 motion-reduce:data-[state=open]:zoom-in-100 motion-reduce:data-[state=closed]:zoom-out-100"
          )}
        >
          <DialogHeader className="sr-only">
            <DialogTitle>Command palette</DialogTitle>
            <DialogDescription>
              Jump to any page or run a quick action.
            </DialogDescription>
          </DialogHeader>

          <Command
            className={cn(
              "bg-transparent",
              "[&_[data-slot=command-input-wrapper]]:h-12 [&_[data-slot=command-input-wrapper]]:border-white/8 [&_[data-slot=command-input-wrapper]]:px-4",
              "[&_[data-slot=command-input-wrapper]_svg]:text-gold/70 [&_[data-slot=command-input-wrapper]_svg]:opacity-100"
            )}
          >
            <CommandInput
              aria-label="Search commands"
              placeholder="Type a command or search…"
              className="h-12 font-mono text-sm caret-gold placeholder:text-muted-foreground/60"
            />
            <CommandList className="max-h-[min(50vh,420px)] px-1.5 py-2 overscroll-contain [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar]:w-1">
              {grouped.map(({ group, heading, items }) => (
                <CommandGroup
                  key={group}
                  heading={heading}
                  className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-normal [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.3em] [&_[cmdk-group-heading]]:text-gold/60"
                >
                  {items.map((def) => (
                    <PaletteRow key={def.id} def={def} onSelect={runAction} />
                  ))}
                </CommandGroup>
              ))}
              <CommandEmpty className="py-8 text-center font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
                No commands found
              </CommandEmpty>
            </CommandList>
          </Command>

          {/* Footer hint bar */}
          <div className="flex h-9 shrink-0 items-center justify-center gap-4 border-t border-white/8 bg-onyx-950/40 px-4 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Kbd>↑</Kbd>
              <Kbd>↓</Kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1.5">
              <Kbd>↵</Kbd>
              Select
            </span>
            <span className="flex items-center gap-1.5">
              <Kbd>Esc</Kbd>
              Close
            </span>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
