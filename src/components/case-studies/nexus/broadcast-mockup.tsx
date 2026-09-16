"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView } from "framer-motion";
import { MessageSquare, Smartphone } from "lucide-react";

import { usePrefersReducedMotion } from "@/lib/hooks";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

interface Candle {
  /** open y (px, viewBox space) */
  o: number;
  /** close y (px) */
  c: number;
  /** high y (px) */
  hi: number;
  /** low y (px) */
  lo: number;
}

/**
 * Simulated XAUUSD 15M candles — hand-authored y pixel coordinates in a
 * 420×210 viewBox (lower y = higher price). Deterministic to stay SSR-safe.
 */
const CANDLES: Candle[] = [
  { o: 166, c: 156, hi: 148, lo: 174 },
  { o: 156, c: 142, hi: 134, lo: 164 },
  { o: 142, c: 149, hi: 134, lo: 157 },
  { o: 149, c: 124, hi: 116, lo: 157 },
  { o: 124, c: 131, hi: 116, lo: 139 },
  { o: 131, c: 104, hi: 96, lo: 139 },
  { o: 104, c: 112, hi: 96, lo: 120 },
  { o: 112, c: 86, hi: 78, lo: 120 },
  { o: 86, c: 96, hi: 78, lo: 104 },
  { o: 96, c: 72, hi: 64, lo: 104 },
  { o: 72, c: 60, hi: 52, lo: 80 },
  { o: 60, c: 78, hi: 52, lo: 86 },
  { o: 78, c: 50, hi: 42, lo: 86 },
  { o: 50, c: 42, hi: 34, lo: 58 },
  { o: 42, c: 58, hi: 34, lo: 66 },
  { o: 58, c: 30, hi: 22, lo: 66 },
];

const CLOSE_PATH = CANDLES.map((k, i) => `${i === 0 ? "M" : "L"} ${22 + i * 25} ${k.c}`).join(" ");

interface ChatMsg {
  user: string;
  text: string;
}

const CHAT: ChatMsg[] = [
  { user: "viewr_04", text: "that entry was clean 🔥" },
  { user: "mira_t", text: "what's the COT saying?" },
  { user: "dex", text: "stream quality is insane today" },
  { user: "kidus", text: "teach us the journal setup" },
];

function formatTimer(total: number): string {
  const m = Math.floor(total / 60)
    .toString()
    .padStart(2, "0");
  const s = (total % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function SpecRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 font-mono text-[10px] tracking-[0.12em]">
      <span className="shrink-0 text-white/40">{k}</span>
      <span className="break-all text-right text-white/80">{v}</span>
    </div>
  );
}

/**
 * Stream-style broadcast mock: LIVE badge + REC timer, animated candlestick
 * chart with gold close-line + scanning crosshair, RTMP settings, phone-PWA
 * input tile and a looping stream chat. All loops run only while in view and
 * collapse to static states under prefers-reduced-motion.
 */
