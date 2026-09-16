import type { Metadata } from "next";
import { CaseStudyLayout } from "@/components/case-studies/shared/case-study-layout";
import { CaseStudyRenderer } from "@/components/case-studies/shared/case-study-renderer";
import { getProjectBySlug } from "@/lib/content";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Learnyx Academy — AI-Powered EHEEE Exam Prep",
  description:
    "AI tutoring, live study rooms, quizzes, flashcards and XP — a full learning ecosystem for Ethiopian grade 9–12 students.",
};

export default async function LearnyxAcademyPage() {
  const project = await getProjectBySlug("learnyx-academy");
  if (!project) notFound();

  return (
    <CaseStudyLayout project={project}>
      <CaseStudyRenderer project={project} />
    </CaseStudyLayout>
  );
}
