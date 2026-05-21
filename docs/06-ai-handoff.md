# AI Handoff

Pulse 4.0 has been built and operated with heavy AI assistance — most engineering tasks have been driven through [Claude Code](https://claude.com/claude-code), guided by the [`CLAUDE.md`](../CLAUDE.md) file at the repo root and a memory store the assistant maintains across sessions.

If you're a new maintainer, you have two choices:

1. **Keep using AI.** The repo is set up for it. `CLAUDE.md` tells any Claude Code session how this project runs.
2. **Operate it manually.** Every AI-driven workflow has a human-readable runbook in this doc folder.

This page is the bridge: it lists every workflow the AI was silently handling and points to the human equivalent.

## What the AI was doing on your behalf

| AI was doing… | Human equivalent | Why it matters |
|---|---|---|
| Filing a Linear issue for every task, with type + component labels | [runbooks/create-linear-issue.md](./runbooks/create-linear-issue.md) | Without labels, the project board becomes unfilterable. The team uses labels to slice by feature area. |
| Knowing the Linear team / project / label IDs without lookups | [runbooks/create-linear-issue.md](./runbooks/create-linear-issue.md) — bookmark section | Saves you several Linear API calls per task. |
| Running OTA pushes through `npm run ota:production` (never `eas update` directly) | [runbooks/push-ota.md](./runbooks/push-ota.md) | A raw `eas update` reads your local `.env` and can bake the wrong backend into a production bundle. The wrapper prevents this; if you bypass it you can corrupt prod data. See [Environments](./03-environments.md). |
| Writing the Teams release post in plain user-language (not engineering-speak) | [runbooks/write-release-notes.md](./runbooks/write-release-notes.md) | The Teams audience is end users, not developers. "Sign-up is faster" — not "AuthScreen refactored". |
| Marking the matching Linear issue **Done** after OTA goes live | [runbooks/push-ota.md](./runbooks/push-ota.md), step 4 | Otherwise the board drifts. |
| Reaching for [`BottomSheet`](../src/components/BottomSheet.tsx) instead of rolling a new slide-up animation | Documented in [Architecture](./02-architecture.md#always-use-the-bottomsheet-primitive) | Re-rolled sheets feel different from existing ones. The app loses its consistency. |
| Knowing the check-in ↔ support-request link is **server-side**, not a client field | Documented in [Services: Xano gotchas](./04-services.md#gotchas) | Trying to set `related_support_request_id` from the client wastes hours; the field doesn't exist. |
| Calling [`resetRuntime`](../src/lib/resetRuntime.ts) on every logout (not just clearing AuthContext) | Documented in [Architecture: Clean logout](./02-architecture.md#clean-logout--resetruntime) | Forgetting any one of OneSignal / Intercom / Amplitude / SecureStore / fetch cache cleanup creates "logged out but still got a push from the old account" bugs. |
| Verifying that `EXPO_PUBLIC_XANO_DATA_SOURCE` is `live` for any production OTA | Enforced by [`src/api/client.ts`](../src/api/client.ts) — non-dev builds **crash on launch** if it's wrong | This is a code guardrail, not just convention. Don't disable it. |
| Knowing that `runtimeVersion.policy: appVersion` means a `version` bump breaks OTA continuity | Documented in [Releases: Version policy](./05-releases.md#version-policy) | Bumping `version` without doing a native build means existing users never see the OTA. |
| Choosing OTA vs native build correctly | [Releases: decision flowchart](./05-releases.md#decision-flowchart) | A native dep bump shipped as an OTA will crash the app on launch for everyone. |

## "I want to keep using Claude Code"

Great — that's the simplest path. The repo is already configured for it:

- **[`CLAUDE.md`](../CLAUDE.md)** at the repo root is the assistant's operating manual. It contains the OTA flow, Linear workflow, and Teams notification template. Claude Code reads this file automatically on every session.
- **The memory directory** (`~/.claude/projects/-Users-dylanj-projects-clients-Sharetree-pulse-4-0/memory/`) holds long-lived facts the assistant has learned over time — Linear IDs, design rules, project-specific gotchas. **This is per-machine** — if you're a new developer, your Claude Code will build up its own memory over time. You can seed it by asking Claude to "read CLAUDE.md and confirm the workflow".
- **Slash commands** referenced in `CLAUDE.md` (like `/loop`, `/review`) are standard Claude Code features.
- **`.mcp.json`** at the repo root configures the Linear MCP server so Claude Code can read/write Linear directly.

To get started:

1. Install Claude Code: <https://claude.com/claude-code>
2. Run `claude` in the repo root. It will read `CLAUDE.md`.
3. Make sure you can authenticate to Linear — the MCP server needs an API key. Check `.mcp.json` for how it's configured.

After that, "push an OTA with these changes" or "create a Linear issue for this task" will Just Work.

## "I want to operate it manually"

Also fine. Read these in order:

1. [Quickstart](./01-quickstart.md) — get the app running locally
2. [Environments](./03-environments.md) — understand the data-source rules
3. [Releases](./05-releases.md) — understand OTA vs native
4. **The runbooks**:
   - [Push an OTA](./runbooks/push-ota.md)
   - [Create a Linear issue](./runbooks/create-linear-issue.md)
   - [Write a Teams release-note](./runbooks/write-release-notes.md)
   - [Troubleshoot builds](./runbooks/troubleshoot-builds.md)
   - [Rollback an OTA](./runbooks/rollback-ota.md)

You don't need the AI; everything is documented. The runbooks are the same workflows `CLAUDE.md` describes, translated for a human reader.

## "I want a mix — some AI, some manual"

That's how most people end up working. A pragmatic split:

- **Let AI handle:** Linear issue creation, release-note writing, repetitive boilerplate
- **Do yourself:** the actual OTA push command (you should always *know* you've pushed; don't delegate that), code review, native build initiation

The runbooks are short enough that doing them manually takes < 5 minutes each.

## What this project does NOT have

So you don't go looking for them:

- **No CI** in `.github/workflows`. EAS handles build/submit; there's no automated test or lint on PR.
- **No feature flags / remote config.** All gating is via code + `__DEV__`.
- **No staging app on the App Store.** The `preview` channel ships to TestFlight (iOS internal) and Play internal track.
- **No automated regression test suite.** Two unit tests in `src/__tests__/`. Verification is manual on a dev client.
- **No design tokens generated from Figma.** [`src/theme/index.ts`](../src/theme/index.ts) and [`DESIGN_SYSTEM.md`](../DESIGN_SYSTEM.md) are hand-maintained.

## Memory the AI has accumulated (worth knowing)

These are durable facts the assistant has stored in its memory. They're worth knowing as a human too — copying them here so they survive a Claude Code reinstall.

- **Linear project** is "Emotional Pulse - Mobile Native". Every task gets a Linear issue.
- **Every Linear issue** must have at least one type label (bug / improvement / feature) and one component label (matching the app area).
- **The check-in / support-request link** is server-side. Don't add a `related_support_request_id` to `/checkins/create`.
- **The `BottomSheet` primitive** at [`src/components/BottomSheet.tsx`](../src/components/BottomSheet.tsx) handles every slide-up animation. Never re-roll.
- **OTA must go through `npm run ota:*`**. Never `eas update` directly.
- **Teams release notes are user-language**, not engineering-language. Lead with what the user sees, not what changed in the code.

These rules are also embedded in [`CLAUDE.md`](../CLAUDE.md) so a fresh Claude Code session picks them up automatically.

## Final note

The "AI was running this for you" knowledge is **not magic** — it was all written down by Dylan in `CLAUDE.md` and the memory directory before being followed. The AI is just an executor of those rules. If you make a process change, **update `CLAUDE.md` AND the matching runbook in this folder**. Then both the AI and any future human will pick it up.
