"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  Copy,
  Loader2,
  Mail,
  Pencil,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UserPlus,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

// ── Types ─────────────────────────────────────────────────────────────────

interface TeamAdmin {
  id: string;
  email: string;
  name: string;
  role: "owner" | "admin";
  status: "active" | "invited" | "disabled";
  createdAt: string;
  lastLoginAt: string | null;
  inviteExpiresAt: string | null;
  invitedByEmail: string | null;
}

interface InvitePayload {
  url: string;
  expiresAt: string;
}

function timeAgo(iso: string | null): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const okFlag = document.execCommand("copy");
      document.body.removeChild(ta);
      return okFlag;
    } catch {
      return false;
    }
  }
}

// ── Copyable invite-link box (shown once, after creating/re-sending) ──────

function InviteLinkBox({ invite, onClose }: { invite: InvitePayload; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="rounded-lg border border-gold/40 bg-gold/5 p-4">
      <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-gold">
        <Mail className="h-3.5 w-3.5" aria-hidden /> Invite link — shown once
      </p>
      <div className="mt-3 flex items-center gap-2">
        <input
          readOnly
          value={invite.url}
          onFocus={(e) => e.currentTarget.select()}
          aria-label="Invite link"
          className="h-10 w-full truncate rounded-md border border-white/10 bg-onyx-950/80 px-3 font-mono text-xs text-gold-light"
        />
        <button
          type="button"
          onClick={async () => {
            if (await copyText(invite.url)) {
              setCopied(true);
              setTimeout(() => setCopied(false), 2500);
            }
          }}
          className="flex h-10 shrink-0 items-center gap-1.5 rounded-md border border-gold/50 px-3 text-xs font-semibold text-gold transition-colors hover:bg-gold/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        Send this link to the new admin <strong className="text-foreground">through a secure channel</strong>.
        It works exactly once and expires {fmtDate(invite.expiresAt)}. They choose their own password —
        you never see it.
      </p>
      <p className="mt-2 rounded-md border border-white/10 bg-onyx-950/60 px-3 py-2 font-mono text-[10px] leading-relaxed tracking-wide text-muted-foreground">
        TODO(email): no email service is wired up yet — the link is shown here for manual delivery.
        An integration (e.g. Resend or SendGrid) can automate this later.
      </p>
      <div className="mt-4 flex justify-end">
        <SaveButton pending={false} onClick={onClose}>
          Done
        </SaveButton>
      </div>
    </div>
  );
}

// ── Add-admin dialog ───────────────────────────────────────────────────────

function AddAdminDialog({
  open,
  onOpenChange,
  onInvited,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onInvited: (invite: InvitePayload) => void;
}) {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("admin");
  const [error, setError] = useState("");

  const create = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, role }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        error?: string;
        invite?: InvitePayload;
      };
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Failed to create the invite.");
      return data.invite!;
    },
    onSuccess: (invite) => {
      onInvited(invite);
      toast({ title: "Invite created", description: "Copy the link and send it securely." });
      setEmail("");
      setName("");
      setRole("admin");
      setError("");
    },
    onError: (e: Error) => setError(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !create.isPending && onOpenChange(v)}>
      <DialogContent className="border-white/10 bg-onyx-950 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Add new admin</DialogTitle>
          <DialogDescription>
            They&apos;ll receive a one-time invite link and set their own password.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setError("");
            create.mutate();
          }}
          className="space-y-4"
        >
          <Field label="Email" htmlFor="invite-email">
            <AdminInput
              id="invite-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="teammate@example.com"
              autoComplete="off"
            />
          </Field>
          <Field label="Name" htmlFor="invite-name">
            <AdminInput
              id="invite-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Their full name"
              maxLength={80}
            />
          </Field>
          <Field label="Role" htmlFor="invite-role" hint="owner is unique to JJ">
            <select
              id="invite-role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="h-10 w-full rounded-md border border-white/10 bg-onyx-950/60 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
            >
              <option value="admin">admin — content &amp; operations</option>
              <option value="owner" disabled>
                owner — protected, unique to JJ
              </option>
            </select>
          </Field>

          {error && (
            <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </p>
          )}

          <DialogFooter>
            <SaveButton type="submit" pending={create.isPending}>
              <UserPlus className="h-4 w-4" /> Create invite
            </SaveButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Edit dialog ─────────────────────────────────────────────────────────────

