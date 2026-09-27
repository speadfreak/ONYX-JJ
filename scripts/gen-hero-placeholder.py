#!/usr/bin/env python3
"""
JJ ONYX — placeholder hero background loop generator.

Replaces the original near-black placeholder (avg luma ~6/255) with a
VISIBLE-but-subtle onyx/gold loop: three slow-drifting gold glows + fine
gold dust rising, all mathematically seamless (integer frequencies over
the loop) so the 10s cycle has no visible cut.

Renders at 1/4 resolution and upscales (all content is soft/low-frequency),
which keeps generation fast while the encoded video stays 960x540.

Usage:  python3 scripts/gen-hero-placeholder.py
Output: public/video/hero-loop.webm + public/video/hero-loop.mp4 (960x540)

NOTE FOR JJ: this is still a PLACEHOLDER — swap in real footage from
/admin/settings -> Asset manager (hero video upload) when ready.
"""
import math
import os

import numpy as np
from PIL import Image

W, H = 960, 540
SCALE = 4                      # render at W/SCALE x H/SCALE, then upscale
RW, RH = W // SCALE, H // SCALE
FPS = 24
SECONDS = 10
N = FPS * SECONDS
FRAMES_DIR = "/tmp/hero-frames"
OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "video")

os.makedirs(FRAMES_DIR, exist_ok=True)
os.makedirs(OUT_DIR, exist_ok=True)

rng = np.random.default_rng(20260916)  # deterministic

# ── Gold dust particles: drift upward, wrapping seamlessly ─────────────
P = 90
px = rng.uniform(0, RW, P)
py = rng.uniform(0, RH, P)
psize = rng.uniform(0.5, 1.4, P)          # low-res px (≈2-6 px on screen, soft)
K = rng.integers(1, 3, P).astype(float)   # screen-heights crossed per loop
palpha = rng.uniform(0.30, 0.85, P)
pfreq = rng.integers(1, 3, P).astype(float)
pphase = rng.uniform(0, 2 * math.pi, P)

# ── Drifting gold glows (integer frequencies → seamless) ────────────────
GLOW = [
    # cx freq, cy freq, phase, base pos (0..1), radius (×RH), strength
    (1, 1, 0.0, (0.30, 0.62), 0.55, 0.50),
    (1, 2, math.pi / 2, (0.72, 0.35), 0.42, 0.34),
    (2, 1, math.pi, (0.55, 0.80), 0.30, 0.20),
]

yy, xx = np.mgrid[0:RH, 0:RW].astype(np.float32)

base = np.empty((RH, RW, 3), np.float32)
base[..., 0] = 10.0   # #0A0A0F
base[..., 1] = 10.0
base[..., 2] = 15.0

# gentle vignette, precomputed (keeps edges cinematic)
dx = (xx - RW / 2) / (RW / 2)
dy = (yy - RH / 2) / (RH / 2)
vignette = 1 - 0.38 * np.clip((dx ** 2 + dy ** 2) - 0.35, 0, 1.2)

for f in range(N):
    t = f / N  # 0..1 over the loop
    img = base.copy()

    # drifting glows
    for (fx, fy, ph, (bx, by), rad, strength) in GLOW:
        cx = (bx + 0.10 * math.sin(2 * math.pi * fx * t + ph)) * RW
        cy = (by + 0.10 * math.cos(2 * math.pi * fy * t + ph)) * RH
        r = rad * RH
        d2 = (xx - cx) ** 2 + (yy - cy) ** 2
        glow = np.exp(-d2 / (2 * (r * 0.55) ** 2)) * strength
        img[..., 0] += glow * 212  # R
        img[..., 1] += glow * 168  # G  (gold #D4A857)
        img[..., 2] += glow * 87   # B

    # gold dust rising (wrap-seamless)
    dust_y = (py - K * RH * t) % RH
    tw = 0.55 + 0.45 * np.sin(2 * math.pi * pfreq * t + pphase)
    alpha = palpha * tw
    for i in range(P):
        x0, y0 = px[i], dust_y[i]
        s = psize[i]
        xi0, xi1 = max(0, int(x0 - s)), min(RW, int(x0 + s) + 1)
        yi0, yi1 = max(0, int(y0 - s)), min(RH, int(y0 + s) + 1)
        if xi1 <= xi0 or yi1 <= yi0:
            continue
        patch = img[yi0:yi1, xi0:xi1]
        gy, gx = np.mgrid[yi0:yi1, xi0:xi1]
        d = np.sqrt((gx - x0) ** 2 + (gy - y0) ** 2) / max(s, 0.1)
        m = (np.clip(1 - d, 0, 1) ** 2 * alpha[i])[..., None]
        patch += m * np.array([235, 195, 120], np.float32)

    img *= vignette[..., None]
    frame = np.clip(img, 0, 255).astype(np.uint8)
    big = Image.fromarray(frame).resize((W, H), Image.BILINEAR)
    big.save(f"{FRAMES_DIR}/{f:04d}.png")

print(f"rendered {N} frames -> {FRAMES_DIR}")
