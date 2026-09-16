import type { Metadata } from "next";
import { Prose } from "@/components/content/prose";
import { GoldDivider } from "@/components/motion/gold-divider";
import { Reveal } from "@/components/motion/reveal";
import { GradientMesh } from "@/components/effects/gradient-mesh";
import { TextilePattern } from "@/components/effects/textile-pattern";
import { getSiteSettings } from "@/lib/content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Now — Current Focus",
  description:
    "What JJ is focused on right now — current builds, current trading focus, current learning. Updated from the desk, not from a cache.",
};

export default async function NowPage() {
  const settings = await getSiteSettings();
  const updated = settings.nowUpdatedAt
    ? new Date(settings.nowUpdatedAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <main className="relative pb-24 sm:pb-32">
      <header className="relative overflow-hidden pb-14 pt-36 sm:pt-44">
        <GradientMesh variant="gold-mint" />
        <TextilePattern className="opacity-25 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
        <div className="relative mx-auto max-w-3xl px-5 sm:px-8">
          <Reveal>
            <p className="font-mono text-[11px] uppercase tracking-[0.42em] text-gold sm:text-xs">
              Now — {updated ? `updated ${updated}` : "a living page"}
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <h1 className="mt-6 font-display text-[clamp(2.6rem,7vw,5rem)] font-semibold leading-[0.98] tracking-tight">
              What I&rsquo;m focused on <span className="gold-text italic">right now.</span>
            </h1>
          </Reveal>
          <Reveal delay={0.18}>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Inspired by the honest-page tradition: no roadmap theatre, no
              &ldquo;coming soon&rdquo; — just what actually has my attention at
              this moment. Updated from{" "}
              <span className="font-mono text-xs text-gold">/admin</span> in
              seconds whenever the focus shifts.
            </p>
          </Reveal>
        </div>
      </header>

      <GoldDivider />

      <div className="mx-auto mt-12 max-w-3xl px-5 sm:px-8">
        {settings.nowContent ? (
          <Reveal>
            <Prose content={settings.nowContent} className="prose-onyx-lg" />
          </Reveal>
        ) : (
          <Reveal>
            <p className="text-muted-foreground">
              The page is ready but nothing&rsquo;s written yet — check back soon.
            </p>
          </Reveal>
        )}

        <Reveal delay={0.1} className="mt-14">
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
            This page was last touched {updated ?? "recently"} — inspired by{" "}
            <a
              href="https://nownownow.com"
              target="_blank"
              rel="noreferrer noopener"
              className="text-gold/90 underline decoration-gold/30 underline-offset-4 hover:text-gold"
            >
              nownownow
            </a>
            .
          </p>
        </Reveal>
      </div>
    </main>
  );
}
