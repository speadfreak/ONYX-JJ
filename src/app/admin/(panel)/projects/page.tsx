"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { AdminPageHeader, Panel, StatusBadge } from "@/components/admin/kit";
import { Switch } from "@/components/ui/switch";
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
import type { ProjectTag } from "@/lib/data/projects";

interface AdminProject {
  id: string;
  slug: string;
  title: string;
  tags: string;
  image: string;
  accent: string;
  published: boolean;
  order: number;
  year: string;
}

function parseTags(raw: string): ProjectTag[] {
  try {
    return JSON.parse(raw) as ProjectTag[];
  } catch {
    return [];
  }
}

export default function AdminProjectsPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const projectsQuery = useQuery({
    queryKey: ["admin-projects"],
    queryFn: async (): Promise<AdminProject[]> => {
      const res = await fetch("/api/admin/projects");
      if (!res.ok) throw new Error("Failed to load");
      const data = (await res.json()) as { ok: boolean; projects: AdminProject[] };
      return data.projects;
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, body }: { id: string; body: Record<string, unknown> }) => {
      const res = await fetch(`/api/admin/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Update failed");
      }
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-projects"] }),
    onError: (e: Error) => toast({ title: "Update failed", description: e.message, variant: "destructive" }),
  });

  const reorder = useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await fetch("/api/admin/projects/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      if (!res.ok) throw new Error("Reorder failed");
      return res.json();
    },
    onError: () => {
      toast({ title: "Reorder failed", variant: "destructive" });
      qc.invalidateQueries({ queryKey: ["admin-projects"] });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/projects/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      return res.json();
    },
    onSuccess: () => {
      setDeleteId(null);
      qc.invalidateQueries({ queryKey: ["admin-projects"] });
      toast({ title: "Project deleted" });
    },
    onError: () => toast({ title: "Delete failed", variant: "destructive" }),
  });

  const create = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Untitled Project" }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Create failed");
      }
      return res.json() as Promise<{ ok: boolean; project: { id: string } }>;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["admin-projects"] });
      window.location.href = `/admin/projects/${data.project.id}`;
    },
    onError: (e: Error) => toast({ title: "Create failed", description: e.message, variant: "destructive" }),
  });

  const projects = projectsQuery.data ?? [];
  const [localOrder, setLocalOrder] = useState<AdminProject[] | null>(null);
  const list = localOrder ?? projects;

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = list.findIndex((p) => p.id === active.id);
    const newIndex = list.findIndex((p) => p.id === over.id);
    const next = arrayMove(list, oldIndex, newIndex);
    setLocalOrder(next);
    reorder.mutate(next.map((p) => p.id));
    // clear optimistic state after the query refreshes
    setTimeout(() => setLocalOrder(null), 800);
  };

  return (
    <main className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-10">
      <AdminPageHeader
        title="Projects"
        description="Drag to reorder — the public /work grid and home featured section follow this order. Drafts stay hidden from visitors."
        actions={
          <button
            onClick={() => create.mutate()}
            disabled={create.isPending}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-gold px-5 text-sm font-semibold text-onyx-950 transition-all hover:bg-gold-light disabled:opacity-60"
          >
            <Plus className="h-4 w-4" /> New project
          </button>
        }
      />

      {projectsQuery.isLoading ? (
        <Panel>Loading projects…</Panel>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={list.map((p) => p.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {list.map((p) => (
                <SortableRow
                  key={p.id}
                  project={p}
                  onToggle={(published) => update.mutate({ id: p.id, body: { published } })}
                  onDelete={() => setDeleteId(p.id)}
                  pending={update.isPending}
                />
              ))}
              {list.length === 0 && <Panel>No projects yet — create your first one.</Panel>}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent className="border-white/10 bg-onyx-900">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this project?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the project and its case-study content from the site. This cannot be undone.
            </AlertDialogDescription>
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

function SortableRow({
  project,
  onToggle,
  onDelete,
  pending,
}: {
  project: AdminProject;
  onToggle: (published: boolean) => void;
  onDelete: () => void;
  pending: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: project.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={
        "flex items-center gap-3 rounded-xl border border-white/8 bg-onyx-900/40 p-3.5 transition-shadow " +
        (isDragging ? "z-10 shadow-[0_20px_50px_-12px_rgba(212,168,87,0.25)]" : "")
      }
    >
      <button
        {...attributes}
        {...listeners}
        aria-label={`Reorder ${project.title}`}
        className="cursor-grab touch-none rounded-md p-2 text-muted-foreground transition-colors hover:bg-white/5 hover:text-gold active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <div className="relative hidden h-12 w-20 shrink-0 overflow-hidden rounded-md border border-white/10 sm:block">
        { }
        <img src={project.image} alt="" className="h-full w-full object-cover opacity-80" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{project.title}</p>
        <p className="truncate font-mono text-[11px] text-muted-foreground">/work/{project.slug}</p>
      </div>

      <div className="hidden gap-1.5 md:flex">
        {parseTags(project.tags).slice(0, 3).map((t) => (
          <StatusBadge key={t} tone="muted">{t}</StatusBadge>
        ))}
      </div>

      <StatusBadge tone={project.published ? "mint" : "muted"}>
        {project.published ? "Live" : "Draft"}
      </StatusBadge>

      <div className="flex items-center gap-2">
        <Switch
          checked={project.published}
          onCheckedChange={onToggle}
          disabled={pending}
          aria-label={`Publish ${project.title}`}
        />
        <Link
          href={`/admin/projects/${project.id}`}
          aria-label={`Edit ${project.title}`}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold"
        >
          <Pencil className="h-4 w-4" />
        </Link>
        <button
          onClick={onDelete}
          aria-label={`Delete ${project.title}`}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-muted-foreground transition-colors hover:border-red-500/40 hover:text-red-400"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
