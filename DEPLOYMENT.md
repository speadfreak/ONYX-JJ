# JJ ONYX — Render Deployment Checklist

Read the two warnings first — they are the only decisions that shape
everything else. Everything after is a step-by-step you can follow top to
bottom on Render's dashboard.

---

## ⚠️ READ FIRST — the ephemeral filesystem decision

**Render's filesystem is ephemeral on standard plans**: every redeploy or
restart starts from a fresh container built from your repo. Anything written
to disk at runtime **disappears**. JJ ONYX currently writes TWO kinds of data
to disk:

1. **The SQLite database** — `db/custom.db` (all content, admins, analytics)
2. **Uploaded assets** — `/public/uploads/*` (profile pic, hero video, audio)

If deployed as-is, **you lose all content, admin accounts, and uploads on
every deploy/restart.** Pick one option per data type:

### Decision A — Database

| | (a) Managed PostgreSQL ✅ recommended | (b) SQLite + Render persistent disk |
|---|---|---|
| Durability | Survives redeploys/restarts; automatic daily backups on paid plans | Survives only while the disk exists (deleting the service deletes it) |
| Schema change | One line in `prisma/schema.prisma` (`provider = "postgresql"`) | None |
| Cost | Free Postgres tier exists (expires after 30 days on free plan; paid ~$7/mo) | Disk ~$0.25/GB/mo (min 1GB) |
| Long-term | Correct choice — scales, backs up, no caveats | Fine short-term; you'll migrate eventually |
| Migrations | `prisma migrate deploy` (baseline first, see step 6) | `prisma db push` in build command |

### Decision B — Uploaded assets

| | (a) Object storage (Cloudflare R2) ✅ recommended | (b) Render persistent disk |
|---|---|---|
| Durability | Independent of the host — survives everything | Tied to the service |
| Code change | The upload route writes to R2 via S3 API instead of `fs.writeFile` (small, contained change in `src/app/api/admin/upload/route.ts`) | Symlink `public/uploads` to a disk mount; otherwise none |
| Cost | R2 free tier: 10GB + zero egress fees | ~$0.25/GB/mo |
| CDN | Files serve from R2's edge (faster, offloads the app) | Serves through the app |

**Both decisions can be deferred**: the SQLite+`db push` path works for a
first deploy as long as you understand data resets on redeploy. But decide
before you start adding real content.

---

## Step-by-step (Render dashboard)

### 1. Push the repo to GitHub

From your machine (token is used per-invocation, never stored):

```bash
cd jj-onyx
GITHUB_REPO="your-username/jj-onyx" GITHUB_TOKEN="ghp_..." bash scripts/github-push.sh
```

Or manually: create the repo on GitHub, then
`git remote add origin https://github.com/your-username/jj-onyx.git`
(authenticate with your usual git credential flow — the remote URL must not
contain the token).

> Repo history note: this repo was **re-initialized into a single clean
> commit** during Phase 5 because an earlier sandbox auto-commit had tracked
> `.env`. The pushed history contains **no secrets**. If you ever see `.env`
> in a commit on GitHub, treat every value in it as compromised and rotate
> (see step 4).

### 2. (Decision A-a only) Provision Postgres

1. Render dashboard → **New +** → **PostgreSQL**
2. Name: `jj-onyx-db`, region closest to your audience (e.g. Frankfurt)
3. Create → open the database → copy the **Internal Database URL**
   (internal = no egress charges between your services)

### 3. Create the Web Service

1. **New +** → **Web Service** → **Build and deploy from a Git repository**
2. Connect GitHub → pick the `jj-onyx` repo
3. Runtime: **Node** (bun-specific start scripts are overridden below)
4. Instance type: Free tier works for a portfolio; Starter for always-on

### 4. Environment variables

Add these in **Environment** (names match `.env.example`):

| Key | Value | Notes |
|---|---|---|
| `DATABASE_URL` | (A-a) the Internal Database URL from step 2 · (A-b) `file:/var/data/onyx.db` | |
| `ADMIN_SESSION_SECRET` | `openssl rand -base64 48` output | **Generate a NEW one — never reuse the sandbox value.** Min 32 chars. |
| `ADMIN_EMAIL` | your real email | Owner bootstrap (first boot only) |
| `ADMIN_PASSWORD` | a **NEW** long password | **Do NOT reuse any sandbox/dev password** — generate something new and long. |

