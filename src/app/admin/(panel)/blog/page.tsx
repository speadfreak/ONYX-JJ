"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { AdminPageHeader, Panel, StatusBadge } from "@/components/admin/kit";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

interface AdminPost {
  id: string;
  slug: string;
  title: string;
  category: string;
  published: boolean;
  readingMinutes: number;
  updatedAt: string;
}

const CATEGORY_TONE: Record<string, "gold" | "mint" | "ice" | "muted"> = {
  "Dev Log": "gold",
  "Trading Insight": "mint",
  "Startup Notes": "ice",
};

export default function AdminBlogPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const postsQuery = useQuery({
    queryKey: ["admin-posts"],
    queryFn: async (): Promise<AdminPost[]> => {
      const res = await fetch("/api/admin/posts");
      if (!res.ok) throw new Error("Failed");
      const data = (await res.json()) as { ok: boolean; posts: AdminPost[] };
      return data.posts;
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Untitled Post" }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Create failed");
      }
      return res.json() as Promise<{ ok: boolean; post: { id: string } }>;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["admin-posts"] });
      window.location.href = `/admin/blog/${data.post.id}`;
    },
    onError: (e: Error) => toast({ title: "Create failed", description: e.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/posts/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      return res.json();
    },
    onSuccess: () => {
      setDeleteId(null);
      qc.invalidateQueries({ queryKey: ["admin-posts"] });
      toast({ title: "Post deleted" });
    },
    onError: () => toast({ title: "Delete failed", variant: "destructive" }),
  });

  const posts = postsQuery.data ?? [];

  return (
    <main className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-10">
      <AdminPageHeader
        title="Journal"
        description="Dev Logs, Trading Insights and Startup Notes — drafts stay off the public /blog until you publish."
        actions={
          <button
            onClick={() => create.mutate()}
            disabled={create.isPending}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-gold px-5 text-sm font-semibold text-onyx-950 transition-all hover:bg-gold-light disabled:opacity-60"
          >
            <Plus className="h-4 w-4" /> New post
          </button>
        }
      />

      {postsQuery.isLoading ? (
        <Panel>Loading posts…</Panel>
      ) : (
        <div className="space-y-3">
          {posts.map((p) => (
            <div key={p.id} className="flex items-center gap-3 rounded-xl border border-white/8 bg-onyx-900/40 p-3.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{p.title}</p>
                <p className="truncate font-mono text-[11px] text-muted-foreground">/blog/{p.slug}</p>
              </div>
              <StatusBadge tone={CATEGORY_TONE[p.category] ?? "muted"}>{p.category}</StatusBadge>
              <StatusBadge tone={p.published ? "mint" : "muted"}>{p.published ? "Published" : "Draft"}</StatusBadge>
              <Link
                href={`/admin/blog/${p.id}`}
                aria-label={`Edit ${p.title}`}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold"
              >
                <Pencil className="h-4 w-4" />
              </Link>
              <button
                onClick={() => setDeleteId(p.id)}
                aria-label={`Delete ${p.title}`}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-muted-foreground transition-colors hover:border-red-500/40 hover:text-red-400"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {posts.length === 0 && <Panel>No posts yet — start the Journal.</Panel>}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent className="border-white/10 bg-onyx-900">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this post?</AlertDialogTitle>
            <AlertDialogDescription>Removed permanently from the Journal. This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && remove.mutate(deleteId)}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              Delete permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
