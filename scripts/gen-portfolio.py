"""
JJ ONYX — full portfolio deck PDF, generated from the live SQLite DB (db/custom.db).
Dark obsidian/gold deck: cover, duality, one page per published project,
startup vision, contact. Run: python3 scripts/gen-portfolio.py
Mirrors scripts/gen-resume.py (platypus, FreeSerif) with dark full-bleed pages.
"""
import datetime
import json
import os
import re
import sqlite3

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import cm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.pdfmetrics import registerFontFamily
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (HRFlowable, PageBreak, Paragraph,
                                SimpleDocTemplate, Spacer, Table, TableStyle)

# ── Palette (worklog conventions: obsidian #0A0A0F, gold #D4A857) ──────────
OBSIDIAN = colors.HexColor("#0A0A0F")
PANEL = colors.HexColor("#14141C")
GOLD = colors.HexColor("#D4A857")
GOLD_DIM = colors.HexColor("#D4A85780")
TEXT = colors.HexColor("#EDEAE2")
MUTED = colors.HexColor("#8A877D")

FONT_DIR = "/usr/share/fonts/truetype/freefont"
pdfmetrics.registerFont(TTFont("FreeSerif", f"{FONT_DIR}/FreeSerif.ttf"))
pdfmetrics.registerFont(TTFont("FreeSerif-Bold", f"{FONT_DIR}/FreeSerifBold.ttf"))
pdfmetrics.registerFont(TTFont("FreeSerif-Italic", f"{FONT_DIR}/FreeSerifItalic.ttf"))
pdfmetrics.registerFont(TTFont("FreeSerif-BoldItalic", f"{FONT_DIR}/FreeSerifBoldItalic.ttf"))
registerFontFamily("FreeSerif", normal="FreeSerif", bold="FreeSerif-Bold",
                   italic="FreeSerif-Italic", boldItalic="FreeSerif-BoldItalic")

DB = "/home/z/my-project/db/custom.db"
OUT = "/home/z/my-project/public/portfolio/joseph-james-portfolio.pdf"
YEAR = str(datetime.date.today().year)

# ── Styles ─────────────────────────────────────────────────────────────────
wordmark = ParagraphStyle("Wordmark", fontName="FreeSerif-Bold", fontSize=56, leading=62, alignment=TA_CENTER, textColor=GOLD)
cover_tag = ParagraphStyle("CoverTag", fontName="FreeSerif", fontSize=13, leading=18, alignment=TA_CENTER, textColor=TEXT)
cover_year = ParagraphStyle("CoverYear", fontName="FreeSerif", fontSize=10, leading=14, alignment=TA_CENTER, textColor=MUTED)
h1 = ParagraphStyle("H1", fontName="FreeSerif-Bold", fontSize=13, leading=17, textColor=GOLD, spaceAfter=3)
proj_title = ParagraphStyle("ProjTitle", fontName="FreeSerif-Bold", fontSize=22, leading=26, textColor=TEXT, spaceAfter=2)
proj_meta = ParagraphStyle("ProjMeta", fontName="FreeSerif", fontSize=9.5, leading=13, textColor=GOLD, spaceAfter=4)
proj_tag = ParagraphStyle("ProjTag", fontName="FreeSerif-Italic", fontSize=11, leading=15, textColor=MUTED, spaceAfter=8)
label = ParagraphStyle("Label", fontName="FreeSerif-Bold", fontSize=9, leading=12, textColor=GOLD, spaceBefore=7, spaceAfter=2)
body = ParagraphStyle("Body", fontName="FreeSerif", fontSize=10, leading=14, textColor=TEXT, spaceAfter=4)
motif = ParagraphStyle("Motif", fontName="FreeSerif-Italic", fontSize=14, leading=18, alignment=TA_CENTER, textColor=GOLD, spaceBefore=10, spaceAfter=10)
chip = ParagraphStyle("Chip", fontName="FreeSerif", fontSize=8.5, leading=11, alignment=TA_CENTER, textColor=TEXT)
stat_val = ParagraphStyle("StatVal", fontName="FreeSerif-Bold", fontSize=15, leading=18, alignment=TA_CENTER, textColor=GOLD)
stat_lab = ParagraphStyle("StatLab", fontName="FreeSerif", fontSize=7.5, leading=10, alignment=TA_CENTER, textColor=MUTED)
closing = ParagraphStyle("Closing", fontName="FreeSerif-Bold", fontSize=30, leading=36, alignment=TA_CENTER, textColor=TEXT)
closing_gold = ParagraphStyle("ClosingGold", fontName="FreeSerif-Bold", fontSize=30, leading=36, alignment=TA_CENTER, textColor=GOLD)

