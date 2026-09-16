import "server-only";
import { db } from "@/lib/db";
import { projects as fallbackProjects, type Project, type ProjectTag } from "@/lib/data/projects";

/**
 * Server-side content layer — the single gateway between the database and
 * every public page. Falls back to the hardcoded v1 data if the DB is empty
 * or unreachable, so the site can never blank out.
 */

export interface SocialLink {
  label: string;
  platform: string;
  href: string;
  note: string;
}

export interface SiteSettings {
  liveStatus: boolean;
  liveUrl: string;
  audioEnabled: boolean;
  videoEnabled: boolean;
  socials: SocialLink[];
  profileImage: string;
  ambientAudio: string;
  heroVideo: string;
  heroPoster: string;
  nowContent: string;
  nowUpdatedAt: string | null;
  /** v3 — personally-curated market note shown near the Market Pulse widget */
  marketBias: string;
  /** Footer trust chip — availability line editable from /admin/settings */
  availabilityStatus: string;
}

export interface HomeContentData {
  kicker: string;
  headlineLine1: string;
  headlineLine2: string;
  roles: string[];
  subheadline: string;
  ctaPrimaryLabel: string;
  ctaPrimaryHref: string;
  ctaSecondaryLabel: string;
  ctaSecondaryHref: string;
  stats: { to: number; suffix?: string; label: string }[];
  featuredHeading: string;
  featuredSubheading: string;
}

export interface TestimonialData {
  id: string;
  name: string;
  role: string;
  quote: string;
  photo: string | null;
}

export interface PostListItem {
  id: string;
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  coverImage: string | null;
  readingMinutes: number;
  publishedAt: string | null;
}

export interface PostFull extends PostListItem {
  content: string;
}

export interface CaseStudySection {
  title: string;
  body: string;
  /** Demo/mockup ids injected after the body: "orderFlow"|"ticket"|"broadcast"|"cot"|"tutor"|"checkin"|"stack" */
  demos: string[];
  statBar?: { accent: "gold" | "mint" | "ice"; stats: { value: string; label: string }[] } | null;
}

export interface CaseStudyData {
  sections: CaseStudySection[];
  stack: string[];
}

// ── Defaults (used when DB rows are missing / DB unreachable) ───────────

const DEFAULT_SOCIALS: SocialLink[] = [
  // PLACEHOLDER LINKS — edit from /admin/settings once real URLs exist
  { label: "GitHub", platform: "GitHub", href: "#", note: "Repos" },
  { label: "LinkedIn", platform: "LinkedIn", href: "#", note: "Career" },
  { label: "Twitch", platform: "Twitch", href: "#", note: "Live desk" },
  { label: "Telegram", platform: "Telegram", href: "#", note: "Community" },
];

const DEFAULT_HOME: HomeContentData = {
  kicker: "JJ ONYX — Est. Addis Ababa",
  headlineLine1: "JOSEPH",
  headlineLine2: "JAMES",
  roles: ["Fullstack Developer", "Forex Trader", "Forex Streamer", "Founder"],
  subheadline: "I build real-time systems, trade the markets live, and stream the whole story — from Addis Ababa outward.",
  ctaPrimaryLabel: "Enter the story",
  ctaPrimaryHref: "/about",
  ctaSecondaryLabel: "Start a project",
  ctaSecondaryHref: "/contact",
  stats: [
    { to: 4, label: "Major systems shipped" },
    { to: 15, suffix: "+", label: "Real-time interfaces & portals" },
    { to: 2, label: "Disciplines — Dev × Trading" },
  ],
  featuredHeading: "Systems that run *real operations.*",
  featuredSubheading:
    "Four production builds — a restaurant, a school, a trading desk, a classroom. Every one shipped, every one real.",
};

