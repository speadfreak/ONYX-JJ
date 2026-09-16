#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════
# JJ ONYX — GitHub push helper (env-var auth; token is NEVER stored).
#
# Usage:
#   GITHUB_REPO="your-username/jj-onyx" \
#   GITHUB_TOKEN="github_pat_..." \
#   bash scripts/github-push.sh
#
# GITHUB_TOKEN: a fine-grained personal access token with
#   "Contents: Read and write" on the target repo (classic PAT works too).
# The remote URL contains NO token — auth is attached per-invocation via an
# ephemeral http header, so nothing secret lands in .git/config or on disk.
# ═══════════════════════════════════════════════════════════════════════
set -euo pipefail

: "${GITHUB_REPO:?Set GITHUB_REPO, e.g. your-username/jj-onyx}"
: "${GITHUB_TOKEN:?Set GITHUB_TOKEN (fine-grained PAT with Contents:write)}"

git remote remove origin 2>/dev/null || true
git remote add origin "https://github.com/${GITHUB_REPO}.git"

echo "→ Pushing main to https://github.com/${GITHUB_REPO}.git (token not persisted)…"
git -c http.extraheader="AUTHORIZATION: bearer ${GITHUB_TOKEN}" push -u origin main

echo "✓ Pushed. Verify: https://github.com/${GITHUB_REPO}"
echo "  (The token was used for this invocation only — check .git/config to confirm.)"
