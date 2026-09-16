"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

/** Consistent page header for every admin section. */
export function AdminPageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}

/** Card container. */
export function Panel({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("rounded-xl border border-white/8 bg-onyx-900/40 p-5 sm:p-6", className)}>
      {children}
    </div>
  );
}

/** Labeled field wrapper. */
export function Field({
  label,
  hint,
  htmlFor,
  children,
  className,
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <Label htmlFor={htmlFor} className="font-mono text-[10px] uppercase tracking-[0.25em] text-gold/80">
          {label}
        </Label>
        {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

/** Styled text input for admin forms. */
export function AdminInput(props: React.ComponentProps<typeof Input>) {
  return (
    <Input
      {...props}
      className={cn("h-10 border-white/10 bg-onyx-950/60 text-sm focus-visible:ring-gold/50", props.className)}
    />
  );
}

/** Styled textarea for admin forms. */
export function AdminTextarea(props: React.ComponentProps<typeof Textarea>) {
  return (
    <Textarea
      {...props}
      className={cn("min-h-24 border-white/10 bg-onyx-950/60 text-sm focus-visible:ring-gold/50", props.className)}
    />
  );
}

/** Switch row with title + description. */
export function ToggleRow({
  title,
  description,
  checked,
  onCheckedChange,
  disabled,
  className,
}: {
  title: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-6 rounded-lg border border-white/5 bg-onyx-950/40 px-4 py-3.5", className)}>
      <div className="min-w-0">
        <p className="text-sm font-medium">{title}</p>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} aria-label={title} />
    </div>
  );
}

/** Primary save button with pending state. */
export function SaveButton({
  pending,
  children = "Save changes",
  onClick,
  type = "button",
  disabled,
  className,
}: {
  pending?: boolean;
  children?: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={pending || disabled}
      className={cn(
        "inline-flex h-10 items-center gap-2 rounded-md bg-gold px-5 text-sm font-semibold text-onyx-950 transition-all duration-300",
        "hover:bg-gold-light hover:shadow-[0_0_30px_-8px_rgba(212,168,87,0.6)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-onyx-950",
        (pending || disabled) && "cursor-not-allowed opacity-60",
        className
      )}
    >
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

/** Small mono badge. */
export function StatusBadge({ tone, children }: { tone: "gold" | "mint" | "muted" | "ice"; children: React.ReactNode }) {
  const tones = {
    gold: "border-gold/40 bg-gold/10 text-gold",
    mint: "border-mint/40 bg-mint/10 text-mint",
    ice: "border-ice/40 bg-ice/10 text-ice",
    muted: "border-white/10 bg-white/5 text-muted-foreground",
  } as const;
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em]", tones[tone])}>
      {children}
    </span>
  );
}
