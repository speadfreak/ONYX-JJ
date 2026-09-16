import type { Metadata } from "next";

/* Render per-request so the shared layout always carries the CURRENT ambient
   audio URL + LIVE badge (see (site)/layout.tsx). */
export const dynamic = "force-dynamic";
import { MissionHero } from "@/components/startup/mission-hero";
import { Pillars } from "@/components/startup/pillars";
import { Headed } from "@/components/startup/headed";

export const metadata: Metadata = {
  title: "The Startup — Building From Addis Ababa Outward",
  description:
    "Engineering world-class, scalable platforms rooted in African talent and ambition — innovation, scalability, impact.",
};

export default function StartupPage() {
  return (
    <main className="relative">
      <MissionHero />
      <Pillars />
      <Headed />
    </main>
  );
}
