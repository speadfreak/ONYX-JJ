import type { Metadata } from "next";
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
