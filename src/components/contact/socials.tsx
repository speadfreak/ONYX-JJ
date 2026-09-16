"use client";

import type { LucideIcon } from "lucide-react";
import { Globe, Linkedin, Send, Twitch, Github } from "lucide-react";
import { MagneticButton } from "@/components/motion/magnetic-button";
import { SectionHeading } from "@/components/motion/section-heading";
import { Stagger, StaggerItem } from "@/components/motion/reveal";
import { TextilePattern } from "@/components/effects/textile-pattern";
import type { SocialLink } from "@/lib/content";

const ICONS: Record<string, LucideIcon> = {
  Twitch,
  Telegram: Send,
  GitHub: Github,
  Linkedin,
};

/** Social cards — links managed from /admin/settings → Social & platform links. */
export function Socials({ socials = [] }: { socials?: SocialLink[] }) {
  if (!socials.length) return null;
  return (
    <section className="relative border-t border-white/5 py-20">
      <TextilePattern mask className="opacity-20" />

      <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
        <SectionHeading
          align="center"
          kicker="Elsewhere"
          title={
            <>
              Find me in the <span className="gold-text">wild.</span>
            </>
          }
          description="Streaming, trading community, code, career — whichever door you knock on, it's the same person answering."
        />

        <Stagger
          stagger={0.1}
          className="mx-auto mt-12 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {socials.map((s) => {
            const Icon = ICONS[s.platform] ?? Globe;
            return (
              <StaggerItem key={`${s.label}-${s.href}`} className="h-full">
                <MagneticButton
                  href={s.href}
                  external
                  ariaLabel={`${s.label} — ${s.note}`}
                  className="group flex h-full w-full flex-col items-center gap-3 rounded-xl border border-white/8 bg-onyx-900/50 p-7 text-center transition-all duration-300 hover:-translate-y-1 hover:border-gold/50 hover:shadow-[0_0_40px_-10px_rgba(212,168,87,0.35)]"
                >
                  <Icon
                    className="h-6 w-6 text-gold transition-transform duration-300 group-hover:scale-110"
                    aria-hidden
                  />
                  <span className="text-sm font-semibold text-foreground">
                    {s.label}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                    {s.note || s.platform}
                  </span>
                </MagneticButton>
              </StaggerItem>
            );
          })}
        </Stagger>
      </div>
    </section>
  );
}