const DEFAULT_SETTINGS: SiteSettings = {
  liveStatus: false,
  liveUrl: "",
  audioEnabled: true,
  videoEnabled: true,
  socials: DEFAULT_SOCIALS,
  profileImage: "/images/jj-profile.jpg",
  ambientAudio: "/audio/ambient-theme.mp3",
  heroVideo: "",
  heroPoster: "/images/hero-bg.jpg",
  nowContent: "",
  nowUpdatedAt: null,
  marketBias: "Watching USD strength into the next CPI print — biased for pullbacks into London session.",
  availabilityStatus: "Available for select projects",
};

// ── Mappers ─────────────────────────────────────────────────────────────

function parseJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

const VALID_TAGS: ProjectTag[] = ["Fullstack", "AI", "Real-Time", "Trading"];
const VALID_ACCENTS = ["gold", "mint", "ice"] as const;

function mapProject(row: {
  slug: string;
  title: string;
  amharic: string | null;
  tagline: string;
  hook: string;
  tags: string;
  year: string;
  role: string;
  image: string;
  accent: string;
  stats: string;
}): Project {
  return {
    slug: row.slug,
    title: row.title,
    amharic: row.amharic ?? undefined,
    tagline: row.tagline,
    hook: row.hook,
    tags: parseJson<string[]>(row.tags, []).filter((t): t is ProjectTag => VALID_TAGS.includes(t as ProjectTag)),
    year: row.year,
    role: row.role,
    image: row.image,
    accent: (VALID_ACCENTS as readonly string[]).includes(row.accent)
      ? (row.accent as Project["accent"])
      : "gold",
    stats: parseJson<{ value: string; label: string }[]>(row.stats, []),
  };
}

// ── Public readers ──────────────────────────────────────────────────────

export async function getProjects(): Promise<Project[]> {
  try {
    const rows = await db.project.findMany({
      where: { published: true },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });
    if (!rows.length) return fallbackProjects;
    return rows.map(mapProject);
  } catch {
    return fallbackProjects;
  }
}

export async function getProjectBySlug(
  slug: string
): Promise<(Project & { caseStudy: CaseStudyData }) | undefined> {
  try {
    const row = await db.project.findFirst({
      where: { slug, published: true },
      orderBy: [{ order: "asc" }],
    });
    if (row) {
      return {
        ...mapProject(row),
        caseStudy: {
          sections: parseJson<CaseStudySection[]>(row.sections, []),
          stack: parseJson<string[]>(row.stack, []),
        },
      };
    }
  } catch {
    // fall through to static data
  }
  const fb = fallbackProjects.find((p) => p.slug === slug);
  return fb
    ? { ...fb, caseStudy: { sections: [], stack: [] } }
    : undefined;
}

export async function getNextProjectSlug(slug: string): Promise<string> {
  const list = await getProjects();
  const idx = list.findIndex((p) => p.slug === slug);
  return list[(idx + 1) % list.length]?.slug ?? slug;
}

/**
 * Home hero stats must be { to: number, suffix?, label }. Legacy/buggy rows
 * (Task 12: the admin API once stored the project-shaped { value, label })
 * carry no usable number — those entries are dropped, and if NOTHING usable
 * survives we fall back to the bundled defaults instead of rendering zeros.
 */
function normalizeHomeStats(v: unknown): { to: number; suffix?: string; label: string }[] {
  if (!Array.isArray(v)) return [];
  const out: { to: number; suffix?: string; label: string }[] = [];
  for (const s of v) {
    if (typeof s !== "object" || s === null) continue;
    const rec = s as Record<string, unknown>;
    const label = typeof rec.label === "string" ? rec.label.trim().slice(0, 80) : "";
    if (!label) continue;
    const n = Number(rec.to);
    if (!Number.isFinite(n)) continue;
    const suffix =
      typeof rec.suffix === "string" && rec.suffix.trim() ? rec.suffix.trim().slice(0, 8) : undefined;
    out.push({ to: Math.max(0, Math.min(999_999, Math.round(n))), label, ...(suffix ? { suffix } : {}) });
  }
  return out;
}

