"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Gem, Send, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMounted } from "@/lib/hooks";

/**
 * v3 — "Ask JJ" assistant: a persistent, on-brand chat bubble on every
 * public page. Grounded RAG answers come from POST /api/ask-jj (site content
 * only, first-person JJ voice, redirects to /contact for anything else).
 */

interface ChatMsg {
  role: "user" | "jj";
  text: string;
}

const SUGGESTED = [
  "What's the TG's ERP stack?",
  "How does JJ approach trading risk?",
  "What's Learnyx Academy?",
];

const WELCOME =
  "Ask me anything about JJ's projects, skills, or trading approach.";

const EASE = [0.22, 1, 0.36, 1] as const;

type Status = "idle" | "sending" | "error";

export function AskJJWidget() {
  const mounted = useMounted();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const askedRef = useRef(false); // only show suggestion chips before the first question

  const send = useCallback(
    async (question: string) => {
      const q = question.trim();
      if (!q || status === "sending") return;
      if (q.length < 5 || q.length > 500) {
        setStatus("error");
        setErrorMsg("Ask in 5-500 characters.");
        return;
      }

      askedRef.current = true;
      setMessages((m) => [...m, { role: "user", text: q }]);
      setInput("");
      setStatus("sending");
      setErrorMsg(null);

      try {
        const res = await fetch("/api/ask-jj", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: q }),
        });
        const data = (await res.json()) as { ok: boolean; answer?: string; error?: string };
        if (!res.ok || !data.ok || !data.answer) {
          throw new Error(data.error ?? "Something went wrong.");
        }
        setMessages((m) => [...m, { role: "jj", text: data.answer! }]);
        setStatus("idle");
      } catch (e) {
        setStatus("error");
        setErrorMsg((e as Error).message);
      }
    },
    [status]
  );

  // Keep the log pinned to the latest message
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, status, open]);

  // Esc closes; focus lands in the input when opened
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const t = setTimeout(() => inputRef.current?.focus(), 320);
    return () => {
      window.removeEventListener("keydown", onKey);
      clearTimeout(t);
    };
  }, [open]);

  if (!mounted) return null;

  const showChips = open && !askedRef.current && messages.length === 0;

  return (
    <>
      {/* ── Bubble ──────────────────────────────────────────────────── */}
      <motion.button
        type="button"
        initial={{ opacity: 0, scale: 0.6, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 1.1, ease: EASE }}
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close Ask JJ assistant" : "Open Ask JJ assistant"}
        aria-expanded={open}
        data-cursor="hover"
        className="fixed bottom-5 right-5 z-[82] flex h-13 w-13 items-center justify-center rounded-full border border-gold/50 bg-gradient-to-br from-gold to-gold-dark text-onyx-950 shadow-[0_10px_40px_-8px_rgba(212,168,87,0.55)] transition-transform duration-300 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-onyx-950 sm:bottom-6 sm:right-6"
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span
              key="x"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <X className="h-5 w-5" aria-hidden />
            </motion.span>
          ) : (
            <motion.span
              key="spark"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <Sparkles className="h-5 w-5" aria-hidden />
            </motion.span>
          )}
        </AnimatePresence>
        {/* soft attention ring */}
        {!open && (
          <span aria-hidden className="pointer-events-none absolute inset-0 -z-10 animate-ping rounded-full bg-gold/25 [animation-duration:3.2s]" />
        )}
      </motion.button>

      {/* ── Panel ───────────────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="ask-jj-panel"
            role="dialog"
            aria-label="Ask JJ assistant"
            initial={{ opacity: 0, scale: 0.92, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 10 }}
            transition={{ duration: 0.28, ease: EASE }}
            className="fixed bottom-[5.5rem] right-4 z-[82] flex h-[min(68vh,540px)] w-[min(92vw,380px)] origin-bottom-right flex-col overflow-hidden rounded-2xl border border-gold/25 bg-onyx-900/95 shadow-[0_30px_90px_-20px_rgba(0,0,0,0.85)] backdrop-blur-xl sm:right-6"
          >
            {/* header */}
            <div className="flex items-center gap-3 border-b border-white/8 bg-onyx-950/60 px-4 py-3.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-gold/40 bg-gold/10">
                <Gem className="h-4 w-4 text-gold" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.3em] text-gold">Ask JJ</p>
                <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mint opacity-75 [animation-duration:2.4s]" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-mint" />
                  </span>
                  grounded in JJ's own content
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close assistant"
                className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>

            {/* messages */}
            <div
              ref={scrollRef}
              className="flex-1 space-y-3 overflow-y-auto px-4 py-4 [scrollbar-color:rgba(212,168,87,0.35)_transparent] [scrollbar-width:thin]"
            >
              <div className="mr-6 rounded-xl rounded-tl-sm border border-white/8 bg-white/[0.04] px-3.5 py-2.5 text-[13px] leading-relaxed text-foreground/90">
                {WELCOME}
              </div>

              {showChips && (
                <div className="flex flex-wrap gap-2 pt-1" role="list" aria-label="Suggested questions">
                  {SUGGESTED.map((s) => (
                    <button
                      key={s}
                      type="button"
                      role="listitem"
                      onClick={() => void send(s)}
                      data-cursor="hover"
                      className="rounded-full border border-gold/30 bg-gold/5 px-3 py-1.5 text-left text-[11.5px] font-medium text-gold/90 transition-all duration-300 hover:border-gold/60 hover:bg-gold/10 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {messages.map((m, i) =>
                m.role === "user" ? (
                  <div
                    key={i}
                    className="ml-8 rounded-xl rounded-tr-sm border border-gold/25 bg-gold/10 px-3.5 py-2.5 text-[13px] leading-relaxed text-foreground"
                  >
                    {m.text}
                  </div>
                ) : (
                  <div
                    key={i}
                    className="mr-6 rounded-xl rounded-tl-sm border border-white/8 bg-white/[0.04] px-3.5 py-2.5 text-[13px] leading-relaxed text-foreground/90"
                  >
                    {m.text}
                  </div>
                )
              )}

              {status === "sending" && (
                <div className="mr-6 flex items-center gap-1.5 rounded-xl rounded-tl-sm border border-white/8 bg-white/[0.04] px-4 py-3" aria-label="JJ is typing">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="h-1.5 w-1.5 animate-bounce rounded-full bg-gold/80"
                      style={{ animationDelay: `${i * 0.15}s`, animationDuration: "0.9s" }}
                    />
                  ))}
                </div>
              )}

              {status === "error" && errorMsg && (
                <div role="alert" className="mr-6 rounded-xl border border-[#E5484D]/30 bg-[#E5484D]/10 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-red-200">
                  {errorMsg}{" "}
                  <a href="/contact" className="font-semibold text-gold underline decoration-gold/40 underline-offset-2 hover:decoration-gold">
                    Contact page →
                  </a>
                </div>
              )}
            </div>

            {/* composer */}
            <form
              className="flex items-center gap-2 border-t border-white/8 bg-onyx-950/60 px-3 py-3"
              onSubmit={(e) => {
                e.preventDefault();
                void send(input);
              }}
            >
              <label htmlFor="ask-jj-input" className="sr-only">
                Ask JJ a question
              </label>
              <input
                id="ask-jj-input"
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                maxLength={500}
                autoComplete="off"
                placeholder="Ask about projects, trading, skills…"
                className="h-10 min-w-0 flex-1 rounded-lg border border-white/10 bg-onyx-950/80 px-3.5 text-[13px] text-foreground placeholder:text-muted-foreground/70 focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/40"
              />
              <button
                type="submit"
                disabled={status === "sending" || input.trim().length === 0}
                aria-label="Send question"
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gold text-onyx-950 transition-all duration-300",
                  "hover:bg-gold-light hover:shadow-[0_0_24px_-6px_rgba(212,168,87,0.6)]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
                  "disabled:cursor-not-allowed disabled:opacity-40"
                )}
              >
                <Send className="h-4 w-4" aria-hidden />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