Optional: `GROQ_API_KEY` (only if you later swap Ask JJ to Groq),
`METALS_API_KEY` (only for a real XAU/USD feed). Do **not** set
`INSECURE_COOKIES` in production — cookies must be `secure` over HTTPS.

### 5. Build & start commands

Paste into the respective fields (equivalents of `package.json` scripts,
Node-native so Render needs no bun install):

**Decision A-a (Postgres):**
```text
Build:  npm install && npx prisma db push && npm run build
Start:  node .next/standalone/server.js
```
> After switching `provider` to `"postgresql"`, `db push` is acceptable to
> start, but switch to baselined migrations: run `npx prisma migrate dev
> --name init` once locally against the prod URL, commit `prisma/migrations/`,
> then use `npx prisma migrate deploy` in the build instead — it's the
> safe, ordered way to evolve the schema later.

**Decision A-b (SQLite):**
1. In `prisma/schema.prisma` the provider stays `"sqlite"`, but `DATABASE_URL`
   must be an **absolute path on the disk**: `file:/var/data/onyx.db`
2. Web Service → **Disks** → **Add disk** → mount path `/var/data`, ≥1GB
3. Same build/start commands as above.

### 6. (Decision A-a) Move content from sandbox to Postgres

The sandbox SQLite DB has your seeded content + admin accounts. Two options:

- **Fresh start (cleanest):** deploy empty, log in with `ADMIN_EMAIL`/`ADMIN_PASSWORD`
  (owner auto-bootstraps), then re-create content in /admin — it's all
  admin-editable anyway.
- **Migrate the data:** locally, from the project root:
  ```bash
  # one-time: point prisma at prod and baseline the schema
  DATABASE_URL="<internal-db-url>" npx prisma db push
  # copy the SQLite content
  npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > /tmp/seed.sql   # reference only
  ```
  Or simply keep using SQLite locally and let the admin UI re-create content.
  (A full data copy script is a follow-up if you want it.)

### 7. Health check & deploy

- **Health Check Path**: `/api` (returns 200 JSON — simple and auth-free)
- Click **Create Web Service** → first build runs (~2–4 min)
- Render detects the `PORT` env var automatically — `server.js` honors it.

### 8. First-boot verification (do these in order)

1. Open the service URL → site renders (hero, projects, journal)
2. `/admin/login` → log in with `ADMIN_EMAIL` / `ADMIN_PASSWORD`
3. **Immediately** → `/admin/account` → change the owner password (and email if you want)
4. `/admin/settings` → upload a profile picture → save → confirm it shows on `/`
5. `/admin/team` → invite your first co-admin via invite link if needed
6. Check **Logs** tab: zero `prisma error` / `ADMIN_SESSION_SECRET is missing` lines

### 9. Ongoing

- Every git push to `main` auto-deploys (Render default)
- Postgres backups: database page → **Backups** (paid plans)
- If you chose A-b + uploads on disk: remember redeploys keep the disk but
  **deleting the service deletes the disk** — export backups periodically.

---

## Pre-push security checklist (completed during Phase 5)

- [x] `.gitignore` ignores `.env*`, `/db/*.db`, `dev.log*`, `/public/uploads/*`, `/tool-results/`, `/.zscripts/`
- [x] `.env` **untracked** (it had been committed by sandbox auto-commits — repo was re-initialized to a single clean commit so no secret-bearing history reaches GitHub)
- [x] No hardcoded credentials in source: owner bootstrap reads `ADMIN_EMAIL`/`ADMIN_PASSWORD` env only, and **fails closed** (login stays disabled) when unset
- [x] `.env.example` documents every variable with placeholders
- [x] `scripts/github-push.sh` authenticates via a per-invocation header — no token in URLs or config
- [ ] **Your action:** generate fresh `ADMIN_SESSION_SECRET` + `ADMIN_PASSWORD` for production (step 4)
