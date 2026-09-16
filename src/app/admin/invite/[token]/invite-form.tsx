"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Eye, EyeOff, Loader2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Phase = "loading" | "invalid" | "ready" | "submitting" | "done";

interface InviteInfo {
  name: string;
  email: string;
}

export function InviteAcceptForm({ token }: { token: string }) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [info, setInfo] = useState<InviteInfo | null>(null);
  const [loadError, setLoadError] = useState("");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");

  // Validate the token on mount so the page can greet the invited person.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/admin/invite/validate?token=${encodeURIComponent(token)}`);
        const data = (await res.json()) as { ok: boolean; name?: string; email?: string; error?: string };
        if (cancelled) return;
        if (!res.ok || !data.ok) {
          setLoadError(data.error ?? "This invite link is not valid.");
          setPhase("invalid");
          return;
        }
        setInfo({ name: data.name!, email: data.email! });
        setPhase("ready");
      } catch {
        if (!cancelled) {
          setLoadError("Network error — try again.");
          setPhase("invalid");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phase === "submitting") return;
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setPhase("submitting");
    setError("");
    try {
      const res = await fetch("/api/admin/invite/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Could not complete the setup.");
        setPhase("ready");
        return;
      }
      setPhase("done");
    } catch {
      setError("Network error — try again.");
      setPhase("ready");
    }
  };

  if (phase === "loading") {
    return (
      <p className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Checking your invite…
      </p>
    );
  }

  if (phase === "invalid") {
    return (
      <div className="py-4 text-center">
        <XCircle className="mx-auto h-10 w-10 text-red-400" aria-hidden />
        <h2 className="mt-4 font-display text-xl font-semibold">Invite not valid</h2>
        <p role="alert" className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {loadError}
        </p>
        <Link
          href="/admin/login"
          className="mt-6 inline-flex h-11 items-center rounded-md border border-gold/50 px-6 text-sm font-semibold text-gold transition-colors hover:bg-gold/10"
        >
          Go to sign in
        </Link>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className="py-4 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-mint" aria-hidden />
        <h2 className="mt-4 font-display text-xl font-semibold">You&apos;re all set</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Your password is saved and your account is active. Sign in to enter the Control Room.
        </p>
        <Link
          href="/admin/login?invited=1"
          className="mt-6 inline-flex h-11 items-center rounded-md bg-gold px-6 text-sm font-semibold text-onyx-950 transition-all hover:bg-gold-light hover:shadow-[0_0_40px_-8px_rgba(212,168,87,0.6)]"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <div className="rounded-lg border border-gold/30 bg-gold/5 px-4 py-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-gold">Invited</p>
        <p className="mt-1 text-sm font-medium">{info?.name}</p>
        <p className="font-mono text-xs text-muted-foreground">{info?.email}</p>
      </div>

      <div>
        <label htmlFor="invite-pw" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.3em] text-gold/80">
          Choose a password
        </label>
        <div className="relative">
          <input
            id="invite-pw"
            type={showPw ? "text" : "password"}
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            placeholder="At least 8 characters"
            className="flex h-12 w-full rounded-md border border-white/10 bg-onyx-950/60 px-4 pr-11 font-mono text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            aria-label={showPw ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-gold"
          >
            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div>
        <label htmlFor="invite-pw2" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.3em] text-gold/80">
          Confirm password
        </label>
        <input
          id="invite-pw2"
          type={showPw ? "text" : "password"}
          required
          minLength={8}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
          className={cn(
            "flex h-12 w-full rounded-md border border-white/10 bg-onyx-950/60 px-4 font-mono text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50",
            confirm.length > 0 && confirm !== password && "border-red-500/40"
          )}
        />
      </div>

      {error && (
        <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={phase === "submitting"}
        className={cn(
          "flex h-12 w-full items-center justify-center gap-2.5 rounded-md bg-gold text-sm font-semibold tracking-wide text-onyx-950 transition-all duration-300",
          "hover:bg-gold-light hover:shadow-[0_0_40px_-8px_rgba(212,168,87,0.6)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-onyx-950",
          phase === "submitting" && "opacity-60"
        )}
      >
        {phase === "submitting" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Saving…
          </>
        ) : (
          "Set password & activate"
        )}
      </button>

      <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
        This link works once and expires 48 hours after it was created.
      </p>
    </form>
  );
}
