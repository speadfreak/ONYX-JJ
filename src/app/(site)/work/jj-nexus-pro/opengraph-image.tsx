import { ImageResponse } from "next/og";
import { getProjectBySlug } from "@/lib/content";
import { buildBrandOg, buildCaseStudyOg, OG_HEIGHT, OG_WIDTH } from "@/lib/og-template";

export const size = { width: OG_WIDTH, height: OG_HEIGHT };
export const contentType = "image/png";
export const alt =
  "JJ NEXUS PRO — forex trading and live-streaming command center. Case study by Joseph James (JJ ONYX).";

const SLUG = "jj-nexus-pro";

export default async function Image() {
  let project;
  try {
    project = await getProjectBySlug(SLUG);
  } catch {
    project = undefined;
  }
  // Never throw — fall back to the brand template if the lookup fails.
  return new ImageResponse(project ? buildCaseStudyOg(project) : buildBrandOg(), size);
}
