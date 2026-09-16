/**
 * JJ ONYX — shared Open Graph image templates (1200×630).
 *
 * Rendered with next/og (satori). Satori constraints honored throughout:
 *  - flexbox ONLY (no CSS grid); every container with >1 child sets display:"flex"
 *  - longhand style properties only (flexDirection, alignItems, paddingTop, …)
 *  - colors as hex / rgba strings; transforms via `transform`; opacity via `opacity`
 *  - inline <svg> restricted to satori-supported elements (only <svg>/<path> used)
 *  - NO remote fonts (offline sandbox) — satori's bundled Noto Sans default;
 *    requested weights 600/700 gracefully fall back to the regular face.
 *
 * Exported builders:
 *  - buildBrandOg()                 → (site) default for every static public page
 *  - buildCaseStudyOg(project)      → /work/<slug> per-project accent template
 *  - buildBlogOg({ title, category }) → /blog/[slug] journal template
 */

import type { ReactElement, ReactNode } from "react";
import type { Project } from "@/lib/data/projects";

// ── Palette ─────────────────────────────────────────────────────────────

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

const C = {
  bg: "#0A0A0F",
  ink: "#F2EFE8",
  gold: "#D4A857",
  /** gold @ 0.7 pre-blended over #0A0A0F (rgba() kept out of the bottom row) */
  goldDim: "#8a744d",
  muted: "#9B9BA7",
} as const;

const ACCENT_HEX: Record<Project["accent"], string> = {
  gold: "#D4A857",
  mint: "#00E5A0",
  ice: "#22D3EE",
};

const ACCENT_BORDER: Record<Project["accent"], string> = {
  gold: "rgba(212,168,87,0.5)",
  mint: "rgba(0,229,160,0.5)",
  ice: "rgba(34,211,238,0.5)",
};

/**
 * The bundled default font has no emoji / misc-symbol glyphs (e.g. "⚡" in
 * ATTENDX⚡) — strip everything outside its coverage so satori never draws tofu.
 * Keeps safe punctuation: · × — → & '
 */
const UNSAFE_GLYPHS = /[\u2600-\u27BF\u2B00-\u2BFF\uFE0F\u{1F000}-\u{1FAFF}]/gu;

function safeText(input: string | null | undefined): string {
  return (input ?? "")
    .replace(UNSAFE_GLYPHS, "")
    .replace(/\s+/g, " ")
    .trim();
}

// ── Chrome: faceted-gem watermark ───────────────────────────────────────

/** Oversized faceted kite/diamond, anchored off the right edge @ 0.06 opacity. */
function GemWatermark(): ReactElement {
  return (
    <div
      style={{
        position: "absolute",
        top: -50,
        right: -90,
        display: "flex",
        opacity: 0.06,
      }}
    >
      <svg width={540} height={540} viewBox="0 0 500 500">
        {/* crown facets */}
        <path d="M250 25 L55 195 L250 195 Z" fill="#D4A857" />
        <path d="M250 25 L445 195 L250 195 Z" fill="#b8924a" />
        {/* pavilion facets */}
        <path d="M55 195 L250 195 L250 475 Z" fill="#8a744d" />
        <path d="M445 195 L250 195 L250 475 Z" fill="#e0bd76" />
      </svg>
    </div>
  );
}

/**
 * Subtle textile feel — absolutely-positioned rotated square outlines,
 * gold border @ 0.05 opacity as geometric texture.
 */
function TextureSquares(): ReactElement {
  const square = {
    position: "absolute",
    display: "flex",
    border: "2px solid #D4A857",
    opacity: 0.05,
  } as const;
  return (
    <div style={{ position: "absolute", top: 0, left: 0, display: "flex" }}>
      <div
        style={{
          ...square,
          top: -70,
          left: -70,
          width: 210,
          height: 210,
          transform: "rotate(45deg)",
        }}
      />
      <div
        style={{
          ...square,
          bottom: -90,
          left: 430,
          width: 260,
          height: 260,
          transform: "rotate(22deg)",
        }}
      />
      <div
        style={{
          ...square,
          top: 140,
          right: 330,
          width: 150,
          height: 150,
          transform: "rotate(64deg)",
        }}
      />
    </div>
  );
}

// ── Chrome: wordmark + bottom row ───────────────────────────────────────

function Wordmark(): ReactElement {
  return (
    <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
      <span
        style={{
          display: "flex",
          color: C.gold,
          fontSize: 44,
          fontWeight: 700,
          lineHeight: 1,
          letterSpacing: 2,
        }}
      >
        JJ
      </span>
      <span
        style={{
          display: "flex",
          color: C.ink,
          fontSize: 30,
          fontWeight: 600,
          letterSpacing: 12,
          lineHeight: 1.1,
          marginLeft: 16,
        }}
      >
        ONYX
      </span>
    </div>
  );
}

function BottomRow({ footerLeft }: { footerLeft: string }): ReactElement {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {/* thin gold rule accent */}
      <div
        style={{
          display: "flex",
          width: "100%",
          height: 2,
          backgroundColor: C.gold,
          opacity: 0.3,
        }}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 22,
        }}
      >
        <span
          style={{
            display: "flex",
            fontSize: 20,
            letterSpacing: 6,
            color: C.muted,
            lineHeight: 1.2,
          }}
        >
          {footerLeft}
        </span>
        <span
          style={{
            display: "flex",
            fontSize: 20,
            letterSpacing: 6,
            color: C.goldDim,
            lineHeight: 1.2,
          }}
        >
          ADDIS ABABA → EVERYWHERE
        </span>
      </div>
    </div>
  );
}

