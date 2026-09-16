"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Status = "idle" | "sending" | "success" | "error";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Shared field chrome: onyx well, gold focus, floating-label peer wiring. */
const FIELD_CLASS =
  "peer w-full rounded-md border border-white/10 bg-onyx-950/60 text-sm text-foreground outline-none transition-all placeholder:text-transparent focus:border-gold/60 focus:shadow-[0_0_20px_-4px_rgba(212,168,87,0.4)] focus-visible:border-gold/60 focus-visible:ring-0 focus-visible:shadow-[0_0_20px_-4px_rgba(212,168,87,0.4)]";

const LABEL_CLASS =
  "pointer-events-none absolute left-4 text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-xs peer-placeholder-shown:text-muted-foreground/60 peer-focus:top-2 peer-focus:text-gold";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  // Honeypot — bots fill it, humans never see it (hidden below)
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setName("");
    setEmail("");
    setMessage("");
    setError(null);
    setStatus("idle");
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    // Client-side validation before the network hop
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError("All three fields are required — name, email, message.");
      return;
    }
    if (!EMAIL_RE.test(email.trim())) {
      setError("That email doesn't look right — mind double-checking it?");
      return;
    }

    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          message: message.trim(),
          website,
        }),
      });
      const data = (await res.json().catch(() => null)) as {
        ok?: boolean;
        error?: string;
      } | null;

      if (!res.ok || !data?.ok) {
        setStatus("error");
        setError(
          data?.error ?? "Something went wrong on the way out — try again in a moment."
        );
        return;
      }
      setStatus("success");
    } catch {
      setStatus("error");
      setError("Network hiccup — check your connection and try again.");
    }
  }

  return (
    <div className="rounded-2xl border border-white/8 bg-onyx-900/50 p-6 backdrop-blur sm:p-8">
      {status === "success" ? (
        <motion.div
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="flex min-h-[26rem] flex-col items-center justify-center gap-4 text-center"
          role="status"
        >
          <CheckCircle2 className="h-10 w-10 text-mint" aria-hidden />
          <p className="font-display text-2xl font-semibold text-foreground">
            Message received.
          </p>
          <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
            JJ will get back to you — usually within a day.
          </p>
          <button
            type="button"
            onClick={reset}
            data-cursor="hover"
            className="mt-4 inline-flex h-11 items-center rounded-md border border-white/15 px-6 text-sm font-semibold text-foreground transition-all duration-300 hover:border-gold/60 hover:text-gold"
          >
            Send another
          </button>
        </motion.div>
      ) : (
        <form
          onSubmit={handleSubmit}
          aria-label="Contact form"
          noValidate
          className="space-y-5"
        >
          {/* NAME */}
          <div className="relative">
            <Input
              id="contact-name"
              name="name"
              autoComplete="name"
              placeholder=" "
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={status === "sending"}
              className={`${FIELD_CLASS} h-13 px-4 pt-5`}
            />
            <label htmlFor="contact-name" className={`${LABEL_CLASS} top-2`}>
              Name
            </label>
          </div>

          {/* EMAIL */}
          <div className="relative">
            <Input
              id="contact-email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder=" "
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={status === "sending"}
              className={`${FIELD_CLASS} h-13 px-4 pt-5`}
            />
            <label htmlFor="contact-email" className={`${LABEL_CLASS} top-2`}>
              Email
            </label>
          </div>

          {/* MESSAGE */}
          <div className="relative">
            <Textarea
              id="contact-message"
              name="message"
              rows={5}
              placeholder=" "
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={status === "sending"}
              className={`${FIELD_CLASS} min-h-[10rem] resize-none px-4 pb-3 pt-6`}
            />
            <label htmlFor="contact-message" className={`${LABEL_CLASS} top-2.5`}>
              Message
            </label>
          </div>

          {/* HONEYPOT — invisible to humans; bots that fill it get silently dropped */}
          <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
            <label htmlFor="contact-website">Website</label>
            <input
              id="contact-website"
              name="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={status === "sending"}
            data-cursor="hover"
            className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-gold font-semibold tracking-wide text-onyx-950 transition-all duration-300 hover:glow-gold disabled:opacity-60"
          >
            {status === "sending" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                SENDING…
              </>
            ) : (
              <>
                <Send className="h-4 w-4" aria-hidden />
                Send it
              </>
            )}
          </button>

          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
        </form>
      )}
    </div>
  );
}