function EditAdminDialog({
  admin,
  onClose,
}: {
  admin: TeamAdmin | null;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [active, setActive] = useState(true);
  const [error, setError] = useState("");
  const [loadedFor, setLoadedFor] = useState<string | null>(null);

  if (admin && loadedFor !== admin.id) {
    setName(admin.name);
    setActive(admin.status === "active");
    setError("");
    setLoadedFor(admin.id);
  }

  const isOwner = admin?.role === "owner";
  const invited = admin?.status === "invited";

  const save = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/team/${admin!.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, status: active ? "active" : "disabled" }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string; unchanged?: boolean };
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Failed to save.");
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["team"] });
      toast({ title: "Admin updated" });
      onClose();
    },
    onError: (e: Error) => setError(e.message),
  });

  return (
    <Dialog
      open={!!admin}
      onOpenChange={(v) => {
        if (!v) {
          setLoadedFor(null);
          onClose();
        }
      }}
    >
      <DialogContent className="border-white/10 bg-onyx-950 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Edit admin</DialogTitle>
          <DialogDescription>
            {admin?.email}
            {isOwner && " — this is the protected owner account."}
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setError("");
            save.mutate();
          }}
          className="space-y-4"
        >
          <Field label="Name" htmlFor="edit-name">
            <AdminInput
              id="edit-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
            />
          </Field>

          <div className="flex items-center justify-between gap-6 rounded-lg border border-white/5 bg-onyx-950/40 px-4 py-3.5">
            <div className="min-w-0">
              <p className="text-sm font-medium">{active ? "Account active" : "Account disabled"}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {invited
                  ? "Pending invite — they must complete setup first."
                  : active
                    ? "Sign-ins allowed."
                    : "Sign-ins blocked and live sessions killed immediately."}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={active}
              disabled={invited || isOwner}
              onClick={() => setActive((v) => !v)}
              aria-label={active ? "Disable account" : "Enable account"}
              className={cn(
                "relative h-6 w-11 shrink-0 rounded-full transition-colors",
                active ? "bg-mint/80" : "bg-white/15",
                (invited || isOwner) && "cursor-not-allowed opacity-40"
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform",
                  active ? "translate-x-[22px]" : "translate-x-0.5"
                )}
              />
            </button>
          </div>

          {isOwner && (
            <p className="rounded-lg border border-gold/30 bg-gold/5 px-4 py-3 text-xs leading-relaxed text-gold">
              <ShieldCheck className="mr-1.5 inline h-3.5 w-3.5" aria-hidden />
              The owner account can never be disabled, demoted, or deleted — this protects
              JJ from ever being locked out of his own site. Only the name is editable.
            </p>
          )}

          {error && (
            <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </p>
          )}

          <DialogFooter>
            <SaveButton type="submit" pending={save.isPending}>
              Save changes
            </SaveButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Delete dialog (type-the-email confirmation) ────────────────────────────

