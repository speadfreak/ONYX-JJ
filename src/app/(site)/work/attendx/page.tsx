import type { Metadata } from "next";
import { CaseStudyLayout } from "@/components/case-studies/shared/case-study-layout";
import { CaseStudyRenderer } from "@/components/case-studies/shared/case-study-renderer";
import { getProjectBySlug } from "@/lib/content";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ATTENDX⚡ — AI-Powered Attendance & Student Safety",
  description:
    "Face, QR and fingerprint check-ins that update a live dashboard and text a parent before the bell finishes ringing. Built for Ethiopian schools, scaling continent-wide.",
};

export default async function AttendxPage() {
  const project = await getProjectBySlug("attendx");
  if (!project) notFound();

  return (
    <CaseStudyLayout project={project}>
      <CaseStudyRenderer project={project} />
    </CaseStudyLayout>
  );
}
