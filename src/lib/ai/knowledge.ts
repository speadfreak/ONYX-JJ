import "server-only";
import {
  getPostBySlug,
  getProjectBySlug,
  getProjects,
  getPosts,
  getSiteSettings,
} from "@/lib/content";

/**
 * "Ask JJ" — lightweight grounded-retrieval knowledge base.
 *
 * Indexes the site's ACTUAL content (DB-driven case studies, journal posts,
 * /now notes + curated static blocks for the About/Duality, Startup vision,
 * Uses and skills pages) into keyword-scored chunks. Retrieval is a simple
 * term-overlap scorer — with this content volume (~60 chunks) it beats any
 * heavyweight vector setup on cost and latency.
 *
 * The index rebuilds at most once every TTL_MS, and on first use.
 */

export interface KnowledgeChunk {
  id: string;
  title: string;
  text: string;
  /** Extra terms that boost this chunk when they appear in the query */
  boost: string[];
}

interface KnowledgeIndex {
  chunks: KnowledgeChunk[];
  builtAt: number;
}

const TTL_MS = 5 * 60 * 1000;

let index: KnowledgeIndex | null = null;
let building: Promise<KnowledgeIndex> | null = null;

// ── Static curated blocks (v1 copy lives in components, so it is curated
//    here; keep in sync with the live pages — PLACEHOLDER for JJ to refine)

const STATIC_BLOCKS: Omit<KnowledgeChunk, "id">[] = [
  {
    title: "About JJ — The Duality",
    boost: ["about", "who", "joseph", "james", "jj", "duality", "story", "background", "age", "bio"],
    text: `Joseph James ("JJ") is an 18-year-old fullstack developer, forex trader and forex live-streamer, and the founder of an IT startup. He was born to Ethiopian and Nigerian parents and works between Addis Ababa and Dubai. His identity is a duality: 01 — The Developer (real-time systems engineer: ERPs, attendance platforms, streaming infrastructure, AI education tools) and 02 — The Trader (forex markets, live-streamed with full transparency). The synthesis: "One mind. Two markets. Infinite execution." His creed: "Discipline from the highlands. Execution from the desert. I build the systems I trade on — and I trade the systems I build."`,
  },
  {
    title: "Startup — building from Addis Ababa outward",
    boost: ["startup", "founder", "vision", "mission", "company", "business", "addis", "ethiopia"],
    text: `JJ's startup vision is "building from Addis Ababa outward": world-class software engineered in Ethiopia, shipped to the world. Every build is made of three pillars: Innovation, Scalability, and Impact. The trajectory spans four domains: TG's Restaurant ERP (Shipped — real-time restaurant operations in Dubai), AttendX (In Pilot — AI attendance for schools), JJ Nexus Pro (Scaling — his own trading & streaming command center), and Learnyx Academy (Public Beta — AI-powered national exam prep, free for Ethiopian students). The map is written in shipped products, not pitch decks.`,
  },
  {
    title: "Approach to trading & risk",
    boost: ["trading", "forex", "risk", "trader", "strategy", "bias", "xauusd", "gold", "eurusd", "gbpusd", "btc", "market", "markets", "cot"],
    text: `JJ trades forex live and streams the whole story — entries, mistakes and management stay on screen. His approach: structured risk first (fixed fractional risk per position, invalidation defined before entry), a top-down routine (macro bias → session levels → execution), and COT (Commitment of Traders) positioning research to read commercial vs. large-spec asymmetry — the asymmetry thesis behind his gold and USD bias work. He tracks EUR/USD, GBP/USD, XAU/USD and BTC/USD daily (the Market Pulse ticker on the site shows his tracked instruments). Nothing on the site is financial advice.`,
  },
  {
    title: "Work with JJ — collaboration & contact",
    boost: ["hire", "contact", "available", "availability", "price", "pricing", "cost", "rate", "freelance", "collaborate", "collaboration", "work with", "email", "reach"],
    text: `JJ is open to selecting collaborations: real-time platforms, trading infrastructure, streaming tooling and AI-powered products. The fastest path is the /contact page — messages land directly in his inbox and he usually replies within a day. You can also find him on Twitch (live trading desk), Telegram (trading community), GitHub (code) and LinkedIn (career) — links live in the site footer and on /contact. For pricing or availability specifics, /contact is the right channel; this assistant does not quote prices.`,
  },
  {
    title: "Skills & toolbox",
    boost: ["skills", "stack", "tech", "uses", "tools", "setup", "gear", "language", "languages"],
    text: `JJ's working stack: TypeScript end-to-end — Next.js (App Router), React, Node.js, Tailwind CSS, Prisma with PostgreSQL/SQLite/Supabase, real-time layers with Socket.IO and WebSockets, GSAP + Framer Motion for cinematic motion, React Three Fiber for 3D, and AI integrations (LLM chat, tutoring flows). Ops side: FFmpeg/RTMP broadcast pipelines, Docker-friendly deploys, and trading research tooling in Python. His /uses page documents the day-to-day toolbox, and the /resume page carries the formal one-pager (downloadable PDF).`,
  },
];

// ── Index building ──────────────────────────────────────────────────────

