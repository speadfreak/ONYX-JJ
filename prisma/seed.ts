/**
 * JJ ONYX v2 — database seed.
 * Migrates the v1 hardcoded content into the dynamic schema.
 * Run: bun prisma/seed.ts   (idempotent — upserts by slug/id)
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

// ─────────────────────────────────────────────────────────────────────────────
// Projects — full metadata + case-study sections (extracted from v1 pages)
// ─────────────────────────────────────────────────────────────────────────────
const projects = [
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
    stack: [
      "pnpm monorepo", "React + Vite", "Express", "PostgreSQL · Supabase",
      "Socket.IO", "JWT · RBAC", "Twilio Voice", "Google Drive API", "Render",
    ],
    sections: [
      {
        title: "The Problem",
        body: "TG's is a delivery-only Ethiopian restaurant in Dubai — no dining room, no walk-ins. Every order arrives by phone call, WhatsApp voice note, or the web, and operations were run the way most restaurants run: memory, paper tickets, and shouting across the kitchen. As volume grew, so did the failure modes — missed voice notes, double-entered tickets, drivers dispatched on stale information.\n\nEvery new staff member made things slower, not faster. There was no shared source of truth between the person taking the order, the chef cooking it, and the manager answering \"where is my food?\" at 9pm.",
        demos: [],
        statBar: null,
      },
      {
        title: "The Solution",
        body: "A unified, real-time multi-portal ERP covering the full order lifecycle: intake, kitchen, dispatch, finances — even the weekly customer lottery that keeps regulars coming back. Every role gets a purpose-built portal; every portal sees the same truth at the same moment.\n\n> A voice note sent on WhatsApp becomes a structured ticket on the kitchen display before the customer hangs up.",
        demos: [],
        statBar: null,
      },
      {
        title: "The System",
        body: "Seven connected surfaces — a customer ordering webapp, a WhatsApp voice-order queue, a real-time Kitchen Display System, dedicated Chef / Waiter / Cashier / Manager portals, an automated lottery engine, an Addis Ababa supply-chain module, and automated weekly Google Drive backups — all breathing through one Socket.IO event bus.",
        demos: ["orderFlow", "ticket"],
        statBar: null,
      },
      {
        title: "The Stack",
        body: "Originally deployed against Neon Postgres; migrated to Supabase on Render after outgrowing Neon's free-tier storage limits — the migration was a URL swap and a pg_dump, exactly why boring architecture wins.",
        demos: ["stack"],
        statBar: {
          accent: "gold",
          stats: [
            { value: "pnpm", label: "Monorepo" },
            { value: "7", label: "Portals" },
            { value: "Socket.IO", label: "Real-time bus" },
            { value: "Render", label: "Deployment" },
          ],
        },
      },
      {
        title: "The Impact",
        body: "Orders flow live from the WhatsApp voice queue and the web straight into the kitchen pipeline with full role separation across staff. Tickets can't be lost, duplicated, or forgotten — the system simply doesn't allow it.\n\nWhat used to be a juggling act across five people is now a single pipeline with one source of truth. The manager answers \"where is my food?\" by glancing at a screen instead of shouting into a kitchen.",
        demos: [],
        statBar: {
          accent: "mint",
          stats: [
            { value: "<1s", label: "Voice note → kitchen" },
            { value: "0", label: "Lost tickets" },
            { value: "7", label: "Connected surfaces" },
            { value: "24/7", label: "Uptime in service" },
          ],
        },
      },
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
    stack: [
      "AI face recognition", "QR check-in", "Fingerprint", "Realtime cloud DB",
      "Automated SMS", "Encrypted credentials", "Env-based secrets", "Live analytics",
    ],
    sections: [
      {
        title: "The Problem",
        body: "Roll call hasn't changed in a century: a teacher reads forty names, forty students answer, and ten minutes of teaching time disappears. Paper attendance sheets then sit in a filing cabinet — no analytics, no trends, no early warnings for students quietly drifting away.\n\nWorst of all: parents find out their child never arrived — hours late, or never. In an age where a food delivery can be tracked to the door, a parent's most important question — \"is my child safe at school?\" — was still answered with silence.",
        demos: [],
        statBar: null,
      },
      {
        title: "The Solution",
        body: "ATTENDX⚡ replaces the register with multi-modal check-in: AI face recognition at the gate, QR codes on student ID cards, or fingerprint verification where biometrics are preferred. Every check-in lands in a secure cloud database in real time — encrypted credentials, environment-variable secrets management, and role-based access keeping student data locked down.\n\n> A parent knows their child arrived safely — before the bell finishes ringing.",
        demos: [],
        statBar: null,
      },
      {
        title: "The Experience",
        body: "The full loop takes seconds. A student steps up, the camera scans, the dashboard updates, the parent's phone buzzes. Here is that sequence, simulated:",
        demos: ["checkin"],
        statBar: null,
      },
      {
        title: "The Platform",
        body: "Behind the gate sits a live admin dashboard: attendance analytics by class, grade and day; absenteeism pattern detection that flags chronic absence before it becomes dropout; and classroom trend reporting for teachers and administrators. Teacher-side attendance completes in seconds instead of manual roll call.\n\nSecurity is first-class: credentials encrypted at rest, secrets managed through environment variables, and every check-in event auditable. Schools own their data; the platform just makes it useful.",
        demos: [],
        statBar: {
          accent: "mint",
          stats: [
            { value: "3", label: "Check-in modes" },
            { value: "≤5s", label: "Gate → parent SMS" },
            { value: "Live", label: "Dashboard sync" },
            { value: "0", label: "Paper sheets" },
          ],
        },
      },
      {
        title: "The Stack",
        body: "",
        demos: ["stack"],
        statBar: null,
      },
      {
        title: "The Vision",
        body: "ATTENDX⚡ is positioned to become one of Africa's leading intelligent education management platforms — starting in Ethiopian schools before expanding continent-wide. The problem it solves is universal; the engineering to solve it affordably is the differentiator.\n\nThe roadmap is already drawn: native mobile apps for parents, geofenced arrival verification so check-ins only count at school, digital student ID cards, and predictive attendance-risk analytics that turn absence data into early intervention.",
        demos: [],
        statBar: null,
      },
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
    stack: [
      "React + Vite", "TypeScript", "Node · Express", "WebSocket", "FFmpeg",
      "PWA", "GitHub Codespaces", "Market data proxies", "Render",
    ],
    sections: [
      {
        title: "The Problem",
        body: "Trading and streaming pull you into five different tools: one app for charts, one for broadcast, one for research, one for chat — and one for hope. Every context switch is lost focus, and focus is the entire game.\n\nStreamers in markets have it worst: OBS scenes, capture cards, browser sources and market feeds stacked into a Rube Goldberg machine that dies the moment one piece hiccups.",
        demos: [],
        statBar: null,
      },
      {
        title: "The Solution",
        body: "JJ NEXUS PRO is the answer — a single command center where the market feed, the broadcast pipeline and the research desk live side by side. Open one tab and you're live: chart on the left, stream controls on the right, COT positioning below.\n\n> The browser tab becomes the broadcast studio.",
        demos: [],
        statBar: null,
      },
      {
        title: "The Engineering",
        body: "A custom browser-to-RTMP streaming pipeline built on FFmpeg carries the desktop straight to platforms like Twitch and YouTube. A progressive web app turns any phone camera into a wireless input source, and a GitHub Codespaces engine means I can go live from any machine with Wi-Fi. Proxy API layers unify forex, crypto and macro data into one normalized feed.",
        demos: ["broadcast"],
        statBar: {
          accent: "ice",
          stats: [
            { value: "RTMP", label: "Browser → live" },
            { value: "PWA", label: "Phone as camera" },
            { value: "WS", label: "Real-time sync" },
            { value: "FFmpeg", label: "Stream engine" },
          ],
        },
      },
      {
        title: "The Research",
        body: "The COT (Commitment of Traders) Order Flow page implements quantitative signal models for institutional positioning analysis — how commercial hedgers, large specs and retail are positioned week over week, and what that asymmetry tends to precede.\n\nIt bridges serious research directly into the platform I stream from, so the audience learns the same framework instead of cargo-culting signals.",
        demos: ["cot"],
        statBar: null,
      },
      {
        title: "The Stack",
        body: "",
        demos: ["stack"],
        statBar: null,
      },
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
    stack: [
      "Vite + React", "TypeScript", "Convex", "Groq", "LiveKit",
      "Cloudflare R2", "Freemium auth", "Render",
    ],
    sections: [
      {
        title: "The Problem",
        body: "In Ethiopia, the EHEEE — the national exam — decides university placement and, honestly, trajectories. But preparation is radically unequal: private tutoring exists for a few, outdated PDF photocopies for everyone else. The students with the most ambition often have the fewest tools.\n\nStudy apps imported from abroad don't understand the curriculum, the language reality, or the exam itself. Students needed something built for their exam, not a translated afterthought.",
        demos: [],
        statBar: null,
      },
      {
        title: "The Solution",
        body: "Learnyx Academy is a full learning ecosystem for grade 9–12 students: an AI tutor that actually explains, quizzes and flashcards structured by subject, live study rooms where friends keep each other accountable, and an XP system that makes showing up daily feel like leveling up.\n\n> Consistency is the hardest subject — so we made it a game worth winning.",
        demos: [],
        statBar: null,
      },
      {
        title: "The Platform",
        body: "Under the hood: Groq-powered AI tutoring with sub-second responses, LiveKit-powered real-time video study rooms, Convex as the reactive backend, and Cloudflare R2 for assets. A freemium model keeps the core free — access shouldn't depend on income.",
        demos: ["tutor"],
        statBar: null,
      },
      {
        title: "The Stack",
        body: "",
        demos: ["stack"],
        statBar: null,
      },
      {
        title: "The Vision",
        body: "Elite exam preparation for every Ethiopian student, regardless of what their parents can afford — that's the whole thesis. The EHEEE shouldn't be a lottery of postcode and income.\n\nLearnyx is shipping toward the national exam season with student cohorts across grade levels — and the platform grows with them: more subjects, deeper AI tutoring, and study rooms that turn solo grind into team sport.",
        demos: [],
        statBar: {
          accent: "gold",
          stats: [
            { value: "9–12", label: "Grade levels" },
            { value: "AI", label: "Tutoring core" },
            { value: "Live", label: "Study rooms" },
            { value: "Free", label: "Core access" },
          ],
        },
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Blog posts — three launch entries across the three categories
// ─────────────────────────────────────────────────────────────────────────────
const posts = [
  {
    slug: "shipping-a-real-time-erp-for-a-live-kitchen",
    title: "Shipping a real-time ERP for a kitchen that never sleeps",
    category: "Dev Log",
    excerpt:
      "What I learned building a seven-portal system around one Socket.IO bus — and why the boring architecture won.",
    readingMinutes: 6,
    published: true,
    coverImage: "/images/project-tgs.jpg",
    content: `Every system I ship starts the same way: a real person with a real problem. For TG's — a delivery-only Ethiopian restaurant in Dubai — the problem was a voice note lost between a ringing phone and a paper ticket.

## Start with the pipeline, not the screens

The whole ERP hangs off one principle: **one event bus, many surfaces**. A WhatsApp voice note arrives → Twilio transcribes it → the order core validates and structures it → Socket.IO fans it out to the kitchen display, the cashier, and the manager portal in the same instant. Every portal is a view over the same truth.

> If your data needs a "refresh" button to be correct, it isn't real-time — it's optimistic.

## The unglamorous parts that matter

- **Role separation from day one.** Chef, waiter, cashier and manager portals share the same events but never the same permissions. JWT claims, not UI hiding.
- **Postgres over cleverness.** We started on Neon, outgrew the free tier, and the Supabase migration was a pg_dump and a connection-string swap. Boring architecture is a feature.
- **The lottery engine.** A weekly customer lottery sounds like a gimmick — it's actually the retention loop that keeps regulars ordering.

## What I'd do differently

I'd add observability earlier. For two weeks the only signal that the kitchen display had dropped its socket was a chef saying the screen "felt stale." A heartbeat ping and a reconnect banner fixed it in an afternoon — after a fortnight of quiet chaos.

Systems that run real operations don't get to have exciting architecture. They get to have boring architecture and exciting uptime.`,
  },
  {
    slug: "reading-positioning-before-price",
    title: "Reading positioning before price: my COT weekend ritual",
    category: "Trading Insight",
    excerpt:
      "Commitment of Traders data is a slow signal in a fast market. Here's how I use it without pretending it's a crystal ball.",
    readingMinutes: 5,
    published: true,
    coverImage: "/images/project-nexus.jpg",
    content: `Price is the loudest voice in the market and the worst storyteller. Before I look at a single chart on Monday, I look at who was positioned on Tuesday — the COT report.

## The three players

- **Commercials** hedge real business. When they're aggressively short into a rally, I pay attention.
- **Large specs** chase momentum. Crowded longs are fuel — the question is only what lights the match.
- **Retail** is the classic contrarian marker. Not because retail is dumb — because retail arrives last.

> Positioning doesn't tell you when. It tells you how much air is in the room when something sparks.

## The asymmetry I actually trade

The setup that repeats: commercials accumulating, large specs piling into the other side, retail riding the spec trade. That asymmetry — hedgers versus tourists — tends to resolve violently and quickly. I don't front-run it; I mark levels and wait for confirmation.

## What this looks like in NEXUS

I built the COT Order Flow page into JJ NEXUS PRO because I wanted the same framework on stream that I use off stream. Viewers see the diverging bars — commercials on one side, specs and retail on the other — and learn to read the *shape* of a market before the candles.

It's slow data in a fast market. That's exactly why it's worth reading.`,
  },
  {
    slug: "building-from-addis-ababa-outward",
    title: "Building from Addis Ababa outward",
    category: "Startup Notes",
    excerpt:
      "Why I'm building a company at 18 from Addis Ababa — and what 'outward' actually means when the world doubts your postcode.",
    readingMinutes: 4,
    published: true,
    coverImage: "/images/startup-bg.jpg",
    content: `People ask why an eighteen-year-old would start a company from Addis Ababa instead of waiting his turn somewhere else. The honest answer: the problems I want to solve live here, and problems don't wait.

## Proximity is the advantage

Building Learnyx taught me something no accelerator could: **you can't feel exam-season panic from another continent.** When the EHEEE decides trajectories, the students refreshing a results page at 2am are a bus ride away, not a market research report. Proximity turns user empathy from a buzzword into a daily habit.

> The map is written in shipped products — not pitch decks.

## Three pillars, one trajectory

1. **Innovation** — solve for constraints. Unreliable bandwidth and low-end phones aren't obstacles; they're the spec.
2. **Scalability** — architecture that survives success. Supabase over a spreadsheet, queues over heroics.
3. **Impact** — if it doesn't change a real person's week, it doesn't ship.

## Outward means outlasting

"From Addis Ababa outward" isn't a slogan about geography. It's about direction: build where you are, prove it works, then let it travel — an ERP in Dubai, attendance systems for Ethiopian schools, exam prep for a nation. The comma between "Addis Ababa" and "outward" is where I live.`,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Testimonials — sample copy JJ can edit/replace from /admin/testimonials
// ─────────────────────────────────────────────────────────────────────────────
const testimonials = [
  {
    name: "Tsedal G.",
    role: "Owner — TG's Restaurant, Dubai",
    quote:
      "The kitchen screen and my phone finally show the same truth. JJ built the calm inside our busiest hours.",
    order: 0,
  },
  {
    name: "Dawit A.",
    role: "School Director — Addis Ababa",
    quote:
      "Parents stopped calling us in panic. The SMS arrives before we've finished marking the register.",
    order: 1,
  },
  {
    name: "Marcus T.",
    role: "Community member — Trading Floor",
    quote:
      "I've watched a lot of market streams. JJ is the first one where the research desk and the chart live in the same screen.",
    order: 2,
  },
  {
    name: "Hanna M.",
    role: "Grade 12 student — Learnyx cohort",
    quote:
      "The AI tutor explains integration better than my cram school — and the XP streak keeps me showing up.",
    order: 3,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Run
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log("Seeding JJ ONYX v2…");

  // Projects
  for (let i = 0; i < projects.length; i++) {
    const p = projects[i]!;
    await db.project.upsert({
      where: { slug: p.slug },
      create: { ...p, tags: JSON.stringify(p.tags), stats: JSON.stringify(p.stats), stack: JSON.stringify(p.stack), sections: JSON.stringify(p.sections), order: i, published: true },
      update: {
        title: p.title, amharic: p.amharic, tagline: p.tagline, hook: p.hook,
        tags: JSON.stringify(p.tags), year: p.year, role: p.role, image: p.image,
        accent: p.accent, stats: JSON.stringify(p.stats), stack: JSON.stringify(p.stack),
        sections: JSON.stringify(p.sections), order: i,
      },
    });
  }
  console.log(`  ✓ ${projects.length} projects`);

  // Home content singleton
  const home = await db.homeContent.upsert({
    where: { id: "home" },
    create: {
      id: "home",
      kicker: "JJ ONYX — Est. Addis Ababa",
      headlineLine1: "JOSEPH",
      headlineLine2: "JAMES",
      subheadline:
        "I build real-time systems, trade the markets live, and stream the whole story — from Addis Ababa outward.",
      ctaPrimaryLabel: "Enter the story",
      ctaPrimaryHref: "/about",
      ctaSecondaryLabel: "Start a project",
      ctaSecondaryHref: "/contact",
      featuredHeading: "Systems that run *real operations.*",
      featuredSubheading:
        "Four production builds — a restaurant, a school, a trading desk, a classroom. Every one shipped, every one real.",
    },
    update: {},
  });
  if (!home.roles || home.roles === "[]") {
    await db.homeContent.update({
      where: { id: "home" },
      data: {
        roles: JSON.stringify(["Fullstack Developer", "Forex Trader", "Forex Streamer", "Founder"]),
        stats: JSON.stringify([
          { to: 4, label: "Major systems shipped" },
          { to: 15, suffix: "+", label: "Real-time interfaces & portals" },
          { to: 2, label: "Disciplines — Dev × Trading" },
        ]),
      },
    });
  }
  console.log("  ✓ home content");

  // Site settings singleton
  await db.siteSetting.upsert({
    where: { id: "site" },
    create: {
      id: "site",
      socials: JSON.stringify([
        { label: "Twitch", platform: "Twitch", href: "#", note: "Watch me stream" },
        { label: "Telegram", platform: "Telegram", href: "#", note: "Trading floor" },
        { label: "GitHub", platform: "GitHub", href: "#", note: "Read my code" },
        { label: "LinkedIn", platform: "LinkedIn", href: "#", note: "Connect" },
      ]),
      nowContent: `## Building

- **TG's Restaurant ERP** — live in production, feeding Dubai one voice note at a time. Currently hardening the dispatch pipeline and the weekly lottery engine.
- **AttendX⚡** — piloting with schools in Addis Ababa. Geofenced check-in verification is next on the roadmap.
- **This site** — the v2 control panel just shipped; everything you're reading is editable from my own admin.

## Trading

- Morning COT review ritual every weekend — positioning first, price second.
- Streaming the London open on Twitch a few days a week.
- Studying order-flow footprints beyond COT: delta, absorption, and how they rhyme.

## Learning

- **Rust** — rewriting my market-data proxy hot paths for fun and latency.
- **Systems design** — one deep paper a week, notes going into the Journal.

## Off the clock

- Amharic lessons with my grandmother (the hardest codebase I've ever touched).
- Long walks downtown Addis with a notebook — most ideas start there.`,
    },
    update: {},
  });
  const settings = await db.siteSetting.findUnique({ where: { id: "site" } });
  if (settings && !settings.nowUpdatedAt) {
    await db.siteSetting.update({ where: { id: "site" }, data: { nowUpdatedAt: new Date() } });
  }
  console.log("  ✓ site settings (+ /now content)");

  // Testimonials
  for (const t of testimonials) {
    const existing = await db.testimonial.findFirst({ where: { name: t.name } });
    if (!existing) await db.testimonial.create({ data: t });
  }
  console.log(`  ✓ ${testimonials.length} testimonials`);

  // Blog posts
  for (const p of posts) {
    const publishedAt = new Date(Date.now() - posts.indexOf(p) * 7 * 24 * 3600 * 1000);
    await db.blogPost.upsert({
      where: { slug: p.slug },
      create: { ...p, publishedAt },
      update: {
        title: p.title, category: p.category, excerpt: p.excerpt,
        content: p.content, coverImage: p.coverImage, readingMinutes: p.readingMinutes,
        published: p.published, publishedAt,
      },
    });
  }
  console.log(`  ✓ ${posts.length} blog posts`);

  await db.activityLog.create({ data: { action: "Database seeded", detail: "v2 content migration" } }).catch(() => {});
  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
