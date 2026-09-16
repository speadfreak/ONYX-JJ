"use client";

import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

/**
 * XSS-safe markdown renderer for admin-editable content.
 * react-markdown escapes raw HTML by default (no rehype-raw) — arbitrary
 * markup can never execute on the public site.
 */
export function Prose({
  content,
  className,
  components,
}: {
  content: string;
  className?: string;
  components?: React.ComponentProps<typeof ReactMarkdown>["components"];
}) {
  return (
    <div className={cn("prose-onyx", className)}>
      <ReactMarkdown components={components}>{content}</ReactMarkdown>
    </div>
  );
}
