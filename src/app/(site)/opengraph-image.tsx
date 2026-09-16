import { ImageResponse } from "next/og";
import { buildBrandOg } from "@/lib/og-template";

/** Brand-default OG image inherited by every static page in the (site) group. */
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt =
  "JJ ONYX — Joseph James, Fullstack Developer × Forex Trader. Builder · Trader · Storyteller.";

export default async function Image() {
  return new ImageResponse(buildBrandOg(), size);
}
