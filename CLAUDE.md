# Pulse 4.0 - React Native Mobile App

## ⚠️ Backend gotcha: profile / image saves can blank the user row

Saving a profile picture or avatar/image hits a Xano endpoint whose `db.edit` with `enforce_hidden_fields = false` + a full-table `dblink` can wipe the **entire Users row** (details cleared → user bounced to onboarding / effectively logged out). This is a **Xano-side** bug — an app OTA cannot fix it, and a *working* upload actually *triggers* it. If users report lost accounts after editing their profile or photo, this is the cause. Full write-up + audit: `emotional-pulse/docs/xano-db-edit-enforce-hidden-fields.md`.

## Linear workflow (issue-first)

**The Linear issue comes first; comments keep it current.** Work in this repo starts
from an existing ticket (created at refinement — see the Development Workflow SOP),
not the other way around:

1. **At session start:** identify the ticket (ask if none was named). Move it to
   **In Progress** when work actually begins.
2. **During work:** if the spec turns out wrong, update the issue (comment + edited
   description), don't silently diverge.
3. **On completion:** post a comment — what was built, where it's deployed (OTA
   channel / store build), how it was verified — then move the state (**To Test**
   for human verification, **Done** only for verified-live work).
4. Only create a NEW issue for genuinely unplanned work discovered mid-session, and
   say so in the session.
- Use the Linear MCP tools if connected. Fallback: the Linear GraphQL API
  (`https://api.linear.app/graphql`) with `LINEAR_API_KEY` from `.env.local` — ask
  Maurice if unset. All IDs (team, project, labels, states) are cached in the memory
  file `project_linear_workflow.md`.

## OTA Update Workflow

When the user asks to "push OTA", "OTA update", or similar — use the **`/ota-publish`
skill** (this repo, `.claude/skills/ota-publish/`). The core rules:

1. **Publish only via the wrapper:**
   ```bash
   npm run ota:production -- --message "<brief summary of changes>"
   ```
   - **NEVER call `eas update` directly.** It reads `EXPO_PUBLIC_*` env vars from the local `.env` at publish time, which will silently bake the wrong `x-data-source` header into the production bundle. The `npm run ota:*` scripts wrap `eas update` with `--environment` so the EAS-hosted env vars are used instead.
   - Channels: `ota:production` | `ota:preview` | `ota:development`
   - The wrapper (`scripts/ota.sh`) runs four pre-flight checks: origin/main freshness (hard-fail if local HEAD is behind — recovery `git pull --ff-only origin main`), dirty-tree warning (`--allow-dirty` to skip), EAS-env verification of `EXPO_PUBLIC_XANO_DATA_SOURCE`, and arg forwarding.
   - `src/api/client.ts` hard-throws at module-load if a non-`__DEV__` build ships with anything other than `live` — a misconfigured OTA crashes on launch rather than silently hitting the wrong backend.
   - Preferred flow with multiple devs: commit locally (with `EP-XXXX` in the message), `git pull --ff-only origin main` if behind, then publish.
2. **Update the Linear issues** covered by the release (comments + states, per the
   workflow above — the issues already exist; don't create them retroactively).
   Update `DEPLOYMENT.md` (update-group ID, what shipped).
3. **Announce to the team** via the **`/teams-announce` skill** (workspace-level) —
   it owns the webhook credentials, the end-user writing rules, and the templates.
   Always ask whether the message is from Dylan or Maurice before sending.

## App Store / Play Store deployment

Full-build store submissions (not OTA) are documented in
`docs/runbooks/deploy-app-stores.md`. Read it before any `eas build` / `eas submit` —
it captures the ASC API-key submit config (EP-1194 era) and the gotchas we hit.

## Project Details

- This is a React Native (Expo) mobile app
- Backend API: Xano (https://xdny-scc5-yag9.a2.xano.io/api:LmTnxskw)
- Deployment state ledger: `DEPLOYMENT.md` (check before publishing; update after)
- Docs index: `docs/README.md` (onboarding path 01–07 + runbooks)