export async function getHomeContent(): Promise<HomeContentData> {
  try {
    const row = await db.homeContent.findUnique({ where: { id: "home" } });
    if (!row) return DEFAULT_HOME;
    const stats = normalizeHomeStats(parseJson<unknown>(row.stats, null));
    return {
      kicker: row.kicker || DEFAULT_HOME.kicker,
      headlineLine1: row.headlineLine1 || DEFAULT_HOME.headlineLine1,
      headlineLine2: row.headlineLine2 || DEFAULT_HOME.headlineLine2,
      roles: parseJson<string[]>(row.roles, DEFAULT_HOME.roles),
      subheadline: row.subheadline || DEFAULT_HOME.subheadline,
      ctaPrimaryLabel: row.ctaPrimaryLabel || DEFAULT_HOME.ctaPrimaryLabel,
      ctaPrimaryHref: row.ctaPrimaryHref || DEFAULT_HOME.ctaPrimaryHref,
      ctaSecondaryLabel: row.ctaSecondaryLabel || DEFAULT_HOME.ctaSecondaryLabel,
      ctaSecondaryHref: row.ctaSecondaryHref || DEFAULT_HOME.ctaSecondaryHref,
      stats: stats.length ? stats : DEFAULT_HOME.stats,
      featuredHeading: row.featuredHeading || DEFAULT_HOME.featuredHeading,
      featuredSubheading: row.featuredSubheading || DEFAULT_HOME.featuredSubheading,
    };
  } catch {
    return DEFAULT_HOME;
  }
}

export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const row = await db.siteSetting.findUnique({ where: { id: "site" } });
    if (!row) return DEFAULT_SETTINGS;
    return {
      liveStatus: row.liveStatus,
      liveUrl: row.liveUrl,
      audioEnabled: row.audioEnabled,
      videoEnabled: row.videoEnabled,
      socials: parseJson<SocialLink[]>(row.socials, DEFAULT_SOCIALS),
      profileImage: row.profileImage || DEFAULT_SETTINGS.profileImage,
      ambientAudio: row.ambientAudio || DEFAULT_SETTINGS.ambientAudio,
      heroVideo: row.heroVideo,
      heroPoster: row.heroPoster || DEFAULT_SETTINGS.heroPoster,
      nowContent: row.nowContent,
      nowUpdatedAt: row.nowUpdatedAt ? row.nowUpdatedAt.toISOString() : null,
      marketBias: row.marketBias ?? "",
      availabilityStatus: row.availabilityStatus ?? "",
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/** Footer trust chip: number of published case studies (never hardcoded). */
export async function getShippedProjectCount(): Promise<number> {
  try {
    return await db.project.count({ where: { published: true } });
  } catch {
    return 0;
  }
}

export async function getTestimonials(): Promise<TestimonialData[]> {
  try {
    const rows = await db.testimonial.findMany({
      where: { published: true },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });
    return rows.map((r) => ({ id: r.id, name: r.name, role: r.role, quote: r.quote, photo: r.photo }));
  } catch {
    return [];
  }
}

export async function getPosts(): Promise<PostListItem[]> {
  try {
    const rows = await db.blogPost.findMany({
      where: { published: true },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    });
    return rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      title: r.title,
      category: r.category,
      excerpt: r.excerpt,
      coverImage: r.coverImage,
      readingMinutes: r.readingMinutes,
      publishedAt: r.publishedAt ? r.publishedAt.toISOString() : null,
    }));
  } catch {
    return [];
  }
}

export async function getPostBySlug(slug: string): Promise<PostFull | undefined> {
  try {
    const r = await db.blogPost.findFirst({ where: { slug, published: true } });
    if (!r) return undefined;
    return {
      id: r.id,
      slug: r.slug,
      title: r.title,
      category: r.category,
      excerpt: r.excerpt,
      coverImage: r.coverImage,
      readingMinutes: r.readingMinutes,
      publishedAt: r.publishedAt ? r.publishedAt.toISOString() : null,
      content: r.content,
    };
  } catch {
    return undefined;
  }
}