function stripMarkdown(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/\[([^\]]*)\]\(([^)]*)\)/g, "$1")
    .replace(/[#*_>`~-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function buildIndex(): Promise<KnowledgeIndex> {
  const chunks: KnowledgeChunk[] = [];
  let n = 0;
  const push = (title: string, text: string, boost: string[]) => {
    const clean = text.replace(/\s+/g, " ").trim();
    if (clean.length < 40) return;
    chunks.push({ id: `c${n++}`, title, text: clean.slice(0, 1400), boost });
  };

  // Projects — overview + per-section chunks (DB-driven case studies)
  try {
    const projects = await getProjects();
    for (const p of projects) {
      push(
        `${p.title} — overview`,
        `${p.title}${p.amharic ? ` (${p.amharic})` : ""} — ${p.tagline}. ${p.hook} Built in ${p.year} as ${p.role}. Tags: ${p.tags.join(", ")}. Key results: ${p.stats
          .map((s) => `${s.value} ${s.label}`)
          .join("; ")}.`,
        [p.slug, ...p.tags.map((t) => t.toLowerCase()), ...p.title.toLowerCase().split(/\s+/)]
      );
      const full = await getProjectBySlug(p.slug);
      full?.caseStudy.sections.forEach((sec) => {
        push(
          `${p.title} — ${sec.title}`,
          `${p.title} · ${sec.title}: ${stripMarkdown(sec.body)}`,
          [p.slug, ...sec.title.toLowerCase().split(/\s+/)]
        );
      });
      if (full?.caseStudy.stack?.length) {
        push(
          `${p.title} — stack`,
          `${p.title} technology stack: ${full.caseStudy.stack.join(", ")}.`,
          [p.slug, "stack", "tech", "built", "technologies"]
        );
      }
    }
  } catch {
    // DB unreachable — static blocks still ground the assistant
  }

  // Journal posts
  try {
    const posts = await getPosts();
    for (const post of posts.slice(0, 8)) {
      const full = await getPostBySlug(post.slug);
      const body = full ? stripMarkdown(full.content).slice(0, 900) : "";
      push(
        `Journal — ${post.title}`,
        `Blog post (${post.category}): ${post.title}. ${post.excerpt} ${body}`,
        ["blog", "journal", "post", ...post.title.toLowerCase().split(/\s+/)]
      );
    }
  } catch {
    // ignore
  }

  // /now page (admin-curated current focus) + live status
  try {
    const settings = await getSiteSettings();
    if (settings.nowContent) {
      push("Current focus — /now", `What JJ is focused on right now: ${stripMarkdown(settings.nowContent)}`, [
        "now", "current", "focus", "working", "latest", "recent",
      ]);
    }
    if (settings.liveStatus) {
      push("Live now", `JJ is LIVE streaming right now — the LIVE badge in the nav links to his stream.`, [
        "live", "stream", "streaming", "twitch",
      ]);
    }
  } catch {
    // ignore
  }

  STATIC_BLOCKS.forEach((b, i) => push(b.title, b.text, b.boost));

  return { chunks, builtAt: Date.now() };
}

export async function getIndex(): Promise<KnowledgeIndex> {
  if (index && Date.now() - index.builtAt < TTL_MS) return index;
  if (!building) {
    building = buildIndex()
      .then((idx) => {
        index = idx;
        return idx;
      })
      .finally(() => {
        building = null;
      });
  }
  return building;
}

// ── Retrieval ───────────────────────────────────────────────────────────

const STOP = new Set([
  "the", "a", "an", "and", "or", "but", "of", "to", "in", "on", "for", "with",
  "is", "are", "was", "were", "be", "been", "it", "this", "that", "what", "how",
  "why", "who", "when", "where", "do", "does", "did", "can", "could", "will",
  "would", "you", "your", "his", "her", "their", "our", "my", "me", "i", "we",
  "he", "she", "they", "them", "at", "by", "from", "as", "about", "tell", "ask",
  "jj", "please", "hi", "hello", "hey", "there",
]);

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s+#.]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP.has(t));
}

/** Keyword-overlap retrieval — top k chunks for a question. */
export function retrieve(question: string, idx: KnowledgeIndex, k = 5): KnowledgeChunk[] {
  const terms = tokenize(question);
  if (!terms.length) return idx.chunks.slice(0, k);

  const scored = idx.chunks.map((chunk) => {
    const titleTerms = new Set(tokenize(chunk.title));
    const body = ` ${chunk.text.toLowerCase()} `;
    let score = 0;
    for (const t of terms) {
      if (titleTerms.has(t)) score += 3;
      const hits = body.split(t).length - 1;
      if (hits > 0) score += Math.min(hits, 4);
      if (chunk.boost.some((b) => b === t)) score += 2.5;
      if (chunk.boost.some((b) => t.length > 3 && b.includes(t))) score += 1.2;
    }
    return { chunk, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const top = scored.filter((s) => s.score > 0).slice(0, k);
  return (top.length ? top : scored.slice(0, k)).map((s) => s.chunk);
}

/** Coarse topic bucket for logging/insights (keep values enum-like). */
export function classifyTopic(question: string): string {
  const q = question.toLowerCase();
  const has = (...words: string[]) => words.some((w) => q.includes(w));
  if (has("hire", "price", "cost", "rate", "available", "availability", "contact", "collaborat", "freelance", "quote", "budget")) return "inquiries";
  if (has("learnyx", "academy", "exam", "eheee", "student", "tutor", "school")) return "learnyx";
  if (has("attendx", "attendance")) return "attendx";
  if (has("tgs", "restaurant", "erp")) return "tgs-erp";
  if (has("nexus", "broadcast", "streaming", "stream", "rtmp", "twitch")) return "nexus";
  if (has("trade", "trading", "forex", "market", "risk", "bias", "pip", "xau", "gold", "btc", "eurusd", "gbpusd", "cot", "position")) return "trading";
  if (has("stack", "tech", "next", "react", "node", "prisma", "websocket", "real-time", "realtime", "database", "deploy", "code", "build")) return "tech-stack";
  if (has("startup", "founder", "vision", "company", "mission", "business")) return "startup";
  if (has("who", "about", "joseph", "background", "story", "duality", "age", "ethiopia", "addis", "journey")) return "about-jj";
  if (has("blog", "journal", "post", "article")) return "journal";
  return "general";
}
