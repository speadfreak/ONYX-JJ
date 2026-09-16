import type { Metadata, Viewport } from "next";
import { Fraunces, Manrope, JetBrains_Mono, Noto_Sans_Ethiopic } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

/* Cinematic type system:
   — Fraunces: bold display serif, movie-title-card scale headlines
   — Manrope: clean geometric sans for body copy
   — JetBrains Mono: terminal/tagline/kicker voice
   — Noto Sans Ethiopic: Amharic script (ቲጂ ምግብ ቤት) */
const display = Fraunces({ subsets: ["latin"], variable: "--font-fraunces" });
const body = Manrope({ subsets: ["latin"], variable: "--font-manrope" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" });
const ethiopic = Noto_Sans_Ethiopic({ subsets: ["ethiopic"], weight: ["400", "600"], variable: "--font-noto-ethiopic" });

export const metadata: Metadata = {
  metadataBase: new URL("https://jj-onyx.vercel.app"), // TODO: update after first deploy
  title: {
    default: "JJ Onyx — Joseph James | Fullstack Developer & Forex Trader",
    template: "%s — JJ ONYX",
  },
  description:
    "Joseph James (JJ) — 18-year-old fullstack developer, forex trader and streamer. Founder building real-time platforms from Addis Ababa outward. Builder. Trader. Storyteller.",
  keywords: [
    "Joseph James",
    "JJ Onyx",
    "Fullstack Developer",
    "Forex Trader",
    "Forex Streamer",
    "Addis Ababa",
    "Next.js Developer",
    "Ethiopian developer",
  ],
  authors: [{ name: "Joseph James" }],
  openGraph: {
    title: "JJ ONYX — Joseph James",
    description: "Builder. Trader. Storyteller. Fullstack developer & forex trader building from Addis Ababa outward.",
    url: "/",
    siteName: "JJ ONYX",
    images: [{ url: "/images/hero-bg.jpg", width: 1344, height: 768, alt: "JJ ONYX — molten gold on obsidian" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "JJ ONYX — Joseph James",
    description: "Builder. Trader. Storyteller.",
    images: ["/images/hero-bg.jpg"],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0A0A0F",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${display.variable} ${body.variable} ${mono.variable} ${ethiopic.variable}`}
    >
      <body className="flex min-h-screen flex-col font-sans">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