/** Shared 1200×630 onyx frame: watermark + texture + wordmark + bottom row. */
function OgFrame({
  footerLeft,
  children,
}: {
  footerLeft: string;
  children: ReactNode;
}): ReactElement {
  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        width: OG_WIDTH,
        height: OG_HEIGHT,
        backgroundColor: C.bg,
        flexDirection: "column",
        fontFamily: "sans-serif",
        paddingTop: 52,
        paddingBottom: 48,
        paddingLeft: 76,
        paddingRight: 76,
      }}
    >
      <GemWatermark />
      <TextureSquares />
      <Wordmark />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          flexGrow: 1,
        }}
      >
        {children}
      </div>
      <BottomRow footerLeft={footerLeft} />
    </div>
  );
}

/** Short gold rule that opens every variant's content block. */
function GoldBar({ color }: { color: string }): ReactElement {
  return (
    <div
      style={{
        display: "flex",
        width: 64,
        height: 3,
        backgroundColor: color,
      }}
    />
  );
}

// ── Variant 1 — brand default ───────────────────────────────────────────

export function buildBrandOg(): ReactElement {
  return (
    <OgFrame footerLeft="BUILDER · TRADER · STORYTELLER">
      <div style={{ display: "flex", flexDirection: "column" }}>
        <GoldBar color={C.gold} />
        <span
          style={{
            display: "flex",
            fontSize: 20,
            letterSpacing: 8,
            color: C.muted,
            marginTop: 22,
            lineHeight: 1.2,
          }}
        >
          JJ ONYX — PORTFOLIO
        </span>
        <span
          style={{
            display: "flex",
            fontSize: 72,
            fontWeight: 700,
            color: C.ink,
            marginTop: 16,
            lineHeight: 1.05,
          }}
        >
          Joseph James
        </span>
        <span
          style={{
            display: "flex",
            fontSize: 30,
            color: C.gold,
            marginTop: 14,
            lineHeight: 1.3,
          }}
        >
          Fullstack Developer × Forex Trader
        </span>
      </div>
    </OgFrame>
  );
}

// ── Variant 2 — case study (per-project accent) ─────────────────────────

export function buildCaseStudyOg(project: Project): ReactElement {
  const accent: Project["accent"] = project.accent ?? "gold";
  const tint = ACCENT_HEX[accent] ?? C.gold;
  const chipBorder = ACCENT_BORDER[accent] ?? ACCENT_BORDER.gold;
  const kicker = safeText(
    `CASE STUDY — ${project.year} · ${project.role}`.toUpperCase()
  );
  const title = safeText(project.title);
  const tagline = safeText(project.tagline);
  const stats = (project.stats ?? []).slice(0, 3);

  return (
    <OgFrame footerLeft="BUILDER · TRADER · STORYTELLER">
      <div style={{ display: "flex", flexDirection: "column" }}>
        <GoldBar color={tint} />
        <span
          style={{
            display: "flex",
            fontSize: 20,
            letterSpacing: 6,
            color: tint,
            marginTop: 20,
            lineHeight: 1.2,
          }}
        >
          {kicker}
        </span>
        <span
          style={{
            display: "flex",
            fontSize: 64,
            fontWeight: 700,
            color: C.ink,
            marginTop: 14,
            maxWidth: 880,
            lineHeight: 1.08,
          }}
        >
          {title}
        </span>
        <span
          style={{
            display: "flex",
            fontSize: 28,
            color: C.muted,
            marginTop: 12,
            maxWidth: 860,
            lineHeight: 1.35,
          }}
        >
          {tagline}
        </span>
        {stats.length > 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              marginTop: 28,
            }}
          >
            {stats.map((stat) => (
              <div
                key={safeText(stat.label) || safeText(stat.value)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  border: `1px solid ${chipBorder}`,
                  borderRadius: 10,
                  paddingTop: 14,
                  paddingBottom: 14,
                  paddingLeft: 22,
                  paddingRight: 22,
                  marginRight: 16,
                }}
              >
                <span
                  style={{
                    display: "flex",
                    fontSize: 34,
                    fontWeight: 700,
                    color: tint,
                    lineHeight: 1.15,
                  }}
                >
                  {safeText(stat.value)}
                </span>
                <span
                  style={{
                    display: "flex",
                    fontSize: 16,
                    letterSpacing: 2,
                    color: C.muted,
                    marginTop: 6,
                    lineHeight: 1.3,
                    textTransform: "uppercase",
                  }}
                >
                  {safeText(stat.label)}
                </span>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </OgFrame>
  );
}

// ── Variant 3 — blog post ───────────────────────────────────────────────

export interface OgPostData {
  title: string;
  category: string;
}

export function buildBlogOg(post: OgPostData): ReactElement {
  const category = safeText(post.category).toUpperCase() || "JOURNAL";
  const title = safeText(post.title);

  return (
    <OgFrame footerLeft="JOSEPH JAMES — JJ ONYX">
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", flexDirection: "row" }}>
          <div
            style={{
              display: "flex",
              border: "1px solid rgba(212,168,87,0.5)",
              borderRadius: 8,
              paddingTop: 8,
              paddingBottom: 8,
              paddingLeft: 18,
              paddingRight: 18,
            }}
          >
            <span
              style={{
                display: "flex",
                fontSize: 18,
                letterSpacing: 4,
                color: C.gold,
                lineHeight: 1.3,
              }}
            >
              {category}
            </span>
          </div>
        </div>
        <div style={{ display: "flex", marginTop: 26 }}>
          <GoldBar color={C.gold} />
        </div>
        <span
          style={{
            display: "flex",
            fontSize: 58,
            fontWeight: 700,
            color: C.ink,
            marginTop: 20,
            maxWidth: 980,
            lineHeight: 1.12,
          }}
        >
          {title}
        </span>
      </div>
    </OgFrame>
  );
}
