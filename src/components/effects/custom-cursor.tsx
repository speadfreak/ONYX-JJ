"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Custom cursor: a glowing gold dot that tracks 1:1, plus a trailing ring
 * that lerps behind and morphs (scales up, brightens) over interactive
 * elements. Automatically disabled on touch devices and for
 * prefers-reduced-motion users.
 */
export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduce) return;

    setEnabled(true);
    document.documentElement.classList.add("jj-cursor-on");

    const dot = dotRef.current;
    const ring = ringRef.current;
    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let rx = x;
    let ry = y;
    let hovering = false;
    let visible = false;
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      x = e.clientX;
      y = e.clientY;
      if (!visible && dot && ring) {
        visible = true;
        dot.style.opacity = "1";
        ring.style.opacity = "1";
      }
    };
    const onOver = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      hovering = !!t?.closest(
        'a, button, [role="button"], [data-cursor="hover"], input, textarea, select, label, summary'
      );
    };
    const onLeave = () => {
      if (dot) dot.style.opacity = "0";
      if (ring) ring.style.opacity = "0";
      visible = false;
    };

    const loop = () => {
      if (dot && ring) {
        rx += (x - rx) * 0.16;
        ry += (y - ry) * 0.16;
        dot.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
        ring.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%) scale(${
          hovering ? 1.9 : 1
        })`;
        ring.style.borderColor = hovering
          ? "rgba(212, 168, 87, 0.9)"
          : "rgba(212, 168, 87, 0.45)";
        ring.style.backgroundColor = hovering ? "rgba(212, 168, 87, 0.08)" : "transparent";
      }
      raf = requestAnimationFrame(loop);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseover", onOver, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    raf = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(raf);
      document.documentElement.classList.remove("jj-cursor-on");
    };
  }, []);

  // Render targets eagerly so refs always exist; visibility handled via opacity/class
  return (
    <div aria-hidden className={enabled ? "" : "hidden"}>
      <div
        ref={ringRef}
        className="pointer-events-none fixed left-0 top-0 z-[95] h-9 w-9 rounded-full border opacity-0 transition-[border-color,background-color] duration-200"
        style={{ willChange: "transform", borderColor: "rgba(212,168,87,0.45)" }}
      />
      <div
        ref={dotRef}
        className="pointer-events-none fixed left-0 top-0 z-[95] h-1.5 w-1.5 rounded-full bg-gold opacity-0 shadow-[0_0_12px_2px_rgba(212,168,87,0.8)]"
        style={{ willChange: "transform" }}
      />
    </div>
  );
}