function DeleteAdminDialog({
  admin,
  onClose,
}: {
  admin: TeamAdmin | null;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loadedFor, setLoadedFor] = useState<string | null>(null);

  if (admin && loadedFor !== admin.id) {
    setConfirm("");
    setError("");
    setLoadedFor(admin.id);
  }

  const del = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/team/${admin!.id}`, { method: "DELETE" });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Failed to delete.");
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["team"] });
      toast({ title: "Admin deleted", description: `${admin?.email} was removed.` });
      onClose();
    },
    onError: (e: Error) => setError(e.message),
  });

  const matches = confirm.trim().toLowerCase() === admin?.email.toLowerCase();

  return (
    <Dialog
      open={!!admin}
      onOpenChange={(v) => {
        if (!v) {
          setLoadedFor(null);
          onClose();
        }
      }}
    >
      <DialogContent className="border-red-500/30 bg-onyx-950 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-red-300">Delete admin</DialogTitle>
          <DialogDescription>
            This permanently removes <span className="font-mono text-foreground">{admin?.email}</span>{" "}
            ({admin?.name}) and cannot be undone. Their sessions die immediately.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!matches) return;
            setError("");
            del.mutate();
          }}
          className="space-y-4"
        >
          <Field label={`Type "${admin?.email ?? ""}" to confirm`} htmlFor="delete-confirm">
            <AdminInput
              id="delete-confirm"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder={admin?.email}
              autoComplete="off"
              className="border-red-500/30 focus-visible:ring-red-500/50"
            />
          </Field>

          {error && (
            <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </p>
          )}

          <DialogFooter>
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-md border border-white/15 px-5 text-sm font-semibold text-foreground transition-colors hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!matches || del.isPending}
              className="inline-flex h-10 items-center gap-2 rounded-md bg-red-500 px-5 text-sm font-semibold text-white transition-all hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {del.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              <Trash2 className="h-4 w-4" /> Delete forever
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Main manager ─────────────────────────────────────────────────────────────

export function TeamManager() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<TeamAdmin | null>(null);
  const [deleting, setDeleting] = useState<TeamAdmin | null>(null);
  const [invite, setInvite] = useState<InvitePayload | null>(null);

  const team = useQuery({
    queryKey: ["team"],
    queryFn: async (): Promise<TeamAdmin[]> => {
      const res = await fetch("/api/admin/team");
      const data = (await res.json()) as { ok: boolean; admins?: TeamAdmin[]; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Failed to load the team.");
      return data.admins ?? [];
    },
  });

  const resend = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/team/${id}/invite`, { method: "POST" });
      const data = (await res.json()) as { ok: boolean; error?: string; invite?: InvitePayload };
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Failed to re-invite.");
      return data.invite!;
    },
    onSuccess: (inv) => {
      void qc.invalidateQueries({ queryKey: ["team"] });
      setInvite(inv);
    },
    onError: (e: Error) =>
      toast({ title: "Re-invite failed", description: e.message, variant: "destructive" }),
  });

  const admins = team.data ?? [];
  const inviteExpired = (a: TeamAdmin) =>
    a.status === "invited" && a.inviteExpiresAt && new Date(a.inviteExpiresAt).getTime() < Date.now();

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
      <AdminPageHeader
        title="Team"
        description="Every admin account on JJ ONYX. The owner account can never be deleted, disabled, or demoted."
        actions={
          <SaveButton pending={false} onClick={() => setAddOpen(true)}>
            <UserPlus className="h-4 w-4" /> Add new admin
          </SaveButton>
        }
      />

      {invite && (
        <div className="mb-6">
          <InviteLinkBox invite={invite} onClose={() => setInvite(null)} />
        </div>
      )}

      {team.isLoading ? (
        <Panel>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading team…
          </p>
        </Panel>
      ) : team.isError ? (
        <Panel>
          <p role="alert" className="text-sm text-red-300">
            {(team.error as Error).message}
          </p>
        </Panel>
      ) : (
        <Panel className="overflow-x-auto p-0">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                <th className="px-5 py-4 font-medium">Admin</th>
                <th className="px-4 py-4 font-medium">Role</th>
                <th className="px-4 py-4 font-medium">Status</th>
                <th className="px-4 py-4 font-medium">Last login</th>
                <th className="px-4 py-4 font-medium">Invited by</th>
                <th className="px-4 py-4 font-medium">Created</th>
                <th className="px-5 py-4 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((a) => {
                const expired = inviteExpired(a);
                return (
                  <tr
                    key={a.id}
                    className={cn(
                      "border-b border-white/5 transition-colors last:border-0 hover:bg-white/[0.03]",
                      a.status === "disabled" && "opacity-55"
                    )}
                  >
                    <td className="px-5 py-4">
                      <p className="font-medium text-foreground">
                        {a.name}
                        {a.role === "owner" && (
                          <span className="ml-2 font-mono text-[9px] uppercase tracking-[0.25em] text-gold">
                            ★
                          </span>
                        )}
                      </p>
                      <p className="mt-0.5 font-mono text-xs text-muted-foreground">{a.email}</p>
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge tone={a.role === "owner" ? "gold" : "ice"}>{a.role}</StatusBadge>
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge
                        tone={a.status === "active" ? "mint" : a.status === "invited" ? "gold" : "muted"}
                      >
                        {expired ? "invite expired" : a.status}
                      </StatusBadge>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">{timeAgo(a.lastLoginAt)}</td>
                    <td className="px-4 py-4 font-mono text-xs text-muted-foreground">
                      {a.invitedByEmail ?? "—"}
                    </td>
                    <td className="px-4 py-4 text-xs text-muted-foreground">{fmtDate(a.createdAt)}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        {a.status === "invited" && (
                          <button
                            type="button"
                            onClick={() => resend.mutate(a.id)}
                            disabled={resend.isPending}
                            aria-label={`Re-send invite to ${a.email}`}
                            title={expired ? "Invite expired — send a fresh link" : "Re-send invite link"}
                            className="flex h-8 w-8 items-center justify-center rounded-md border border-gold/40 text-gold transition-colors hover:bg-gold/10 disabled:opacity-50"
                          >
                            {resend.isPending ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <RefreshCw className="h-3.5 w-3.5" />
                            )}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setEditing(a)}
                          aria-label={`Edit ${a.email}`}
                          className="flex h-8 w-8 items-center justify-center rounded-md border border-white/10 text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        {a.role === "owner" ? (
                          <span
                            title="The owner account can never be deleted"
                            aria-label="Owner account cannot be deleted"
                            className="flex h-8 w-8 items-center justify-center rounded-md border border-transparent text-muted-foreground/40"
                          >
                            <ShieldCheck className="h-3.5 w-3.5" />
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDeleting(a)}
                            aria-label={`Delete ${a.email}`}
                            className="flex h-8 w-8 items-center justify-center rounded-md border border-white/10 text-muted-foreground transition-colors hover:border-red-500/50 hover:text-red-300"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Panel>
      )}

      <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
        All account changes (invites, edits, deletions, password &amp; email changes) are written
        to the activity log — see the Dashboard feed for the audit trail.
      </p>

      <AddAdminDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onInvited={(inv) => {
          setAddOpen(false);
          setInvite(inv);
          void qc.invalidateQueries({ queryKey: ["team"] });
        }}
      />
      <EditAdminDialog admin={editing} onClose={() => setEditing(null)} />
      <DeleteAdminDialog admin={deleting} onClose={() => setDeleting(null)} />
    </main>
  );
}
