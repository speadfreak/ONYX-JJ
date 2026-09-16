import type { Metadata } from "next";
import { Hero } from "@/components/home/hero";
import { StatsStrip } from "@/components/home/stats-strip";
import { FeaturedWork } from "@/components/home/featured-work";
import { TestimonialsCarousel } from "@/components/home/testimonials-carousel";
import { HomeCta } from "@/components/home/home-cta";
import { getHomeContent, getProjects, getSiteSettings, getTestimonials } from "@/lib/content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    absolute: "JJ Onyx — Joseph James | Fullstack Developer & Forex Trader",
  },
  description:
    "Cinematic portfolio of Joseph James — fullstack developer, forex trader & streamer building from Addis Ababa outward.",
};

export default async function HomePage() {
  // NOTE: the Preloader/audio gate is rendered by the (site) LAYOUT
  // (outside the route template) so its fixed overlay is never trapped
  // by the template's stacking context. It self-gates to "/" only.
  const [content, projects, testimonials, settings] = await Promise.all([
    getHomeContent(),
    getProjects(),
    getTestimonials(),
    getSiteSettings(),
  ]);

  return (
    <main className="relative">
      <Hero
        content={content}
        media={{
          videoEnabled: settings.videoEnabled,
          videoSrc: settings.heroVideo,
          poster: settings.heroPoster,
        }}
        profileImage={settings.profileImage}
        live={{ status: settings.liveStatus, url: settings.liveUrl }}
      />
      <StatsStrip stats={content.stats} />
      <FeaturedWork
        projects={projects}
        heading={content.featuredHeading}
        subheading={content.featuredSubheading}
      />
      <TestimonialsCarousel testimonials={testimonials} />
      <HomeCta />
    </main>
  );
}