# ── DB + fallbacks (canonical copy from prisma/seed.ts) ────────────────────
FALLBACK_PROJECTS = [
    dict(title="TG's Restaurant ERP", tagline="A real-time ERP running a delivery-only Ethiopian restaurant in Dubai.", year="2024", role="Founder & Lead Engineer",
         problem="Delivery-only restaurant running on memory, paper tickets and shouting across the kitchen — missed voice notes, double-entered tickets, drivers on stale information.",
         solution="A unified real-time multi-portal ERP: intake, kitchen, dispatch, finances — every role gets a purpose-built portal and every portal sees the same truth at the same moment.",
         stack=["pnpm monorepo", "React + Vite", "Express", "PostgreSQL · Supabase", "Socket.IO", "JWT · RBAC", "Twilio Voice", "Render"],
         stats=[{"value": "7", "label": "Connected portals"}, {"value": "<1s", "label": "Order sync"}, {"value": "24/7", "label": "Live kitchen ops"}]),
    dict(title="ATTENDX", tagline="AI-powered attendance & student safety for schools.", year="2024", role="Founder & Engineer",
         problem="Paper roll-calls steal class time and miss absentees until it is too late; student safety depends on information that arrives hours late.",
         solution="Multi-modal check-in (AI face recognition, QR, fingerprint) feeding a live analytics dashboard, with automated parent SMS within five seconds of arrival.",
         stack=["Vite + React", "TypeScript", "Node", "Face Recognition", "PostgreSQL", "SMS Gateway"],
         stats=[{"value": "5s", "label": "Parent SMS alert"}, {"value": "3", "label": "Check-in modes"}, {"value": "Live", "label": "Absenteeism analytics"}]),
    dict(title="JJ NEXUS PRO", tagline="A forex trading & live-streaming powerhouse.", year="2024", role="Creator & Engineer",
         problem="Trading and streaming pull you into five different tools — charts, broadcast, research, chat, hope. Every context switch is lost focus, and focus is the entire game.",
         solution="One browser-to-RTMP command center: FFmpeg broadcast pipeline, phone-camera PWA input, unified market-data proxies and a COT order-flow research module.",
         stack=["Next.js", "TypeScript", "FFmpeg · RTMP", "WebSocket", "TradingView", "PWA"],
         stats=[{"value": "1", "label": "Browser → RTMP"}, {"value": "COT", "label": "Order-flow research"}, {"value": "Live", "label": "Market data"}]),
    dict(title="Learnyx Academy", tagline="AI-powered national exam prep for Ethiopian students.", year="2025", role="Founder & Engineer",
         problem="Grade 9–12 students prepare for the national EHEEE exam with outdated shared textbooks and no personal feedback loop.",
         solution="A Groq-powered AI tutor, LiveKit study rooms, quizzes, flashcards and an XP achievement system on a freemium model, aligned to the national curriculum.",
         stack=["Vite + React", "TypeScript", "Convex", "Groq AI", "Cloudflare R2", "Render"],
         stats=[{"value": "AI", "label": "Groq tutor"}, {"value": "9–12", "label": "Grades covered"}, {"value": "XP", "label": "Achievement system"}]),
]
FALLBACK_SOCIALS = ["Twitch", "Telegram", "GitHub", "LinkedIn"]


def jload(raw):
    try:
        return json.loads(raw) if raw else None
    except (ValueError, TypeError):
        return None


