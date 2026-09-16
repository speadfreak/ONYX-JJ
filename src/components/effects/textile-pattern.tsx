/**
 * Abstract geometric linework inspired by Ethiopian tibeb / West African
 * textile patterns — interlocking diamonds and chevrons rendered as a
 * repeating SVG tile at low opacity. Never literal flags; pure texture.
 */
export function TextilePattern({
  className = "",
  mask = false,
}: {
  className?: string;
  /** Fade the pattern out radially from the center of the element */
  mask?: boolean;
}) {
  return (
    <div
      aria-hidden
      className={`jj-textile pointer-events-none absolute inset-0 opacity-40 ${
        mask ? "[mask-image:radial-gradient(ellipse_at_center,black,transparent_78%)]" : ""
      } ${className}`}
    />
  );
}
