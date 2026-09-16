/**
 * JJ ONYX — central project data.
 * Single source of truth for the work index, home featured grid,
 * and cross-links between case studies.
 */

export type ProjectTag = "Fullstack" | "AI" | "Real-Time" | "Trading";

export interface ProjectStat {
  value: string;
  label: string;
}

export interface Project {
  slug: string;
  title: string;
  amharic?: string;
  /** One-line hook used on cards */
  tagline: string;
  /** Slightly longer description for case-study intros */
  hook: string;
  tags: ProjectTag[];
  year: string;
  role: string;
  /** PLACEHOLDER cover art — swap /public/images/project-*.jpg with real screenshots */
  image: string;
  accent: "gold" | "mint" | "ice";
  stats: ProjectStat[];
}

export const projects: Project[] = [
  {
    slug: "tgs-restaurant-erp",
    title: "TG's Restaurant ERP",
    amharic: "ቲጂ ምግብ ቤት",
    tagline: "A real-time ERP running a delivery-only Ethiopian restaurant in Dubai.",
    hook: "From a WhatsApp voice note to the kitchen screen in seconds — seven connected portals, one live pipeline, zero paper.",
    tags: ["Fullstack", "Real-Time"],
    year: "2024",
    role: "Founder & Lead Engineer",
    image: "/images/project-tgs.jpg",
    accent: "gold",
    stats: [
      { value: "7", label: "Connected portals" },
      { value: "<1s", label: "Order sync" },
      { value: "24/7", label: "Live kitchen ops" },
    ],
  },
  {
    slug: "attendx",
    title: "ATTENDX⚡",
    tagline: "AI-powered attendance & student safety for schools.",
    hook: "Face, QR and fingerprint check-ins that tell a parent their child arrived — before the bell finishes ringing.",
    tags: ["AI", "Real-Time"],
    year: "2024",
    role: "Founder & Engineer",
    image: "/images/project-attendx.jpg",
    accent: "mint",
    stats: [
      { value: "3", label: "Check-in modes" },
      { value: "≤5s", label: "Parent alert time" },
      { value: "100%", label: "Automated SMS" },
    ],
  },
  {
    slug: "jj-nexus-pro",
    title: "JJ NEXUS PRO",
    tagline: "A forex trading & live-streaming powerhouse.",
    hook: "Browser-to-RTMP broadcasting, a phone-camera PWA, unified market data and quantitative COT research — one command center.",
    tags: ["Trading", "Real-Time"],
    year: "2024",
    role: "Creator & Engineer",
    image: "/images/project-nexus.jpg",
    accent: "ice",
    stats: [
      { value: "RTMP", label: "Browser → live" },
      { value: "Multi", label: "Data sources unified" },
      { value: "COT", label: "Signal models" },
    ],
  },
  {
    slug: "learnyx-academy",
    title: "Learnyx Academy",
    tagline: "AI-powered national exam prep for Ethiopian students.",
    hook: "AI tutors, live study rooms and XP that makes EHEEE preparation feel like leveling up a game.",
    tags: ["AI", "Fullstack"],
    year: "2025",
    role: "Founder & Engineer",
    image: "/images/project-learnyx.jpg",
    accent: "gold",
    stats: [
      { value: "AI", label: "Groq-powered tutoring" },
      { value: "Live", label: "Study rooms (LiveKit)" },
      { value: "XP", label: "Gamified consistency" },
    ],
  },
];

export const featuredProjects = projects;

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}

export function getNextProject(slug: string): Project {
  const idx = projects.findIndex((p) => p.slug === slug);
  return projects[(idx + 1) % projects.length];
}
