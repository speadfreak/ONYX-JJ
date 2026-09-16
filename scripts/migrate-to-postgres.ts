/**
 * ═══════════════════════════════════════════════════════════════════════
 * JJ ONYX — one-off content migration: local SQLite → production Postgres
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Reads every content row from the local dev SQLite database and upserts
 * it into the production Postgres database through Prisma Client (same
 * schema validation on both sides — no raw SQL, no FK drift; all IDs are
 * copied verbatim so any future relation stays consistent).
 *
 * Usage:
 *   PROD_DATABASE_URL="postgresql://…" bun scripts/migrate-to-postgres.ts
 *   DRY_RUN=1 PROD_DATABASE_URL="postgresql://…" bun scripts/migrate-to-postgres.ts
 *
 *   • PROD_DATABASE_URL is REQUIRED and is read from the environment ONLY —
 *     never hardcoded, never written to a file, never committed.
 *   • DRY_RUN=1 connects to both DBs, prints before/after counts and the
 *     exact plan, but writes nothing.
 *   • Safe to re-run: every row is written via upsert (idempotent).
 *
 * If prisma/schema.prisma has changed since the clients were generated,
 * regenerate the dual clients first:
 *   npx prisma generate --schema scripts/prisma-dual/sqlite.prisma
 *   npx prisma generate --schema scripts/prisma-dual/postgres.prisma
 *
 * What is deliberately NOT migrated:
 *   • Asset (upload manifest)     — the files live on local disk, not in prod
 *   • ActivityLog / EventLog /
 *     AiChat / LoginAttempt       — sandbox operational data, not content
 *   • AdminUser credentials       — prod keeps its own env-bootstrapped owner;
 *                                    only the owner's display `name` is synced
 *   • Test-junk rows              — see SKIP_MESSAGE_IDS below
 */

import { PrismaClient as SqliteClient } from "../generated/sqlite-client";
import { PrismaClient as PgClient } from "../generated/pg-client";
import { createHash } from "crypto";
import path from "path";

// ── Config ─────────────────────────────────────────────────────────────

const PROD_URL = process.env.PROD_DATABASE_URL;
if (!PROD_URL) {
  console.error(
    "✗ Refusing to run: PROD_DATABASE_URL env var is required (the Postgres\n" +
      "  connection string). It is only read from the environment for this\n" +
      "  single invocation — never hardcoded or committed."
  );
  process.exit(1);
}
const DRY_RUN = process.env.DRY_RUN === "1";

const LOCAL_URL =
  process.env.LOCAL_DATABASE_URL ?? `file:${path.resolve(process.cwd(), "db/custom.db")}`;

// Phase-5 curl-test junk, identified during inventory (message was literally
// "jjjjjjjjjjjjjjjj" from the sandbox owner's old personal address).
const SKIP_MESSAGE_IDS = new Set(["cmu3e9p9v0002ugrgk6b06n4d"]);

const local = new SqliteClient({ datasourceUrl: LOCAL_URL });
const pg = new PgClient({ datasourceUrl: PROD_URL });

// ── Helpers ────────────────────────────────────────────────────────────

/** Safety net: /uploads/ files are NOT migrated — any dangling reference is
 *  neutralized (and reported) instead of shipping a broken image URL. */
function sanitize<T extends object>(row: T, nullableFields: (keyof T)[]): T {
  const out = { ...row };
  for (const f of nullableFields) {
    const v = out[f];
    if (typeof v === "string" && v.startsWith("/uploads/")) {
      console.warn(`  ⚠ sanitized ${String(f)}="${v}" → null (file not migrated)`);
      (out as Record<string, unknown>)[f as string] = null;
    }
  }
  return out;
}

function hashOf(v: string | null | undefined): string {
  return createHash("sha256").update(v ?? "").digest("hex").slice(0, 12);
}

async function counts(client: SqliteClient | PgClient, labels: string[]) {
  const out: Record<string, number> = {};
  for (const l of labels) out[l] = await (client as never as Record<string, { count(): Promise<number> }>)[l].count();
  return out;
}

// ── Migration ──────────────────────────────────────────────────────────

