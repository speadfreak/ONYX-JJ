import { SmoothScroll } from "@/components/providers/smooth-scroll";
import { MotionProvider } from "@/components/providers/motion-provider";
import { AudioProvider } from "@/components/providers/audio-provider";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { GrainOverlay } from "@/components/effects/grain-overlay";
import { CustomCursor } from "@/components/effects/custom-cursor";
import { Preloader } from "@/components/preloader/preloader";
import { CommandPalette } from "@/components/command/command-palette";
import { AskJJWidget } from "@/components/ask-jj/ask-jj-widget";
import { PageViewTracker } from "@/components/analytics/page-view-tracker";
import { getSiteSettings, getShippedProjectCount } from "@/lib/content";

/**
 * Always render per-request: the layout owns the AudioProvider's ambient
 * track URL, the LIVE badge and the footer trust chips — a statically
 * prerendered layout would bake the audio URL (and badges) at build time,
 * so a track replaced in /admin/settings would never reach pages served
 * from the prerender cache. Two tiny DB queries per request is a fine
 * price for always-correct chrome.
 */
export const dynamic = "force-dynamic";

/**
 * Cinematic public-site chrome: smooth scroll, ambient audio, header/footer,
 * preloader, grain, custom cursor. All admin routes live OUTSIDE this group
 * and get a utilitarian (but on-brand) workspace shell instead.
 * Site settings (feature toggles, socials, LIVE status) come from the DB.
 *
 * v3 adds: command palette (⌘K), "Ask JJ" assistant bubble, anonymous
 * page-view beacon, and the Market Pulse strip in the footer.
 */
export default async function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const settings = await getSiteSettings();
  const shippedCount = await getShippedProjectCount();

  return (
    <MotionProvider>
      <AudioProvider enabled={settings.audioEnabled} src={settings.ambientAudio}>
        <SmoothScroll />
        <SiteHeader liveStatus={settings.liveStatus} liveUrl={settings.liveUrl} socials={settings.socials} />
        {children}
        <SiteFooter
          socials={settings.socials}
          marketBias={settings.marketBias}
          liveStatus={settings.liveStatus}
          liveUrl={settings.liveUrl}
          availabilityStatus={settings.availabilityStatus}
          shippedCount={shippedCount}
        />
        {/* Intro/audio gate — lives OUTSIDE the route template so its
            fixed overlay isn't trapped by the template's stacking
            context. Self-gates to "/" + once per session. */}
        <Preloader />
        <GrainOverlay />
        <CustomCursor />
        {/* v3 — global overlays & beacons */}
        <CommandPalette />
        <AskJJWidget />
        <PageViewTracker />
      </AudioProvider>
    </MotionProvider>
  );
}