export function BroadcastMockup({ className }: { className?: string }) {
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.3 });

  const [secs, setSecs] = useState(0);
  const [chatCount, setChatCount] = useState(1);

  // REC timer — ticks only while the mockup is on screen.
  useEffect(() => {
    if (!inView || reduced) return;
    const id = window.setInterval(() => setSecs((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [inView, reduced]);

  // Chat loop — sliding window of 1..4 messages, cycling forever.
  useEffect(() => {
    if (!inView || reduced) return;
    const id = window.setInterval(() => setChatCount((c) => (c % CHAT.length) + 1), 1400);
    return () => window.clearInterval(id);
  }, [inView, reduced]);

  const visibleChat = reduced ? CHAT : CHAT.slice(0, chatCount);

  return (
    <div ref={ref} className={cn("my-10", className)}>
      <div className="relative overflow-hidden rounded-xl border border-white/10 bg-onyx-950/80 p-4 shadow-[0_0_60px_-18px_rgba(34,211,238,0.28)] sm:p-6">
        <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-ice/40 to-transparent" />

        {/* ── Frame header ── */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="relative inline-flex">
            <span aria-hidden className={cn("absolute inset-0 rounded bg-red-500/40", !reduced && "animate-ping")} />
            <span className="relative rounded bg-red-600/90 px-3 py-1 font-mono text-[10px] tracking-[0.3em] text-white">
              LIVE
            </span>
          </span>
          <span className="font-mono text-[11px] tracking-[0.3em] text-white/80">JJ ON AIR — NEXUS/01</span>
          <span className="ml-auto flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
            <span className="font-mono text-[9px] tracking-[0.25em] text-white/50">REC</span>
            <span className="font-mono text-[11px] tabular-nums text-white/75">{formatTimer(secs)}</span>
          </span>
        </div>

        {/* ── Body ── */}
        <div className="mt-4 grid gap-4 md:grid-cols-[1.6fr_1fr]">
          {/* Chart panel */}
          <div className="rounded-lg border border-white/8 bg-black/50 p-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] tracking-[0.28em] text-white/70">XAUUSD · 15M</span>
              <span className="font-mono text-[9px] tracking-[0.2em] text-muted-foreground">FEED · SIMULATED</span>
            </div>

            <div className="relative mt-3 overflow-hidden">
              <svg
                viewBox="0 0 420 210"
                role="img"
                aria-label="Simulated XAUUSD 15-minute candlestick chart with gold close line"
                className="block w-full"
              >
                {[40, 100, 160].map((y) => (
                  <line key={y} x1="8" x2="412" y1={y} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                ))}

                {CANDLES.map((k, i) => {
                  const x = 16 + i * 25;
                  const bull = k.c < k.o;
                  const top = Math.min(k.o, k.c);
                  const h = Math.abs(k.o - k.c);
                  return (
                    <motion.g
                      key={i}
                      initial={reduced ? false : { opacity: 0, scaleY: 0 }}
                      whileInView={{ opacity: 1, scaleY: 1 }}
                      viewport={{ once: true, margin: "-40px" }}
                      transition={{ duration: 0.45, delay: reduced ? 0 : 0.15 + i * 0.04, ease: EASE }}
                      style={{ transformBox: "fill-box", transformOrigin: "center" }}
                    >
                      <line
                        x1={x + 6}
                        x2={x + 6}
                        y1={k.hi}
                        y2={k.lo}
                        stroke={bull ? "rgba(0,229,160,0.55)" : "rgba(229,72,77,0.55)"}
                        strokeWidth="1.5"
                      />
                      <rect x={x} y={top} width="12" height={h} rx="1.5" fill={bull ? "#00E5A0" : "#E5484D"} opacity="0.9" />
                    </motion.g>
                  );
                })}

                <motion.path
                  d={CLOSE_PATH}
                  fill="none"
                  stroke="#D4A857"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={reduced ? false : { pathLength: 0, opacity: 0 }}
                  whileInView={{ pathLength: 1, opacity: 0.9 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 1.2, delay: reduced ? 0 : 0.9, ease: "easeInOut" }}
                  style={{ filter: "drop-shadow(0 0 6px rgba(212,168,87,0.45))" }}
                />
              </svg>

              {/* watermark */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 flex select-none items-center justify-center font-display text-[8rem] font-semibold leading-none text-white opacity-[0.04]"
              >
                LIVE
              </span>

              {/* scanning crosshair */}
              {!reduced && (
                <motion.div
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 h-px bg-ice/40 shadow-[0_0_12px_rgba(34,211,238,0.55)]"
                  initial={{ top: "8%" }}
                  animate={{ top: ["8%", "88%", "8%"] }}
                  transition={{ repeat: Infinity, duration: 7, ease: "easeInOut" }}
                />
              )}
            </div>
          </div>

          {/* Right rail */}
          <div className="flex flex-col gap-4">
            {/* stream settings */}
            <div className="space-y-2.5 rounded-lg border border-white/8 bg-black/50 p-4">
              <SpecRow k="OUTPUT" v="RTMP · rtmp://live.example/app" />
              <SpecRow k="BITRATE" v="6000 kbps" />
              <SpecRow k="ENCODER" v="FFmpeg · h264" />
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] tracking-[0.12em] text-white/40">STATUS</span>
                <span className="inline-flex items-center gap-1.5 rounded border border-mint/30 bg-mint/10 px-2 py-0.5 font-mono text-[9px] tracking-[0.2em] text-mint">
                  <span className="h-1 w-1 rounded-full bg-mint" /> CONNECTED
                </span>
              </div>
            </div>

            {/* phone PWA input */}
            <div className="flex items-center gap-3 rounded-lg border border-white/8 bg-black/50 p-3.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-ice/20 bg-ice/10">
                <Smartphone className="h-4 w-4 text-ice" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[10px] tracking-[0.18em] text-white/85">PHONE CAM — PWA INPUT</p>
                <p className="mt-0.5 font-mono text-[9px] tracking-[0.14em] text-muted-foreground">1080p · 30fps</p>
              </div>
              <span className="relative flex h-2 w-2">
                {!reduced && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-60" />}
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
              </span>
            </div>

            {/* stream chat */}
            <div className="rounded-lg border border-white/8 bg-black/50 p-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-3.5 w-3.5 text-ice/70" aria-hidden />
                <span className="font-mono text-[10px] tracking-[0.25em] text-white/60">STREAM CHAT</span>
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-mint" />
              </div>
              <div className="mt-3 flex h-[116px] flex-col justify-end gap-1.5 overflow-hidden">
                <AnimatePresence initial={false} mode="popLayout">
                  {visibleChat.map((m) => (
                    <motion.p
                      key={m.user}
                      initial={reduced ? false : { opacity: 0, x: 24 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={reduced ? undefined : { opacity: 0, x: -12 }}
                      transition={{ duration: 0.35, ease: EASE }}
                      className="text-[11px] leading-snug"
                    >
                      <span className="font-mono text-[10px] text-ice/80">{m.user}: </span>
                      <span className="text-white/75">{m.text}</span>
                    </motion.p>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
