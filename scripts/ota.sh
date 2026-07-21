#!/usr/bin/env bash
# Publish an OTA update via EAS, forcing the correct --environment so that
# EAS-hosted env vars are used instead of the local .env file.
#
# Usage:
#   scripts/ota.sh <environment> [extra eas update args...]
#
# <environment> is one of: production | preview | development
#   production  → channel=production, EXPO_PUBLIC_XANO_DATA_SOURCE=live
#   preview     → channel=preview,    EXPO_PUBLIC_XANO_DATA_SOURCE=staging
#   development → channel=development, EXPO_PUBLIC_XANO_DATA_SOURCE=test
#
# The corresponding values live as EAS environment variables on the project —
# set via `eas env:create --environment <env> ...`. This wrapper never reads
# them from .env, so a misconfigured local machine cannot publish a bad bundle.
#
# Uses `npx eas-cli@latest` rather than a bare `eas` so the script works on
# machines without the EAS CLI installed globally (the most common setup —
# our package.json doesn't pin eas-cli as a dev dependency).

set -euo pipefail

EAS="npx --yes eas-cli@latest"

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <production|preview|development> [extra eas update args...]" >&2
  exit 2
fi

ENV="$1"
shift

case "$ENV" in
  production|preview|development) ;;
  *)
    echo "❌ Invalid environment: $ENV" >&2
    echo "   Must be one of: production, preview, development" >&2
    exit 2
    ;;
esac

# Peel off our own flags before forwarding the rest to eas-cli, which would
# reject anything it doesn't recognise.
ALLOW_DIRTY=false
SKIP_HISTORY_CHECK=false
FORWARD_ARGS=()
for arg in "$@"; do
  case "$arg" in
    --allow-dirty) ALLOW_DIRTY=true ;;
    --skip-history-check) SKIP_HISTORY_CHECK=true ;;
    *) FORWARD_ARGS+=("$arg") ;;
  esac
done

