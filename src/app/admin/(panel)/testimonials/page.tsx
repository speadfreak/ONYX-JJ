"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Save, Trash2, X } from "lucide-react";
import {
  AdminInput,
  AdminPageHeader,
  AdminTextarea,
  Field,
  Panel,
  SaveButton,
  StatusBadge,
} from "@/components/admin/kit";
import { AssetUpload } from "@/components/admin/asset-upload";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface TestimonialRow {
  id: string;
  name: string;
  role: string;
  quote: string;
  photo: string | null;
  order: number;
  published: boolean;
}

const EMPTY = { id: "", name: "", role: "", quote: "", photo: "", order: 0, published: true };

export default function AdminTestimonialsPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [editing, setEditing] = useState<typeof EMPTY | null>(null);
  const [isNew, setIsNew] = useState(false);

  const listQuery = useQuery({
    queryKey: ["admin-testimonials"],
    queryFn: async (): Promise<TestimonialRow[]> => {
      const res = await fetch("/api/admin/testimonials");
      if (!res.ok) throw new Error("Failed");
      const data = (await res.json()) as { ok: boolean; testimonials: TestimonialRow[] };
      return data.testimonials;
    },
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-testimonials"] });

  const save = useMutation({
    mutationFn: async (row: typeof EMPTY) => {
      const url = isNew ? "/api/admin/testimonials" : `/api/admin/testimonials/${row.id}`;
      const res = await fetch(url, {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(row),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Save failed");
      return data;
    },
    onSuccess: () => {
      invalidate();
      setEditing(null);
      toast({ title: isNew ? "Testimonial added" : "Testimonial saved" });
    },
    onError: (e: Error) => toast({ title: "Save failed", description: e.message, variant: "destructive" }),
  });

  const toggle = useMutation({
    mutationFn: async ({ id, published }: { id: string; published: boolean }) => {
      const res = await fetch(`/api/admin/testimonials/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: invalidate,
    onError: () => toast({ title: "Update failed", variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/testimonials/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      invalidate();
      toast({ title: "Testimonial deleted" });
    },
    onError: () => toast({ title: "Delete failed", variant: "destructive" }),
  });

  const rows = [...(listQuery.data ?? [])].sort((a, b) => a.order - b.order);

  const openEdit = (t: TestimonialRow) => {
    setIsNew(false);
    setEditing({ id: t.id, name: t.name, role: t.role, quote: t.quote, photo: t.photo ?? "", order: t.order, published: t.published });
  };

  return (
    <main className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-10">
      <AdminPageHeader
        title="Testimonials"
        description="Feeds the auto-rotating carousel on the home page. Order = carousel sequence."
        actions={
          <button
            onClick={() => {
              setIsNew(true);
              setEditing({ ...EMPTY, order: rows.length });
            }}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-gold px-5 text-sm font-semibold text-onyx-950 transition-all hover:bg-gold-light"
          >
            <Plus className="h-4 w-4" /> Add testimonial
          </button>
        }
      />

      {listQuery.isLoading ? (
        <Panel>Loading…</Panel>
      ) : (
        <div className="space-y-3">
          {rows.map((t) => (
            <div key={t.id} className="rounded-xl border border-white/8 bg-onyx-900/40 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">
                    {t.name} <span className="font-normal text-muted-foreground">· {t.role}</span>
                  </p>
                  <p className="mt-1.5 line-clamp-2 text-sm italic text-foreground/80">“{t.quote}”</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <StatusBadge tone={t.published ? "mint" : "muted"}>{t.published ? "Live" : "Hidden"}</StatusBadge>
                  <label className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                    Order
                    <input
                      type="number"
                      defaultValue={t.order}
                      key={`${t.id}-${t.order}`}
                      aria-label={`Order for ${t.name}`}
                      onBlur={(e) => {
                        const order = parseInt(e.target.value, 10) || 0;
                        if (order !== t.order) {
                          fetch(`/api/admin/testimonials/${t.id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ order }),
                          }).then(() => invalidate());
                        }
                      }}
                      className="h-8 w-14 rounded-md border border-white/10 bg-onyx-950/60 px-2 text-center font-mono text-xs"
                    />
                  </label>
                  <button
                    onClick={() => openEdit(t)}
                    aria-label={`Edit ${t.name}`}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => remove.mutate(t.id)}
                    aria-label={`Delete ${t.name}`}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-muted-foreground transition-colors hover:border-red-500/40 hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="mt-3 border-t border-white/5 pt-3">
                <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={t.published}
                    onChange={(e) => toggle.mutate({ id: t.id, published: e.target.checked })}
                    className="h-3.5 w-3.5 accent-[#D4A857]"
                  />
                  Visible on the public carousel
                </label>
              </div>
            </div>
          ))}
          {rows.length === 0 && <Panel>No testimonials yet.</Panel>}
        </div>
      )}

      {/* Edit / create dialog */}
      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto border-white/10 bg-onyx-900 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">{isNew ? "New testimonial" : "Edit testimonial"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                save.mutate(editing);
              }}
              className="space-y-4"
            >
              <Field label="Name" htmlFor="t-name">
                <AdminInput id="t-name" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              </Field>
              <Field label="Role / company" htmlFor="t-role">
                <AdminInput id="t-role" value={editing.role} onChange={(e) => setEditing({ ...editing, role: e.target.value })} />
              </Field>
              <Field label="Quote" htmlFor="t-quote">
                <AdminTextarea id="t-quote" value={editing.quote} onChange={(e) => setEditing({ ...editing, quote: e.target.value })} />
              </Field>
              <Field label="Photo" hint="optional">
                <AssetUpload kind="photo" value={editing.photo} onChange={(url) => setEditing({ ...editing, photo: url })} maxWidth={120} />
              </Field>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="inline-flex h-10 items-center gap-2 rounded-md border border-white/10 px-4 text-sm text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" /> Cancel
                </button>
                <SaveButton type="submit" pending={save.isPending}>
                  <Save className="h-4 w-4" /> Save
                </SaveButton>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
