import { CaseSection, StatBar } from "@/components/case-studies/shared/case-study-layout";
import { OrderFlowDiagram } from "@/components/case-studies/tgs/order-flow-diagram";
import { TicketJourney } from "@/components/case-studies/tgs/ticket-journey";
import { BroadcastMockup } from "@/components/case-studies/nexus/broadcast-mockup";
import { CotBars } from "@/components/case-studies/nexus/cot-bars";
import { TutorDemo } from "@/components/case-studies/learnyx/tutor-demo";
import { CheckinDemo } from "@/components/case-studies/attendx/checkin-demo";
import { Prose } from "@/components/content/prose";
import { Reveal } from "@/components/motion/reveal";
import type { Project } from "@/lib/data/projects";
import type { CaseStudyData } from "@/lib/content";
import { cn } from "@/lib/utils";

const ACCENT_HEX: Record<Project["accent"], string> = {
  gold: "rgba(212,168,87,0.6)",
  mint: "rgba(0,229,160,0.6)",
  ice: "rgba(34,211,238,0.6)",
};

const ACCENT_HOVER: Record<Project["accent"], string> = {
  gold: "hover:border-gold/40 hover:text-gold",
  mint: "hover:border-mint/40 hover:text-mint",
  ice: "hover:border-ice/40 hover:text-ice",
};

/**
 * Renders the admin-editable case-study sections (title + markdown body +
 * optional stat bar) and injects the code-owned cinematic demo components
 * by id. Copy lives in the database; the theatre stays in code.
 */
export function CaseStudyRenderer({
  project,
}: {
  project: Project & { caseStudy: CaseStudyData };
}) {
  const { sections, stack } = project.caseStudy;
  if (!sections.length) return null;

  return (
    <>
      {sections.map((section, i) => (
        <CaseSection
          key={`${i}-${section.title}`}
          index={String(i + 1).padStart(2, "0")}
          title={section.title}
          style={{ ["--cq" as string]: ACCENT_HEX[project.accent] } as React.CSSProperties}
        >
          {section.body ? (
            <Reveal className="max-w-3xl">
              <Prose content={section.body} />
            </Reveal>
          ) : null}

          {section.demos.includes("orderFlow") && (
            <div className="mt-10">
              <OrderFlowDiagram />
            </div>
          )}
          {section.demos.includes("ticket") && (
            <div className="mt-10">
              <TicketJourney />
            </div>
          )}
          {section.demos.includes("broadcast") && (
            <div className="mt-10">
              <BroadcastMockup />
            </div>
          )}
          {section.demos.includes("cot") && (
            <div className="mt-10">
              <CotBars />
            </div>
          )}
          {section.demos.includes("tutor") && (
            <div className="mt-10">
              <TutorDemo />
            </div>
          )}
          {section.demos.includes("checkin") && (
            <div className="mt-10">
              <CheckinDemo />
            </div>
          )}
          {section.demos.includes("stack") && stack.length > 0 && (
            <Reveal className="mt-8 max-w-3xl">
              <ul className="flex flex-wrap gap-2.5" aria-label="Technologies used">
                {stack.map((chip) => (
                  <li
                    key={chip}
                    className={cn(
                      "rounded-full border border-white/10 bg-onyx-850 px-4 py-2 font-mono text-[11px] tracking-[0.15em] text-foreground/85 transition-colors duration-300",
                      ACCENT_HOVER[project.accent]
                    )}
                  >
                    {chip}
                  </li>
                ))}
              </ul>
            </Reveal>
          )}

          {section.statBar && section.statBar.stats.length > 0 && (
            <Reveal className={cn("max-w-3xl", (section.body || section.demos.length) && "mt-10")}>
              <StatBar accent={section.statBar.accent} stats={section.statBar.stats} />
            </Reveal>
          )}
        </CaseSection>
      ))}
    </>
  );
}