def load_db():
    projects, socials = [], []
    try:
        con = sqlite3.connect(DB)
        con.row_factory = sqlite3.Row
        rows = con.execute(
            "SELECT * FROM Project WHERE published = 1 ORDER BY \"order\", year").fetchall()
        for r in rows:
            sections = jload(r["sections"]) or []
            pick = lambda key: next((s for s in sections if key.lower() in str(s.get("title", "")).lower()), {})
            stack = jload(r["stack"]) or []
            projects.append(dict(
                title=r["title"], tagline=r["tagline"], year=r["year"], role=r["role"],
                problem=pick("Problem").get("body", ""), solution=pick("Solution").get("body", ""),
                stack=stack if stack else next((f["stack"] for f in FALLBACK_PROJECTS if f["title"] == r["title"]), []),
                stats=jload(r["stats"]) or next((f["stats"] for f in FALLBACK_PROJECTS if f["title"] == r["title"]), []),
            ))
        srow = con.execute("SELECT socials FROM SiteSetting WHERE id = 'site'").fetchone()
        if srow:
            socials = [s.get("label", "") for s in (jload(srow["socials"]) or []) if s.get("label")]
        con.close()
    except Exception as e:  # noqa: BLE001 — deck must always build (fallbacks below)
        print(f"  ! DB read failed ({e}); using seed fallbacks")
    return (projects or FALLBACK_PROJECTS), (socials or FALLBACK_SOCIALS)


def strip_md(text, limit=600):
    """Markdown → plain text: strip links, markup chars, collapse whitespace."""
    text = re.sub(r"!\[[^\]]*\]\([^)]*\)", " ", text or "")
    text = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", text)
    text = re.sub(r"[#>*`_\[\]()]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    if len(text) > limit:
        text = text[:limit].rsplit(" ", 1)[0] + "…"
    return text


def esc(text):
    return (text or "").replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def chip_grid(items, cols=4, width=17.0 * cm):
    rows = [list(items[i:i + cols]) + [""] * (cols - len(items[i:i + cols]))
            for i in range(0, len(items), cols)]
    cells = [[esc(str(c)) and Paragraph(esc(str(c)), chip) for c in row] for row in rows]
    t = Table(cells, colWidths=[width / cols] * cols, hAlign="CENTER")
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), PANEL),
        ("GRID", (0, 0), (-1, -1), 0.5, GOLD_DIM),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 4), ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 2), ("RIGHTPADDING", (0, 0), (-1, -1), 2),
    ]))
    return t


def impact_strip(stats):
    cells = [[Paragraph(esc(s.get("value", "")), stat_val), Paragraph(esc(s.get("label", "")), stat_lab)]
             for s in stats[:4]]
    t = Table([cells], hAlign="CENTER")
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), PANEL),
        ("LINEABOVE", (0, 0), (-1, 0), 1.2, GOLD),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, GOLD_DIM),
        ("BOX", (0, 0), (-1, -1), 0.5, GOLD_DIM),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 7), ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("LEFTPADDING", (0, 0), (-1, -1), 10), ("RIGHTPADDING", (0, 0), (-1, -1), 10),
    ]))
    return t


# ── Page painter: obsidian full-bleed + thin gold rules ────────────────────
PAGES = [0]


def paint_page(canvas, doc):
    w, hgt = A4
    canvas.saveState()
    canvas.setFillColor(OBSIDIAN)
    canvas.rect(0, 0, w, hgt, stroke=0, fill=1)
    canvas.setStrokeColor(GOLD)
    canvas.setLineWidth(0.7)
    canvas.line(1.5 * cm, hgt - 1.3 * cm, w - 1.5 * cm, hgt - 1.3 * cm)
    canvas.line(1.5 * cm, 1.3 * cm, w - 1.5 * cm, 1.3 * cm)
    canvas.setFont("FreeSerif", 7.5)
    canvas.setFillColor(MUTED)
    canvas.drawString(1.5 * cm, 0.8 * cm, "JJ ONYX — PORTFOLIO DECK")
    canvas.drawRightString(w - 1.5 * cm, 0.8 * cm, "jjonyx.dev")
    canvas.restoreState()
    PAGES[0] = doc.page


# ── Story ──────────────────────────────────────────────────────────────────
projects, socials = load_db()
story = []

# a. COVER
story += [Spacer(1, 6.4 * cm),
          Paragraph("JJ ONYX", wordmark),
          Spacer(1, 0.45 * cm),
          HRFlowable(width="30%", thickness=1, color=GOLD, hAlign="CENTER", spaceBefore=2, spaceAfter=12),
          Paragraph("Builder. Trader. Storyteller.", cover_tag),
          Spacer(1, 0.35 * cm),
          Paragraph(f"PORTFOLIO DECK · {YEAR}", cover_year),
          PageBreak()]

