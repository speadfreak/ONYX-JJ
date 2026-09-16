import type { Metadata } from "next";
import { CaseStudyLayout } from "@/components/case-studies/shared/case-study-layout";
import { CaseStudyRenderer } from "@/components/case-studies/shared/case-study-renderer";
import { MarketPulsePanel } from "@/components/market/market-pulse-panel";
import { getProjectBySlug, getSiteSettings } from "@/lib/content";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "JJ NEXUS PRO — Trading & Streaming Command Center",
  description:
    "Browser-to-RTMP live streaming pipeline, phone-camera PWA, unified market data proxies and COT research — JJ's forex powerhouse.",
};

export default async function JjNexusProPage() {
  const [project, settings] = await Promise.all([
    getProjectBySlug("jj-nexus-pro"),
    getSiteSettings(),
  ]);
  if (!project) notFound();

  return (
    <>
      <CaseStudyLayout project={project}>
        <CaseStudyRenderer project={project} />
      </CaseStudyLayout>
      {/* v3 — Live Market Pulse. Placed AFTER CaseStudyLayout's <main>: the
          layout's internal "next project" seam is not children-reachable, and
          this position lets the panel own the site-wide max-w-7xl rhythm as a
          closing live-data epilogue that flows into the footer ticker. */}
      <MarketPulsePanel bias={settings.marketBias} />
    </>
  );
}
