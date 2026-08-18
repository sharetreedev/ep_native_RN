---
name: ota-publish
description: Publish an over-the-air update for the Pulse React Native app safely — pre-flight checks, the ota.sh wrapper, Linear issues, and the end-user Teams announcement. Use when the user says "push OTA", "OTA update", "publish the app update".
---

# OTA publish — the full ritual

The step-by-step lives in `CLAUDE.md` (OTA Update Workflow section) — follow it
exactly. This skill is the enforcement checklist:

1. **Never call `eas update` directly.** Only `npm run ota:production|preview|development`
   — the wrapper (`scripts/ota.sh`) runs the four pre-flight checks (origin/main
   freshness, dirty-tree warning, EAS env verification, arg forwarding).
2. **Before publishing:** `eas update:list` to see what's currently live, and check
   `DEPLOYMENT.md` for local-only work that must NOT ride along (or must be included
   deliberately — e.g. pending fix branches).
3. **After publishing:** update `DEPLOYMENT.md` (update group ID, what shipped),
   create/close the Linear issues, then the Teams announcement per CLAUDE.md's
   writing rules — end-user language, webhook URL from `.env.local`
   (`MAKE_TEAMS_WEBHOOK_URL`), and ALWAYS ask "Dylan or Maurice?" before sending.
