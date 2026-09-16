import { ImageResponse } from "next/og";
import { getPostBySlug } from "@/lib/content";
import { buildBlogOg, buildBrandOg, OG_HEIGHT, OG_WIDTH } from "@/lib/og-template";

export const size = { width: OG_WIDTH, height: OG_HEIGHT };
export const contentType = "image/png";
export const alt = "Journal post from JJ ONYX — Joseph James, Builder · Trader · Storyteller.";

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let post;
  try {
    post = await getPostBySlug(slug);
  } catch {
    post = undefined;
  }
  // Unknown/failed slug still renders (brand default), never notFound().
  return new ImageResponse(post ? buildBlogOg(post) : buildBrandOg(), size);
}
