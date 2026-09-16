"""
JJ ONYX — generate the downloadable resume PDF for /resume.
ATS-safe single-column layout per the pdf skill resume brief.
Run: python3 scripts/gen-resume.py
"""
import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily

# ── Palette (from pdf.py palette.cascade — mode minimal, hue 45°) ──────────
ACCENT = colors.HexColor("#86702b")
TEXT = colors.HexColor("#1d1c1a")
MUTED = colors.HexColor("#7a7871")
BORDER = colors.HexColor("#d1cec4")

# ── Fonts ───────────────────────────────────────────────────────────────────
FONT_DIR = "/usr/share/fonts/truetype/freefont"
pdfmetrics.registerFont(TTFont("FreeSerif", f"{FONT_DIR}/FreeSerif.ttf"))
pdfmetrics.registerFont(TTFont("FreeSerif-Bold", f"{FONT_DIR}/FreeSerifBold.ttf"))
pdfmetrics.registerFont(TTFont("FreeSerif-Italic", f"{FONT_DIR}/FreeSerifItalic.ttf"))
pdfmetrics.registerFont(TTFont("FreeSerif-BoldItalic", f"{FONT_DIR}/FreeSerifBoldItalic.ttf"))
registerFontFamily(
    "FreeSerif",
    normal="FreeSerif",
    bold="FreeSerif-Bold",
    italic="FreeSerif-Italic",
    boldItalic="FreeSerif-BoldItalic",
)

OUT = "/home/z/my-project/public/resume/joseph-james-resume.pdf"

# ── Styles (brief: body 10-10.5pt, name 22-26pt, sections 13-14pt, min 9pt) ─
name_style = ParagraphStyle("Name", fontName="FreeSerif", fontSize=24, leading=28, alignment=TA_CENTER, textColor=TEXT, spaceAfter=2)
tagline_style = ParagraphStyle("Tagline", fontName="FreeSerif", fontSize=10.5, leading=14, alignment=TA_CENTER, textColor=ACCENT, spaceAfter=4)
contact_style = ParagraphStyle("Contact", fontName="FreeSerif", fontSize=10, leading=14, alignment=TA_CENTER, textColor=MUTED, spaceAfter=6)
section_style = ParagraphStyle("Section", fontName="FreeSerif", fontSize=13, leading=16, spaceBefore=9, spaceAfter=4, textColor=ACCENT, alignment=TA_LEFT)
job_title_style = ParagraphStyle("JobTitle", fontName="FreeSerif", fontSize=11, leading=13.5, textColor=TEXT, spaceAfter=1)
job_meta_style = ParagraphStyle("JobMeta", fontName="FreeSerif", fontSize=10, leading=12.5, textColor=MUTED, spaceAfter=3)
bullet_style = ParagraphStyle("Bullet", fontName="FreeSerif", fontSize=10, leading=13.2, leftIndent=14, textColor=TEXT, spaceBefore=0.5, spaceAfter=0.5)
body_style = ParagraphStyle("Body", fontName="FreeSerif", fontSize=10, leading=13.5, textColor=TEXT, spaceAfter=2)


def section_header(title):
    return [
        Paragraph(f"<b>{title}</b>", section_style),
        HRFlowable(width="100%", thickness=0.8, color=BORDER, spaceBefore=0, spaceAfter=6),
    ]


def entry(title, meta, bullets):
    out = [Paragraph(f"<b>{title}</b>", job_title_style), Paragraph(meta, job_meta_style)]
    for b in bullets:
        out.append(Paragraph(f"• {b}", bullet_style))
    out.append(Spacer(1, 3))
    return out


doc = SimpleDocTemplate(
    OUT,
    pagesize=A4,
    leftMargin=1.5 * cm,
    rightMargin=1.5 * cm,
    topMargin=1.5 * cm,
    bottomMargin=1.5 * cm,
    title="Joseph James — Fullstack Developer & Forex Trader",
    author="Joseph James",
    subject="Resume — Fullstack Developer, Forex Trader, Founder",
    creator="JJ ONYX",
)

story = []

# ── Header ──────────────────────────────────────────────────────────────────
story.append(Paragraph("JOSEPH JAMES", name_style))
story.append(Paragraph("Fullstack Developer · Forex Trader · Founder — “JJ ONYX”", tagline_style))
story.append(Paragraph("Addis Ababa, Ethiopia · Dubai operations · jj@onyx.studio · jjonyx.dev", contact_style))
story.append(HRFlowable(width="100%", thickness=1, color=ACCENT, spaceBefore=2, spaceAfter=6))

