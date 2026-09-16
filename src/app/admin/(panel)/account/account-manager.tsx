"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, KeyRound, Loader2, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AdminInput,
  AdminPageHeader,
  Field,
  Panel,
  SaveButton,
  StatusBadge,
} from "@/components/admin/kit";
import { cn } from "@/lib/utils";

interface AccountData {
  email: string;
  name: string;
  role: "owner" | "admin";
  status: string;
  createdAt: string;
  lastLoginAt: string | null;
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function PasswordInput(props: React.ComponentProps<"input">) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <AdminInput {...props} type={show ? "text" : "password"} className="pr-10" />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        aria-label={show ? "Hide password" : "Show password"}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-gold"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

function FormError({ message }: { message: string }) {
  return (
    <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
      {message}
    </p>
  );
}

export function AccountManager() {
  const router = useRouter();
  const { toast } = useToast();
  const qc = useQueryClient();

  const account = useQuery({
    queryKey: ["account"],
    queryFn: async (): Promise<AccountData> => {
      const res = await fetch("/api/admin/account");
      const data = (await res.json()) as { ok: boolean; account?: AccountData; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Failed to load your account.");
      return data.account!;
    },
  });

  // ── Email change ────────────────────────────────────────────────────────
  const [currentPwEmail, setCurrentPwEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [emailError, setEmailError] = useState("");

  const emailChange = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/account/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: currentPwEmail, newEmail }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string; email?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Failed to change email.");
      return data;
    },
    onSuccess: (data) => {
      setCurrentPwEmail("");
      setNewEmail("");
      setEmailError("");
      void qc.invalidateQueries({ queryKey: ["account"] });
      toast({
        title: "Email updated",
        description: `You're signed in as ${data.email}. Other sessions were signed out.`,
      });
      router.refresh(); // sidebar shows the new email
    },
    onError: (e: Error) => setEmailError(e.message),
  });

  // ── Password change ─────────────────────────────────────────────────────
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwError, setPwError] = useState("");

  const pwChange = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: currentPw,
          newPassword: newPw,
          confirmPassword: confirmPw,
        }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Failed to change password.");
      return data;
    },
    onSuccess: () => {
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
      setPwError("");
      toast({
        title: "Password changed",
        description: "Any other signed-in devices were logged out.",
      });
    },
    onError: (e: Error) => setPwError(e.message),
  });

  const pwMismatch = confirmPw.length > 0 && confirmPw !== newPw;

  return (
    <main className="mx-auto max-w-3xl px-5 py-8 sm:px-8 sm:py-10">
      <AdminPageHeader
        title="My Account"
        description="Manage your own credentials — available to every admin, owner included."
      />

      {/* ── Profile ─────────────────────────────────────────────────────── */}
      <Panel className="mb-6">
        {account.isLoading ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading account…
          </p>
        ) : account.isError ? (
          <FormError message={(account.error as Error).message} />
        ) : (
          <dl className="grid gap-5 sm:grid-cols-2">
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-[0.25em] text-gold/80">Name</dt>
              <dd className="mt-1.5 text-sm font-medium">{account.data!.name}</dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-[0.25em] text-gold/80">Email</dt>
              <dd className="mt-1.5 font-mono text-sm">{account.data!.email}</dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-[0.25em] text-gold/80">Role</dt>
              <dd className="mt-1.5">
                <StatusBadge tone={account.data!.role === "owner" ? "gold" : "ice"}>
                  {account.data!.role === "owner" ? "★ Owner" : "Admin"}
                </StatusBadge>
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-[0.25em] text-gold/80">Status</dt>
              <dd className="mt-1.5">
                <StatusBadge tone="mint">{account.data!.status}</StatusBadge>
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-[0.25em] text-gold/80">Last login</dt>
              <dd className="mt-1.5 text-sm text-muted-foreground">{fmtDate(account.data!.lastLoginAt)}</dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-[0.25em] text-gold/80">Account created</dt>
              <dd className="mt-1.5 text-sm text-muted-foreground">{fmtDate(account.data!.createdAt)}</dd>
            </div>
          </dl>
        )}
      </Panel>

      {/* ── Change email ────────────────────────────────────────────────── */}
      <Panel className="mb-6">
        <h2 className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.3em] text-gold">
          <Mail className="h-4 w-4" aria-hidden /> Change email
        </h2>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          Confirm your current password to make the change. For security, any other active
          sessions on this account are signed out afterwards.
        </p>
        <form
          className="mt-5 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setEmailError("");
            emailChange.mutate();
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="New email" htmlFor="new-email">
              <AdminInput
                id="new-email"
                type="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                autoComplete="off"
              />
            </Field>
            <Field label="Current password" htmlFor="cur-pw-email">
              <PasswordInput
                id="cur-pw-email"
                required
                value={currentPwEmail}
                onChange={(e) => setCurrentPwEmail(e.target.value)}
                autoComplete="current-password"
              />
            </Field>
          </div>
          {emailError && <FormError message={emailError} />}
          <SaveButton type="submit" pending={emailChange.isPending}>
            Update email
          </SaveButton>
        </form>
      </Panel>

      {/* ── Change password ─────────────────────────────────────────────── */}
      <Panel>
        <h2 className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.3em] text-gold">
          <KeyRound className="h-4 w-4" aria-hidden /> Change password
        </h2>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          Minimum 8 characters. You&apos;ll stay signed in here; every other device is signed out.
        </p>
        <form
          className="mt-5 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setPwError("");
            if (newPw !== confirmPw) {
              setPwError("New passwords do not match.");
              return;
            }
            pwChange.mutate();
          }}
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Current password" htmlFor="cur-pw">
              <PasswordInput
                id="cur-pw"
                required
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                autoComplete="current-password"
              />
            </Field>
            <Field label="New password" htmlFor="new-pw" hint="8+ chars">
              <PasswordInput
                id="new-pw"
                required
                minLength={8}
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                autoComplete="new-password"
              />
            </Field>
            <Field label="Confirm new password" htmlFor="cf-pw">
              <PasswordInput
                id="cf-pw"
                required
                minLength={8}
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                autoComplete="new-password"
                aria-invalid={pwMismatch || undefined}
                className={cn(pwMismatch && "border-red-500/50 focus-visible:ring-red-500/40")}
              />
            </Field>
          </div>
          {pwMismatch && <FormError message="New passwords do not match." />}
          {pwError && !pwMismatch && <FormError message={pwError} />}
          <SaveButton type="submit" pending={pwChange.isPending}>
            Update password
          </SaveButton>
        </form>
      </Panel>
    </main>
  );
}
