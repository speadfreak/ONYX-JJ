import type { Metadata } from "next";
import { CaseStudyLayout } from "@/components/case-studies/shared/case-study-layout";
import { CaseStudyRenderer } from "@/components/case-studies/shared/case-study-renderer";
import { getProjectBySlug } from "@/lib/content";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "TG's Restaurant ERP (ቲጂ ምግብ ቤት)",
  description:
    "Real-time multi-portal ERP for a delivery-only Ethiopian restaurant in Dubai — WhatsApp voice orders to kitchen display in seconds.",
};

export default async function TgsRestaurantErpPage() {
  const project = await getProjectBySlug("tgs-restaurant-erp");
  if (!project) notFound();

  return (
    <CaseStudyLayout project={project}>
      <CaseStudyRenderer project={project} />
    </CaseStudyLayout>
  );
}