# b. THE DUALITY
story += [Paragraph("THE DUALITY", h1),
          HRFlowable(width="100%", thickness=0.8, color=GOLD_DIM, spaceAfter=8),
          Paragraph(
              "Joseph James — JJ — is an eighteen-year-old fullstack developer from Addis Ababa, now building and operating "
              "real-time systems out of Dubai. On one side of the mind: Next.js, TypeScript, Postgres, WebSockets and Prisma, "
              "shipping production platforms — a seven-portal restaurant ERP, an AI attendance system for schools, an AI exam-prep "
              "academy — all as a founder.", body),
          Paragraph(
              "On the other side: the markets. JJ trades forex and streams the desk live, bringing a trader's instinct for latency, "
              "risk and real-time data into every system he engineers. The developer builds the infrastructure; the trader stress-tests "
              "it against reality. Both run on the same discipline: ship it live, keep it honest.", body),
          Paragraph("“One mind. Two markets.”", motif),
          Paragraph("ARSENAL", h1),
          Spacer(1, 4),
          chip_grid(["Next.js", "TypeScript", "React", "Node.js", "Prisma", "PostgreSQL", "Real-Time", "WebSockets",
                     "Socket.IO", "GSAP", "TradingView", "Groq AI", "FFmpeg · RTMP", "Convex", "Tailwind", "Express"]),
          PageBreak()]

# c. ONE PAGE PER PUBLISHED PROJECT
for p in projects:
    stats = p["stats"] or []
    story += [Paragraph(f"{p['year']} · {esc(p['role'])}", proj_meta),
              Paragraph(esc(p["title"]), proj_title),
              Paragraph(esc(p["tagline"]), proj_tag),
              HRFlowable(width="100%", thickness=0.8, color=GOLD_DIM, spaceAfter=6),
              Paragraph("PROBLEM", label), Paragraph(esc(strip_md(p["problem"])), body),
              Paragraph("SOLUTION", label), Paragraph(esc(strip_md(p["solution"])), body)]
    if p["stack"]:
        story += [Paragraph("STACK", label), Spacer(1, 2), chip_grid([str(s) for s in p["stack"]][:8], cols=4)]
    if stats:
        story += [Paragraph("IMPACT", label), Spacer(1, 2), impact_strip(stats)]
    story.append(PageBreak())

# d. STARTUP VISION
story += [Paragraph("STARTUP VISION", h1),
          HRFlowable(width="100%", thickness=0.8, color=GOLD_DIM, spaceAfter=8),
          Paragraph(
              "Every system starts in Addis Ababa and ships outward. The trajectory runs across four domains — restaurants, "
              "education, markets, media — each one a real operation with real users, built alone end-to-end and run in production. "
              "No pitch decks: infrastructure first, revenue on top, story told live.", body),
          Paragraph("“Build where you stand. Ship what works. Scale from Addis outward.”", motif),
          Paragraph("FOUR DOMAINS — STATUS", label), Spacer(1, 4),
          chip_grid(["TG's ERP — LIVE · Dubai", "ATTENDX — PILOT · Addis schools", "JJ NEXUS PRO — LIVE · Trading desk",
                     "LEARNYX — BUILDING · Exam prep"], cols=2),
          PageBreak()]

# e. CLOSING / CONTACT
story += [Spacer(1, 5.6 * cm),
          Paragraph("Let's build", closing),
          Paragraph("what's next.", closing_gold),
          Spacer(1, 0.6 * cm),
          HRFlowable(width="30%", thickness=1, color=GOLD, hAlign="CENTER", spaceBefore=2, spaceAfter=14),
          Paragraph(" · ".join(esc(s) for s in socials), cover_tag),
          Spacer(1, 0.35 * cm),
          Paragraph("jj@onyx.studio · jjonyx.dev", cover_year)]

os.makedirs(os.path.dirname(OUT), exist_ok=True)
doc = SimpleDocTemplate(OUT, pagesize=A4, leftMargin=1.5 * cm, rightMargin=1.5 * cm,
                        topMargin=2.1 * cm, bottomMargin=2.1 * cm,
                        title="Joseph James — Portfolio Deck", author="Joseph James",
                        subject="Fullstack Developer, Forex Trader, Founder — JJ ONYX",
                        creator="JJ ONYX")
doc.build(story, onFirstPage=paint_page, onLaterPages=paint_page)
size_kb = round(os.path.getsize(OUT) / 1024, 1)
print(f"OK -> {OUT} ({size_kb} KB, {PAGES[0]} pages)")