async function main() {
  console.log(`▶ JJ ONYX content migration${DRY_RUN ? " — DRY RUN (no writes)" : ""}`);
  console.log(`  local : sqlite (db/custom.db)`);
  console.log(`  prod  : postgres (${new URL(PROD_URL.replace("postgresql://", "postgres://")).host})\n`);

  // ---- BEFORE counts ----
  const LABELS = ["Project", "HomeContent", "BlogPost", "Testimonial", "Message", "SiteSetting", "Asset", "ActivityLog", "LoginAttempt", "EventLog", "AiChat", "AdminUser"];
  const before = {
    local: await counts(local, LABELS),
    prod: await counts(pg, LABELS),
  };

  // ---- Read everything from SQLite ----
  const [projects, home, posts, testimonials, messages, settings, admin] = await Promise.all([
    local.project.findMany({ orderBy: { order: "asc" } }),
    local.homeContent.findMany(),
    local.blogPost.findMany(),
    local.testimonial.findMany({ orderBy: { order: "asc" } }),
    local.message.findMany(),
    local.siteSetting.findMany(),
    local.adminUser.findFirst({ where: { role: "owner" } }),
  ]);

  const keptMessages = messages.filter((m) => !SKIP_MESSAGE_IDS.has(m.id));
  const skippedMsgs = messages.filter((m) => SKIP_MESSAGE_IDS.has(m.id));

  console.log("PLAN (rows to upsert):");
  console.log(`  Project      ${projects.length}`);
  console.log(`  HomeContent  ${home.length}`);
  console.log(`  BlogPost     ${posts.length}`);
  console.log(`  Testimonial  ${testimonials.length}`);
  console.log(`  Message      ${keptMessages.length} (skipping ${skippedMsgs.length} test-junk row(s): ${skippedMsgs.map((m) => m.id).join(", ") || "none"})`);
  console.log(`  SiteSetting  ${settings.length}`);
  console.log(`  AdminUser    name-only sync → prod owner (never credentials)\n`);

  if (DRY_RUN) {
    console.log("BEFORE counts — local vs prod:");
    for (const l of LABELS) console.log(`  ${l.padEnd(13)} ${String(before.local[l]).padStart(4)}  vs  ${String(before.prod[l]).padStart(4)}`);
    console.log("\n✓ Dry run complete — nothing was written.");
    return;
  }

  // ---- Write (dependency-safe order: no cross-model FKs exist; singletons
  //      first, then content, then the admin name-only touch) ----
  for (const row of home) {
    await pg.homeContent.upsert({ where: { id: row.id }, create: row, update: row });
  }
  console.log(`✓ HomeContent  ${home.length}`);

  for (const row of settings) {
    const clean = sanitize(row, ["profileImage", "ambientAudio", "heroVideo", "heroPoster"]);
    await pg.siteSetting.upsert({ where: { id: row.id }, create: clean, update: clean });
  }
  console.log(`✓ SiteSetting  ${settings.length}`);

  for (const row of projects) {
    const clean = sanitize(row, ["image"]);
    await pg.project.upsert({ where: { id: row.id }, create: clean, update: clean });
  }
  console.log(`✓ Project      ${projects.length}`);

  for (const row of posts) {
    const clean = sanitize(row, ["coverImage"]);
    await pg.blogPost.upsert({ where: { id: row.id }, create: clean, update: clean });
  }
  console.log(`✓ BlogPost     ${posts.length}`);

  for (const row of testimonials) {
    const clean = sanitize(row, ["photo"]);
    await pg.testimonial.upsert({ where: { id: row.id }, create: clean, update: clean });
  }
  console.log(`✓ Testimonial  ${testimonials.length}`);

  for (const row of keptMessages) {
    await pg.message.upsert({ where: { id: row.id }, create: row, update: row });
  }
  console.log(`✓ Message      ${keptMessages.length}`);

  // ---- AdminUser: credential-safe, name-only ----
  const prodOwner = await pg.adminUser.findFirst({ where: { role: "owner" } });
  if (!prodOwner) {
    console.warn("⚠ prod has NO owner account — skipping AdminUser entirely (bootstrap via ADMIN_EMAIL/ADMIN_PASSWORD first).");
  } else if (admin) {
    const prodHashBefore = hashOf(prodOwner.passwordHash);
    await pg.adminUser.update({ where: { id: prodOwner.id }, data: { name: admin.name } }); // name ONLY — email/passwordHash/sessionEpoch/invite fields untouched
    const prodOwnerAfter = await pg.adminUser.findUniqueOrThrow({ where: { id: prodOwner.id } });
    const hashUnchanged = hashOf(prodOwnerAfter.passwordHash) === prodHashBefore;
    console.log(`✓ AdminUser    prod owner "${prodOwner.email}" name → "${admin.name}" | passwordHash untouched: ${hashUnchanged ? "YES" : "NO!!"} | sessionEpoch untouched: ${prodOwnerAfter.sessionEpoch === prodOwner.sessionEpoch ? "YES" : "NO!!"}`);
  }

  // ---- AFTER counts + verification ----
  const after = { local: await counts(local, LABELS), prod: await counts(pg, LABELS) };
  console.log("\nAFTER counts — local vs prod:");
  let allOk = true;
  for (const l of LABELS) {
    const notMigrated = l === "Asset" || l === "ActivityLog" || l === "EventLog" || l === "AiChat" || l === "LoginAttempt";
    // Migrated tables: prod must equal local (minus skips). Non-migrated
    // operational tables (ActivityLog, EventLog…): prod keeps accumulating
    // its OWN live rows — the script must simply not have touched them,
    // i.e. prod-after must equal prod-BEFORE.
    const expected = notMigrated ? before.prod[l] : l === "Message" ? before.local[l] - skippedMsgs.length : before.local[l];
    const ok = l === "AdminUser" ? true : after.prod[l] === expected;
    if (!ok) allOk = false;
    const note = notMigrated ? "(not migrated — prod live data untouched)" : l === "AdminUser" ? "(prod keeps its own account — by design)" : "";
    console.log(`  ${l.padEnd(13)} local ${String(after.local[l]).padStart(4)}  prod ${String(after.prod[l]).padStart(4)}  ${ok ? "✓" : "✗ MISMATCH"} ${note}`);
  }
  console.log(allOk ? "\n✅ Migration verified — row counts match." : "\n❌ Count mismatch — investigate before proceeding.");
}

main()
  .catch((e) => {
    console.error("✗ Migration failed:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await local.$disconnect();
    await pg.$disconnect();
  });
