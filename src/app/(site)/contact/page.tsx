import type { Metadata } from "next";
import { Download } from "lucide-react";
import { ContactHero } from "@/components/contact/contact-hero";
import { Socials } from "@/components/contact/socials";
import { getSiteSettings } from "@/lib/content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contact — Let's Build What's Next",
  description: "Engineering, trading, or just connecting — JJ's inbox is open.",
};

export default async function ContactPage() {
  const settings = await getSiteSettings();
  return (
    <main className="relative">
      {/* Portfolio deck download */}
      <div className="relative z-10 mx-auto flex max-w-6xl justify-center px-5 pt-28 sm:px-8 sm:pt-32">
        <a
          href="/portfolio/joseph-james-portfolio.pdf"
          download
          data-cursor="hover"
          className="inline-flex items-center gap-2.5 rounded-full border border-gold/40 bg-gold/5 px-6 py-3 font-mono text-[10px] uppercase tracking-[0.3em] text-gold transition-all duration-300 hover:border-gold hover:bg-gold/10 hover:shadow-[0_0_24px_-6px_rgba(212,168,87,0.35)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold/70"
        >
          <Download className="h-4 w-4" aria-hidden />
          Download portfolio deck
        </a>
      </div>

      <ContactHero profileImage={settings.profileImage} />
      <Socials socials={settings.socials} />
    </main>
  );
}