# ─── Git pre-flight ──────────────────────────────────────────────────────────
# Multiple developers ship OTAs to the same EAS channel from their own
# machines. EAS Update is last-write-wins per channel, so a stale local can
# silently roll back a previous release the moment we publish from it.
# These checks make that class of mistake fail loud:
#   1. Block if local HEAD is missing any commits already on origin/main.
#   2. Warn (and require confirmation) if the working tree is dirty —
#      uncommitted modifications and untracked-but-imported files DO end up
#      in the Metro bundle, so dirty publishes are reproducible only with
#      effort. EAS already appends `*` to the commit SHA in this case;
#      this prompt makes sure the publisher is doing it deliberately.
# Both checks can be skipped by editing the script for a true emergency, but
# the dirty check accepts an explicit `--allow-dirty` flag for ergonomic
# hotfix publishes.
if git rev-parse --git-dir > /dev/null 2>&1; then
  echo "🔍 Fetching origin to check git state..."
  if ! git fetch --quiet origin 2>/dev/null; then
    echo "⚠️  git fetch failed — proceeding without ancestry check (no network?)." >&2
  elif git rev-parse --verify --quiet origin/main > /dev/null; then
    if ! git merge-base --is-ancestor origin/main HEAD; then
      BEHIND=$(git rev-list --count HEAD..origin/main)
      echo "❌ Local HEAD is missing $BEHIND commit(s) from origin/main." >&2
      echo "   Publishing now would roll back work that's already on main." >&2
      echo "   Fix with:  git pull --ff-only origin main" >&2
      exit 1
    fi
  else
    echo "⚠️  No origin/main ref found — skipping ancestry check." >&2
  fi

  # ─── Live-release guard (the EP-1125-1128 class) ──────────────────────────
  # The ancestry check above only sees origin/main. It CANNOT see work that was
  # OTA'd to this channel but never merged to main — EAS stores a source commit
  # per update, but `update:list --json` doesn't expose it, so a commit-based
  # ancestry check isn't possible. Heuristic instead: read the EP-#### tokens
  # from the update currently live on this channel and confirm each appears in
  # origin/main's history. If the live release references work that isn't on
  # main, publishing from main would silently roll it back.
  if [[ "$SKIP_HISTORY_CHECK" != "true" ]] && git rev-parse --verify --quiet origin/main > /dev/null; then
    echo "🔍 Cross-checking the live '$ENV' release against origin/main history..."
    # Extract EP-#### tokens from the live update's message, expanding the
    # team's shorthand lists ("EP-1100/1118/1060", "EP-1125-1128") into every
    # individual EP-#### so the check doesn't miss the trailing ones.
    LIVE_EPS="$($EAS update:list --branch "$ENV" --limit 1 --json --non-interactive 2>/dev/null \
      | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{let msg="";try{const j=JSON.parse(s);const it=Array.isArray(j)?j:(j.currentPage||[]);msg=String((it[0]&&it[0].message)||"")}catch(e){}const eps=new Set();const re=/EP-(\d+(?:\s*[\/,\-]\s*\d+)*)/g;let m;while((m=re.exec(msg))){m[1].split(/[\/,\-\s]+/).filter(Boolean).forEach(n=>eps.add("EP-"+n))}process.stdout.write([...eps].join("\n"))})' 2>/dev/null || true)"
    if [[ -n "$LIVE_EPS" ]]; then
      MISSING=""
      for ep in $LIVE_EPS; do
        # Capture in a var rather than piping to `grep -q` — under `set -o
        # pipefail`, grep -q closing the pipe early gives git-log a SIGPIPE (141)
        # and the pipeline reports failure, producing false "missing" hits.
        if [ -z "$(git log origin/main --grep="$ep" --format=%H -1 2>/dev/null)" ]; then
          MISSING="$MISSING $ep"
        fi
      done
      if [[ -n "$MISSING" ]]; then
        echo "⚠️  The live '$ENV' release references work NOT found on origin/main:$MISSING" >&2
        echo "   That work was likely OTA'd without merging to main. Publishing from main" >&2
        echo "   now would roll it back (the EP-1125-1128 class of incident)." >&2
        echo "   Get it onto main first, or pass --skip-history-check to override." >&2
        if [[ -t 0 ]]; then
          read -r -p "   Publish anyway? [y/N] " reply
          [[ "$reply" =~ ^[Yy]$ ]] || { echo "Aborted." >&2; exit 1; }
        else
          echo "❌ Non-interactive shell — aborting. Re-run with --skip-history-check to override." >&2
          exit 1
        fi
      fi
    fi
  fi

  DIRTY="$(git status --porcelain)"
  if [[ -n "$DIRTY" ]] && [[ "$ALLOW_DIRTY" != "true" ]]; then
    echo "⚠️  Working tree has uncommitted changes:" >&2
    git -c color.ui=always status --short >&2
    echo "" >&2
    echo "   Publishing now will bundle these uncommitted changes." >&2
    echo "   EAS will mark the commit with a trailing * to flag it as dirty." >&2
    echo "   Pass --allow-dirty to skip this prompt, or commit/stash first." >&2
    if [[ -t 0 ]]; then
      read -r -p "   Proceed anyway? [y/N] " reply
      if [[ ! "$reply" =~ ^[Yy]$ ]]; then
        echo "Aborted." >&2
        exit 1
      fi
    else
      echo "❌ Non-interactive shell — aborting. Re-run with --allow-dirty." >&2
      exit 1
    fi
  fi
else
  echo "⚠️  Not a git repository — skipping git pre-flight." >&2
fi

# Verify the env var is set on the EAS project for this environment BEFORE
# publishing — fail loud if the project is misconfigured.
echo "🔍 Verifying EAS environment variables for '$ENV'..."
if ! $EAS env:list --environment "$ENV" 2>/dev/null | grep -q "EXPO_PUBLIC_XANO_DATA_SOURCE"; then
  echo "❌ EXPO_PUBLIC_XANO_DATA_SOURCE is not set on the EAS '$ENV' environment." >&2
  echo "   Fix with:" >&2
  echo "     eas env:create --environment $ENV --name EXPO_PUBLIC_XANO_DATA_SOURCE --value <live|staging|test>" >&2
  exit 1
fi

# Unset any locally-exported value so nothing can leak into the bundle. EAS
# reads from its server-side env when --environment is passed.
unset EXPO_PUBLIC_XANO_DATA_SOURCE

echo "🚀 Publishing OTA to channel '$ENV' with EAS --environment $ENV..."
# Bash 3.2 (still default on macOS) errors on `"${arr[@]}"` for empty arrays
# under `set -u`; split the branches so an arg-less invocation still works.
if [[ ${#FORWARD_ARGS[@]} -gt 0 ]]; then
  exec $EAS update --channel "$ENV" --environment "$ENV" --non-interactive "${FORWARD_ARGS[@]}"
else
  exec $EAS update --channel "$ENV" --environment "$ENV" --non-interactive
fi
