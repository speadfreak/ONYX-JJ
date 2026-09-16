"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, LogIn } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/** Multi-admin login form — posts to the rate-limited /api/admin/login. */
export function AdminLoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const from = params.get("from") || "/admin";
  const invited = params.get("invited") === "1";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [status, setStatus] = useState<"idle" | "checking" | "error">("idle");
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "checking") return;
    setStatus("checking");
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setStatus("error");
        setError(data.error ?? "Invalid credentials.");
        return;
      }
      router.replace(from.startsWith("/admin") ? from : "/admin");
      router.refresh();
    } catch {
      setStatus("error");
      setError("Network error — try again.");
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      {invited && (
        <p
          role="status"
          className="rounded-lg border border-mint/40 bg-mint/10 px-4 py-3 text-sm text-mint"
        >
          Account ready — your password is set. Sign in below.
        </p>
      )}
      <div>
        <label htmlFor="admin-email" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.3em] text-gold/80">
          Email
        </label>
        <Input
          id="admin-email"
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@example.com"
          className="h-12 border-white/10 bg-onyx-950/60 font-mono text-sm focus-visible:ring-gold/50"
        />
      </div>

      <div>
        <label htmlFor="admin-password" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.3em] text-gold/80">
          Password
        </label>
        <div className="relative">
          <Input
            id="admin-password"
            type={showPw ? "text" : "password"}
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••"
            className="h-12 border-white/10 bg-onyx-950/60 pr-11 font-mono text-sm focus-visible:ring-gold/50"
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

      {status === "error" && (
        <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "checking"}
        className={cn(
          "flex h-12 w-full items-center justify-center gap-2.5 rounded-md bg-gold text-sm font-semibold tracking-wide text-onyx-950 transition-all duration-300",
          "hover:bg-gold-light hover:shadow-[0_0_40px_-8px_rgba(212,168,87,0.6)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-onyx-950",
          status === "checking" && "opacity-60"
        )}
      >
        {status === "checking" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Checking…
          </>
        ) : (
          <>
            <LogIn className="h-4 w-4" /> Enter the control room
          </>
        )}
      </button>
    </form>
  );
}
