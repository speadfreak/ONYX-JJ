"use client";

import { useRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Magnetic hover wrapper — content is gently pulled toward the cursor
 * and springs back on leave. Renders an <a> when href is provided,
 * otherwise a <button>.
 */
export function MagneticButton({
  children,
  href,
  onClick,
  className,
  external = false,
  strength = 0.32,
  ariaLabel,
  type,
}: {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
  external?: boolean;
  strength?: number;
  ariaLabel?: string;
  type?: "button" | "submit";
}) {
  const ref = useRef<HTMLElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const x = useSpring(mx, { stiffness: 160, damping: 14, mass: 0.4 });
  const y = useSpring(my, { stiffness: 160, damping: 14, mass: 0.4 });

  const handleMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    mx.set((e.clientX - (rect.left + rect.width / 2)) * strength);
    my.set((e.clientY - (rect.top + rect.height / 2)) * strength);
  };
  const reset = () => {
    mx.set(0);
    my.set(0);
  };

  const shared = {
    ref: ref as React.Ref<HTMLAnchorElement & HTMLButtonElement>,
    style: { x, y },
    onMouseMove: handleMove,
    onMouseLeave: reset,
    className: cn("inline-block", className),
    "aria-label": ariaLabel,
  };

  if (href) {
    return (
      <motion.a
        {...shared}
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
      >
        {children}
      </motion.a>
    );
  }
  return (
    <motion.button {...shared} onClick={onClick} type={type ?? "button"}>
      {children}
    </motion.button>
  );
}
