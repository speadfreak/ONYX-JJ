"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";
import { usePrefersReducedMotion } from "@/lib/hooks";
import { cn } from "@/lib/utils";

/**
 * JJ ONYX — "whoami" terminal card.
 * Types a short script char-by-char (≈18ms/char, 500ms between lines) once it
 * scrolls into view. Fully static under prefers-reduced-motion. Body carries a
 * min-height so the card never shifts layout while typing.
 */

const CHAR_MS = 18;
const LINE_DELAY = 500;

const SCRIPT = [
  { cmd: "whoami", out: "joseph.james — fullstack engineer", outClass: "text-mint" },
  {
    cmd: "cat stack.txt",
    out: "TypeScript · React · Node · PostgreSQL · Convex · Socket.IO",
    outClass: "text-foreground/70",
  },
  { cmd: "uptime", out: "shipping since 16 — no days off", outClass: "text-mint" },
] as const;

type Token = { text: string; kind: "cmd" | "out"; outClass?: string };

const TOKENS: Token[] = SCRIPT.flatMap((line) => [
  { text: line.cmd, kind: "cmd" as const },
  { text: line.out, kind: "out" as const, outClass: line.outClass },
]);

function Caret() {
  return (
    <span
      aria-hidden
      className="animate-caret ml-1 inline-block h-[1.05em] w-[0.55em] translate-y-[0.18em] bg-gold/90"
    />
  );
}

export function TerminalCard({ className }: { className?: string }) {
  const reduce = usePrefersReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const [started, setStarted] = useState(false);
  const [pos, setPos] = useState<{ token: number; chars: number; rest: number }>({
    token: 0,
    chars: 0,
    rest: 0,
  });

  useEffect(() => {
    if (inView) setStarted(true);
  }, [inView]);

  const last = TOKENS.length - 1;
  const done = reduce || (started && pos.token === last && pos.chars >= TOKENS[last].text.length);

  useEffect(() => {
    if (!inView || reduce || done) return;
    let timer = 0;
    const tick = () => {
      setPos((p) => {
        if (p.rest > 0) return { ...p, rest: p.rest - 1 };
        const tok = TOKENS[Math.min(p.token, TOKENS.length - 1)];
        if (p.chars < tok.text.length) return { ...p, chars: p.chars + 1 };
        if (p.token >= TOKENS.length - 1) return p;
        // token finished → rest before the next one starts typing
        return { token: p.token + 1, chars: 0, rest: Math.round(LINE_DELAY / CHAR_MS) };
      });
      timer = window.setTimeout(tick, CHAR_MS);
    };
    timer = window.setTimeout(tick, CHAR_MS);
    return () => window.clearTimeout(timer);
  }, [inView, reduce, done]);

  const visibleText = (t: number): string => {
    if (reduce) return TOKENS[t].text;
    if (!started) return "";
    if (t < pos.token) return TOKENS[t].text;
    if (t === pos.token) return TOKENS[t].text.slice(0, pos.chars);
    return "";
  };

  return (
    <div
      ref={ref}
      role="img"
      aria-label="Terminal — quick facts about Joseph James"
      className={cn(
        "relative overflow-hidden rounded-lg border border-white/10 bg-black/60 font-mono text-xs shadow-[0_24px_60px_-24px_rgba(0,0,0,0.9)] backdrop-blur sm:text-sm",
        className
      )}
    >
      {/* window chrome */}
      <div className="relative flex items-center gap-2 border-b border-white/10 bg-white/[0.03] px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[#E5484D]/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-gold/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-mint/70" />
        <span className="absolute left-1/2 -translate-x-1/2 text-[10px] tracking-[0.3em] text-muted-foreground">
          jj@onyx:~
        </span>
      </div>

      {/* script body — min-height keeps the card stable while typing */}
      <div className="min-h-[10.5rem] px-4 py-4 leading-[1.6] sm:min-h-[11.5rem]">
        {SCRIPT.map((line, i) => {
          const cmdToken = i * 2;
          const outToken = i * 2 + 1;
          const cmdText = visibleText(cmdToken);
          const outText = visibleText(outToken);
          const showCmdCaret = !reduce && started && !done && pos.token === cmdToken;
          const showOutCaret = !reduce && started && !done && pos.token === outToken;
          return (
            <div key={line.cmd}>
              <p className="min-h-[1.7em] whitespace-pre-wrap break-words">
                <span className="text-gold">$ </span>
                <span className="text-foreground/90">{cmdText}</span>
                {showCmdCaret ? <Caret /> : null}
              </p>
              <p
                className={cn(
                  "min-h-[1.7em] whitespace-pre-wrap break-words pl-4",
                  line.outClass
                )}
              >
                {outText}
                {showOutCaret ? <Caret /> : null}
              </p>
            </div>
          );
        })}
        {/* resting prompt — always rendered so total height never changes */}
        <p className="min-h-[1.7em]">
          <span className="text-gold">$</span>
          {done && !reduce ? <Caret /> : null}
        </p>
      </div>
    </div>
  );
}
