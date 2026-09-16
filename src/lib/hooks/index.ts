"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useReducedMotion } from "framer-motion";

/** True on small screens AND touch/coarse-pointer devices — gates heavy video/3D. */
export function useIsMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const narrow = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const coarse = window.matchMedia("(pointer: coarse)");
    const update = () => setIsMobile(narrow.matches || coarse.matches);
    update();
    narrow.addEventListener("change", update);
    coarse.addEventListener("change", update);
    return () => {
      narrow.removeEventListener("change", update);
      coarse.removeEventListener("change", update);
    };
  }, [breakpoint]);
  return isMobile;
}

/**
 * Heuristic for low-end devices — gates the 3D gem.
 *
 * v4 fix: verify REAL capability instead of trusting host-reported specs.
 * Containers, VMs and headless test browsers often report artificially low
 * core counts (e.g. 2) or capped RAM, which made the old `cores <= 4 ||
 * mem <= 4` check suppress the WebGL gem on machines that render it fine.
 * Now: probe WebGL support directly, and only treat a device as low-end when
 * the weak spec signals CONVERGE (both critically low) — a single restricted
 * value is not evidence. (Real phones are already excluded by useIsMobile.)
 */
export function useIsLowEnd(): boolean {
  const [lowEnd, setLowEnd] = useState(false);
  useEffect(() => {
    let webglOk = false;
    try {
      const canvas = document.createElement("canvas");
      webglOk = !!(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
    } catch {
      webglOk = false;
    }
    if (!webglOk) {
      setLowEnd(true);
      return;
    }
    const cores = navigator.hardwareConcurrency ?? 8;
    const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
    setLowEnd(cores <= 2 && mem <= 2);
  }, []);
  return lowEnd;
}

/** SSR-safe reduced-motion flag (false during first render). */
export function usePrefersReducedMotion(): boolean {
  return useReducedMotion() ?? false;
}

/** True after first client render — avoids hydration mismatches. */
const emptySubscribe = () => () => {};
export function useMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}
