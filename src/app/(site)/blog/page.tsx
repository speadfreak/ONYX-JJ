import type { Metadata } from "next";
import { PageHero } from "@/components/motion/page-hero";
import { BlogGrid } from "@/components/blog/blog-grid";
import { getPosts } from "@/lib/content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Journal",
  description:
    "Dev Logs, Trading Insights and Startup Notes — behind-the-scenes on the systems, the markets and the founder journey.",
};

export default async function BlogIndexPage() {
  const posts = await getPosts();

  return (
    <main className="relative">
      <PageHero
        kicker="The Journal"
        title={
          <>
            Notes from the <span className="gold-text">arena.</span>
          </>
        }
        description="Building in public: what shipped, what the market taught me this week, and what it's like founding from Addis Ababa at eighteen."
      />
      <BlogGrid posts={posts} />
    </main>
  );
}
