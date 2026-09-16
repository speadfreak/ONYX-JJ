"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Site-wide smooth inertia scroll (Lenis), wired into GSAP's ticker so
 * ScrollTrigger animations stay perfectly in sync with Lenis frames.
 *
 * Exports imperative helpers so any component (preloader, mobile menu…)
 * can pause/resume scrolling.
 */

let lenisInstance: Lenis | null = null;

export function getLenis(): Lenis | null {
  return lenisInstance;
}

export function stopScroll(): void {
  lenisInstance?.stop();
  if (typeof document !== "undefined") document.documentElement.style.overflow = "hidden";
}

export function startScroll(): void {
  lenisInstance?.start();
  if (typeof document !== "undefined") document.documentElement.style.overflow = "";
}

/** Call inside any effect that uses ScrollTrigger. */
export function registerGsap(): void {
  if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);
}

export function SmoothScroll() {
  const pathname = usePathname();

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return; // native scroll for reduced-motion users

    const lenis = new Lenis({
      lerp: 0.11,
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.4,
    });
    lenisInstance = lenis;

    gsap.registerPlugin(ScrollTrigger);
    lenis.on("scroll", ScrollTrigger.update);

    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
      lenisInstance = null;
    };
  }, []);

  // Recalculate scroll-trigger positions after each route change
  useEffect(() => {
    const t = setTimeout(() => ScrollTrigger.refresh(), 500);
    return () => clearTimeout(t);
  }, [pathname]);

  return null;
}
