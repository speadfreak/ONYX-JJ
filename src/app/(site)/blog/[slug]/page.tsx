import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ReadingFrame } from "@/components/blog/reading-frame";
import { getPostBySlug } from "@/lib/content";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Journal" };
  return {
    title: post.title,
    description: post.excerpt || undefined,
    openGraph: {
      title: post.title,
      description: post.excerpt || undefined,
      type: "article",
      // og:image comes from the file-convention opengraph-image.tsx
      // (on-brand generated 1200×630 template) — do not override it here.
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const fmtDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <ReadingFrame category={post.category} title={post.title} date={fmtDate} minutes={post.readingMinutes} content={post.content}>
      {post.coverImage && (
        <div className="relative mx-auto mt-14 aspect-[21/9] w-full max-w-5xl overflow-hidden rounded-xl border border-white/8">
          <Image
            src={post.coverImage}
            alt=""
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 1024px"
            className="object-cover"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-onyx-950/40 to-transparent" />
        </div>
      )}
    </ReadingFrame>
  );
}
