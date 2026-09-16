import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { GradientMesh } from "@/components/effects/gradient-mesh";
import { TextilePattern } from "@/components/effects/textile-pattern";
import { GoldDivider } from "@/components/motion/gold-divider";
import { PageHero } from "@/components/motion/page-hero";
import { Reveal } from "@/components/motion/reveal";
import { DualitySplit } from "@/components/about/duality-split";
import { PortraitIntro } from "@/components/about/portrait-intro";
import { getSiteSettings } from "@/lib/content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "About — The Duality",
  description:
    "Joseph James — raised between Ethiopian discipline and Nigerian audacity. Developer. Trader. One mind.",
};

export default async function AboutPage() {
  const settings = await getSiteSettings();
  return (
    <main className="relative">
      <PageHero
        kicker="About — Joseph James"
        title={
          <>
            The <span className="gold-text">Duality</span>.
          </>
        }
        description="Raised between the highland calm of Ethiopia and the restless fire of Nigeria — a builder by day, a trader by night, and a streamer in between. One mind, two markets."
      />

      <PortraitIntro profileImage={settings.profileImage} />

      <GoldDivider className="my-4 sm:my-8" />

      <DualitySplit />

      {/* ── closing creed ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-24 sm:py-32" aria-label="The creed">
        <GradientMesh variant="gold" className="opacity-70" />
        <TextilePattern mask className="opacity-20" />
        <div className="relative mx-auto max-w-4xl px-5 text-center sm:px-8">
          <Reveal>
            <p className="font-mono text-[11px] uppercase tracking-[0.42em] text-gold">The Creed</p>
            <blockquote className="mt-8 font-display text-2xl italic leading-snug text-foreground/90 sm:text-3xl">
              &ldquo;Discipline from the highlands. Audacity from the pulse. Execution from
              both.&rdquo;
            </blockquote>
            <div className="mt-10">
              <Link
                href="/work"
                className="group inline-flex items-center gap-3 border-b border-gold/30 pb-2 font-mono text-[11px] uppercase tracking-[0.35em] text-gold transition-colors hover:border-gold hover:text-gold-light"
              >
                See the execution
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1.5"
                  aria-hidden
                />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
