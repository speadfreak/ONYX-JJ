"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, CheckCheck, Inbox, Mail, MailOpen, Trash2 } from "lucide-react";
import { AdminPageHeader, Panel } from "@/components/admin/kit";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface MessageRow {
  id: string;
  name: string;
  email: string;
  message: string;
  read: boolean;
  archived: boolean;
  createdAt: string;
}

type Filter = "all" | "unread" | "archived";

export default function AdminMessagesPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [filter, setFilter] = useState<Filter>("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-messages"] });
    qc.invalidateQueries({ queryKey: ["unread-count"] });
    qc.invalidateQueries({ queryKey: ["activity"] });
  };

  const messagesQuery = useQuery({
    queryKey: ["admin-messages", filter],
    queryFn: async (): Promise<{ messages: MessageRow[]; unread: number; total: number }> => {
      const res = await fetch(`/api/admin/messages?filter=${filter}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const patch = useMutation({
    mutationFn: async ({ id, body }: { id: string; body: Record<string, unknown> }) => {
      const res = await fetch(`/api/admin/messages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: invalidate,
    onError: () => toast({ title: "Update failed", variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/messages/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      setOpenId(null);
      invalidate();
      toast({ title: "Message deleted" });
    },
    onError: () => toast({ title: "Delete failed", variant: "destructive" }),
  });

  const markAll = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/messages", { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: invalidate,
    onError: () => toast({ title: "Failed", variant: "destructive" }),
  });

  const messages = messagesQuery.data?.messages ?? [];
  const open = messages.find((m) => m.id === openId) ?? null;

  return (
    <main className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-10">
      <AdminPageHeader
        title="Inbox"
        description="Submissions from the /contact form. JJ replies from his own mail — the envelope button opens a pre-filled draft."
        actions={
          <Button
            variant="outline"
            onClick={() => markAll.mutate()}
            disabled={markAll.isPending}
            className="border-white/10 bg-transparent text-foreground/80 hover:border-gold/40 hover:text-gold"
          >
            <CheckCheck className="h-4 w-4" /> Mark all read
          </Button>
        }
      />

      <div className="mb-5 flex gap-2">
        {(["all", "unread", "archived"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            aria-pressed={filter === f}
            className={cn(
              "rounded-full border px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.2em] transition-colors",
              filter === f ? "border-gold/60 bg-gold/10 text-gold" : "border-white/10 text-muted-foreground hover:text-foreground"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {messagesQuery.isLoading ? (
        <Panel>Loading inbox…</Panel>
      ) : (
        <div className="space-y-2.5">
          {messages.map((m) => (
            <button
              key={m.id}
              onClick={() => {
                setOpenId(m.id);
                if (!m.read) patch.mutate({ id: m.id, body: { read: true } });
              }}
              className={cn(
                "flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-all duration-200",
                m.read
                  ? "border-white/8 bg-onyx-900/30 hover:border-white/15"
                  : "border-gold/25 bg-onyx-900/60 hover:border-gold/50"
              )}
            >
              {m.read ? (
                <MailOpen className="h-4.5 w-4.5 shrink-0 text-muted-foreground" aria-hidden />
              ) : (
                <span className="relative shrink-0">
                  <Mail className="h-4.5 w-4.5 text-gold" aria-hidden />
                  <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-gold" aria-hidden />
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className={cn("block truncate text-sm", m.read ? "text-foreground/70" : "font-semibold text-foreground")}>
                  {m.name} <span className="font-normal text-muted-foreground">· {m.email}</span>
                </span>
                <span className="mt-0.5 block truncate text-xs text-muted-foreground">{m.message}</span>
              </span>
              <span className="shrink-0 font-mono text-[10px] tracking-[0.08em] text-muted-foreground">
                {new Date(m.createdAt).toLocaleDateString()}{" "}
                {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </button>
          ))}
          {messages.length === 0 && (
            <Panel className="flex items-center gap-3 text-muted-foreground">
              <Inbox className="h-5 w-5" aria-hidden /> {filter === "archived" ? "Nothing archived." : "Inbox zero — nice."}
            </Panel>
          )}
        </div>
      )}

      {/* Detail dialog */}
      <Dialog open={!!open} onOpenChange={(v) => !v && setOpenId(null)}>
        <DialogContent className="border-white/10 bg-onyx-900 sm:max-w-xl">
          {open && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-xl">{open.name}</DialogTitle>
                <p className="font-mono text-xs text-muted-foreground">{open.email}</p>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">
                  {new Date(open.createdAt).toLocaleString()}
                </p>
              </DialogHeader>
              <p className="whitespace-pre-wrap rounded-lg border border-white/8 bg-onyx-950/50 p-4 text-sm leading-relaxed text-foreground/90">
                {open.message}
              </p>
              <div className="flex flex-wrap gap-2.5">
                <a
                  href={`mailto:${open.email}?subject=Re: your message on JJ ONYX`}
                  className="inline-flex h-9 items-center gap-2 rounded-md bg-gold px-4 text-xs font-semibold text-onyx-950 transition-colors hover:bg-gold-light"
                >
                  <Mail className="h-3.5 w-3.5" /> Reply via mail
                </a>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => patch.mutate({ id: open.id, body: { read: !open.read } })}
                  className="border-white/10 bg-transparent text-foreground/80 hover:border-gold/40 hover:text-gold"
                >
                  {open.read ? <Mail className="h-3.5 w-3.5" /> : <MailOpen className="h-3.5 w-3.5" />}
                  Mark {open.read ? "unread" : "read"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => patch.mutate({ id: open.id, body: { archived: !open.archived } })}
                  className="border-white/10 bg-transparent text-foreground/80 hover:border-gold/40 hover:text-gold"
                >
                  <Archive className="h-3.5 w-3.5" /> {open.archived ? "Unarchive" : "Archive"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => remove.mutate(open.id)}
                  className="border-white/10 bg-transparent text-muted-foreground hover:border-red-500/40 hover:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