# ── Summary ─────────────────────────────────────────────────────────────────
story.append(Paragraph(
    "Eighteen-year-old fullstack developer, forex trader and live streamer. Founder of an IT studio "
    "building real-time platforms from Addis Ababa outward: a seven-portal restaurant ERP running live "
    "kitchen operations in Dubai, an AI attendance platform protecting students in Ethiopian schools, an "
    "AI-powered national exam-prep academy, and a browser-to-RTMP trading and broadcast command center. "
    "Comfortable across the whole stack — TypeScript, React/Next.js, Node, PostgreSQL and Convex — with a "
    "trader's instinct for latency, risk and real-time data.",
    body_style,
))

# ── Selected Projects & Experience ──────────────────────────────────────────
story += section_header("Selected Projects & Experience")
story += entry(
    "Founder & Lead Engineer — TG's Restaurant ERP",
    "Delivery-only Ethiopian restaurant, Dubai · 2024",
    [
        "Built and operate a real-time multi-portal ERP: customer webapp, WhatsApp voice-order queue, Kitchen Display, Chef / Waiter / Cashier / Manager portals, lottery engine and automated Drive backups.",
        "Unified all surfaces through one Socket.IO event bus — a voice note becomes a structured kitchen ticket in under a second; zero lost tickets in production.",
        "Stack: pnpm monorepo, React + Vite, Express, PostgreSQL (Supabase), Socket.IO, JWT RBAC, Twilio Voice, Google Drive API, Render.",
    ],
)
story += entry(
    "Founder & Engineer — ATTENDX (AI Attendance & Student Safety)",
    "Ethiopian schools pilot · 2024",
    [
        "Multi-modal check-in (AI face recognition, QR, fingerprint) feeding a live analytics dashboard with absenteeism pattern detection.",
        "Automated parent SMS within five seconds of arrival; encrypted credentials and role-based access for student data.",
    ],
)
story += entry(
    "Creator & Engineer — JJ NEXUS PRO (Trading & Streaming Platform)",
    "Personal production system · 2024",
    [
        "Browser-to-RTMP broadcast pipeline (FFmpeg), phone-camera PWA input, GitHub Codespaces cloud streaming, and unified market-data proxies.",
        "COT Order Flow research module implementing quantitative positioning models used on live streams.",
    ],
)
story += entry(
    "Founder & Engineer — Learnyx Academy (AI Exam Prep)",
    "Grade 9–12, Ethiopian national curriculum (EHEEE) · 2025",
    [
        "Groq-powered AI tutor, LiveKit study rooms, quizzes, flashcards and an XP achievement system on a freemium model.",
        "Stack: Vite + React + TypeScript, Convex, Cloudflare R2, Render.",
    ],
)

# ── Skills ──────────────────────────────────────────────────────────────────
story += section_header("Skills")
skills = [
    ("Engineering", "TypeScript, React, Next.js, Node + Express, Socket.IO, WebSocket, JWT/RBAC"),
    ("Data & Infra", "PostgreSQL, Supabase, Convex, Cloudflare R2, Render, Google Drive API, Twilio"),
    ("AI", "Groq LLM integration, face recognition pipelines, realtime analytics"),
    ("Trading", "Market structure, COT positioning analysis, risk management, prop-firm discipline"),
    ("Media", "FFmpeg/RTMP pipelines, OBS-equivalent browser broadcasting, live stream production"),
]
for label, vals in skills:
    story.append(Paragraph(f"<b>{label}:</b>  {vals}", body_style))

# ── Education ───────────────────────────────────────────────────────────────
story += section_header("Education & Languages")
story.append(Paragraph("<b>Secondary education — Ethiopian national curriculum</b>", job_title_style))
story.append(Paragraph("Grade 12 · balancing final-year studies with live products in production", job_meta_style))
story.append(Paragraph("<b>Languages:</b>  Amharic (native) · English (fluent) · Nigerian Pidgin (conversational)", body_style))

doc.build(story)
size_kb = round(os.path.getsize(OUT) / 1024, 1)
print(f"OK -> {OUT} ({size_kb} KB)")
