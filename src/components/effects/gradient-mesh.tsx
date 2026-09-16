/**
 * Subtle animated gradient mesh rendered behind key headlines —
 * two drifting gold blobs (+ optional emerald) keep dark sections "alive".
 * Pure CSS animation; decorates via absolute positioning inside a relative parent.
 */
export function GradientMesh({
  variant = "gold",
  className = "",
}: {
  variant?: "gold" | "gold-mint";
  className?: string;
}) {
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <div className="jj-mesh-blob jj-mesh-a" />
      <div className="jj-mesh-blob jj-mesh-b" />
      {variant === "gold-mint" && <div className="jj-mesh-blob jj-mesh-c" />}
    </div>
  );
}
