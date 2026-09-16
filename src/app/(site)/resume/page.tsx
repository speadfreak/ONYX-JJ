import type { Metadata } from "next";

/* Render per-request so the shared layout always carries the CURRENT ambient
   audio URL + LIVE badge (see (site)/layout.tsx). */
export const dynamic = "force-dynamic";
import { PageHero } from "@/components/motion/page-hero";
import { ResumeTimeline } from "@/components/resume/resume-timeline";

export const metadata: Metadata = {
  title: "Resume — Joseph James",
  description:
    "Joseph James (JJ) — fullstack developer, forex trader and founder. Education, skills and shipped systems, on one cinematic page with a downloadable PDF.",
};

export default function ResumePage() {
  return (
    <main className="relative">
      <PageHero
        kicker="CV — Joseph James"
        title={
          <>
            The story, <span className="gold-text">in order.</span>
          </>
        }
        description="Eighteen years old, four shipped systems, two disciplines. For recruiters and collaborators who want the traditional version — download the PDF below."
      />
      <ResumeTimeline />
    </main>
  );
}
