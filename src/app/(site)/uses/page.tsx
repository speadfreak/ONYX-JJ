import type { Metadata } from "next";
import { PageHero } from "@/components/motion/page-hero";
import { UsesSections } from "@/components/uses/uses-sections";

export const metadata: Metadata = {
  title: "Uses — The Toolkit",
  description:
    "JJ's actual setup: the editor, the trading stack, the hardware. What I use daily to build, trade and stream — and why.",
};

export default function UsesPage() {
  return (
    <main className="relative">
      <PageHero
        kicker="The Toolkit"
        title={
          <>
            What I actually <span className="gold-text">use.</span>
          </>
        }
        description="No affiliate links, no shelf-ware. Every tool here earns its place in the daily loop of building systems, reading markets and streaming it all."
      />
      <UsesSections />
    </main>
  );
}
