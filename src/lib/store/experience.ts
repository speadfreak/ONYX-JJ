"use client";

import { create } from "zustand";

const ENTERED_KEY = "jj-onyx-entered";
const MUTED_KEY = "jj-onyx-muted";
const ACCENT_KEY = "jj-onyx-accent";

/**
 * Session accent theme.
 *  - "gold"  — the default signature accent
 *  - "mint"  — emerald-veil accent (palette toggle)
 *  - "prism" — secret accent unlocked by the gem easter egg: gold and mint
 *              slowly breathe into each other for the rest of the session.
 */
export type Accent = "gold" | "mint" | "prism";

function applyAccent(accent: Accent) {
  if (typeof window === "undefined") return;
  if (accent === "gold") delete document.documentElement.dataset.accent;
  else document.documentElement.dataset.accent = accent;
}

interface ExperienceState {
  /** Set when the visitor presses "ENTER EXPERIENCE" (or has already done so this session) */
  entered: boolean;
  muted: boolean;
  /** null = unknown, true = ambient track loaded, false = track missing/failed */
  audioAvailable: boolean | null;
  accent: Accent;
  /** True once the gem easter egg has been found this session (unlocks "prism") */
  gemUnlocked: boolean;
  setEntered: (v: boolean) => void;
  setMuted: (v: boolean) => void;
  setAudioAvailable: (v: boolean) => void;
  setAccent: (v: Accent) => void;
  /** Called by the gem easter egg — unlocks the secret prism accent */
  unlockGem: () => void;
  /** Read sessionStorage once on the client (call from a provider effect) */
  hydrate: () => void;
}

export const useExperience = create<ExperienceState>((set) => ({
  entered: false,
  muted: false,
  audioAvailable: null,
  accent: "gold",
  gemUnlocked: false,
  setEntered: (v) => {
    if (typeof window !== "undefined") {
      if (v) sessionStorage.setItem(ENTERED_KEY, "1");
      else sessionStorage.removeItem(ENTERED_KEY);
    }
    set({ entered: v });
  },
  setMuted: (v) => {
    if (typeof window !== "undefined") sessionStorage.setItem(MUTED_KEY, v ? "1" : "0");
    set({ muted: v });
  },
  setAudioAvailable: (v) => set({ audioAvailable: v }),
  setAccent: (v) => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(ACCENT_KEY, v);
      applyAccent(v);
    }
    set({ accent: v });
  },
  unlockGem: () => {
    if (typeof window !== "undefined") sessionStorage.setItem("jj-onyx-gem-found", "1");
    set({ gemUnlocked: true });
  },
  hydrate: () => {
    if (typeof window === "undefined") return;
    const accentRaw = sessionStorage.getItem(ACCENT_KEY);
    const accent: Accent = accentRaw === "mint" || accentRaw === "prism" ? accentRaw : "gold";
    const gemFound = sessionStorage.getItem("jj-onyx-gem-found") === "1";
    applyAccent(accent);
    set({
      entered: sessionStorage.getItem(ENTERED_KEY) === "1",
      muted: sessionStorage.getItem(MUTED_KEY) === "1",
      accent,
      gemUnlocked: gemFound || accent === "prism",
    });
  },
}));

/** Cycle for the palette action: gold → mint → (prism, if unlocked) → gold */
export function nextAccent(current: Accent, gemUnlocked: boolean): Accent {
  if (current === "gold") return "mint";
  if (current === "mint") return gemUnlocked ? "prism" : "gold";
  return "gold";
}
