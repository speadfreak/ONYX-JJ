import { execFile } from "node:child_process";
import { stat } from "node:fs/promises";
import path from "node:path";

import { bad, ok, touched } from "@/lib/admin-api";
import { requireAdmin } from "@/lib/auth";

/**
 * POST /api/admin/regenerate-portfolio — rerun scripts/gen-portfolio.py
 * (reportlab deck generated from the live DB) and report the fresh PDF size.
 * Middleware gates /api/admin/*; requireAdmin() is defense-in-depth.
 */
const PDF_PATH = path.join(process.cwd(), "public", "portfolio", "joseph-james-portfolio.pdf");

export async function POST() {
  const session = await requireAdmin();
  if (!session) return bad("Unauthorized", 401);

  try {
    await new Promise<void>((resolve, reject) => {
      execFile(
        "python3",
        ["scripts/gen-portfolio.py"],
        { cwd: process.cwd(), timeout: 60_000, windowsHide: true },
        (err, stdout, stderr) => {
          if (err) {
            const excerpt = String(stderr || stdout || err.message).slice(-400);
            reject(new Error(excerpt || "generator exited non-zero"));
          } else {
            resolve();
          }
        }
      );
    });

    const info = await stat(PDF_PATH);
    if (!info.isFile() || info.size < 1024) {
      return bad("Portfolio PDF missing or empty after regeneration", 500);
    }

    await touched("Regenerated portfolio deck", `${info.size} bytes`);
    return ok({ regenerated: true, bytes: info.size });
  } catch (e) {
    return bad(`Portfolio regeneration failed: ${(e as Error).message}`, 500);
  }
}
