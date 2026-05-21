# Prompting Claude Code on this codebase

This doc is for when you're using [Claude Code](https://claude.com/claude-code) to work on Pulse 4.0. It is **not** a generic prompting guide — those exist already. It's the project-specific shorthand and anti-patterns that will make your sessions land first try.

If you're new, read [AI Handoff](./06-ai-handoff.md) first — it explains *what* the AI was already handling. This doc explains *how* to ask it to keep handling those things.

## The shortcuts

Phrases that trigger canonical, pre-defined flows because [`CLAUDE.md`](../CLAUDE.md) and the memory directory describe them. **Just say the phrase**; you don't need to spell out the steps.

| Say this | Claude will… |
|---|---|
| "push OTA" / "push an OTA update" | Run `npm run ota:production` with a sensible message, then create + close matching Linear issues, then post the Teams release-note in user-language. See [push-ota runbook](./runbooks/push-ota.md). |
| "create a Linear issue for &lt;X&gt;" | File it in project "Emotional Pulse - Mobile Native", apply the right type + component labels, assign to Dylan. See [create-linear-issue runbook](./runbooks/create-linear-issue.md). |
| "mark &lt;EP-NNN&gt; as Done" | GraphQL mutation against Linear to set state. |
| "post the release note to Teams" | Write user-language HTML per [write-release-notes runbook](./runbooks/write-release-notes.md) and POST to the Make webhook. |
| "rollback the OTA" | `eas update:republish` with the previous known-good group, then post the incident-style Teams note. See [rollback-ota runbook](./runbooks/rollback-ota.md). |
| "what's the data source for this build?" | Read `EXPO_PUBLIC_XANO_DATA_SOURCE` from the right source (EAS env for builds, `.env` for local) and explain the two routing axes if it's unclear. |

These work because `CLAUDE.md` is auto-loaded at the start of every Claude Code session. Don't reinvent the prompt — just use the phrase.

## Anchor your prompts in this codebase

Vague prompts produce generic React Native code that doesn't match Pulse's patterns. Specific prompts produce code that fits.

### Name the file you want changed

Bad: *"Add an analytics event when someone signs up."*
Good: *"In [`src/contexts/AuthContext.tsx`](../src/contexts/AuthContext.tsx) `signup()`, fire the Amplitude event on success. Add the wrapper to [`src/lib/analyticsEvents.ts`](../src/lib/analyticsEvents.ts) following the existing naming (e.g. `trackSignUpCompleted`). Include `signup_method` matching the enum we use in recent commits."*

### Name the pattern you want reused

These are the patterns Claude already knows about — name them and it'll go straight to the right primitive instead of inventing a new one:

- **"Use the `BottomSheet` primitive"** ([`src/components/BottomSheet.tsx`](../src/components/BottomSheet.tsx)) for any slide-up sheet
- **"Use the `Button` component with variant=…"** ([`src/components/Button.tsx`](../src/components/Button.tsx))
- **"Go through `fetchCache.getOrFetch`"** ([`src/lib/fetchCache.ts`](../src/lib/fetchCache.ts)) for any HTTP read
- **"Add it to `resetRuntime`"** ([`src/lib/resetRuntime.ts`](../src/lib/resetRuntime.ts)) when adding cleanup on logout
- **"Use the `request()` helper in `src/api/client.ts`"** — never write raw `fetch` against Xano
- **"Use design tokens from [`src/theme/index.ts`](../src/theme/index.ts)"** — never hard-code colours, fonts, or spacing
- **"Use the `logger` from `src/lib/logger.ts`"** — never use raw `console.log`

### Name the routing axis when it's relevant

Two independent routing axes (see [Environments](./03-environments.md)). Be explicit about which one:

- *"For the staging API branch"* (= dev only, in-progress endpoints)
- *"For the live data source"* (= production data)
- *"For the preview channel"* (= EAS preview build, staging data, main API branch)

Bad: *"Make it use staging."*
Good: *"This change relies on an endpoint that's only on the `:staging` API branch right now — don't ship it on the production channel until backend merges it to main."*

### Reference Linear IDs when relevant

If a task has an EP number, paste it. Claude will fetch the issue (via the Linear MCP server in [`.mcp.json`](../.mcp.json)) and use the description as ground truth rather than re-inferring scope.

## Don't fight the guardrails

These are codified rules. Asking Claude to bypass them should (and usually does) trigger pushback — but it's worth knowing the list so you don't waste prompts:

| Don't ask for… | Why |
|---|---|
| "Remove the throw in `src/api/client.ts`" / "make it default to live" | The hard-crash on non-`live` data source in non-dev builds is a safety net. Bypassing it is how we ship the wrong backend to users. See [Environments: hard rules](./03-environments.md#the-hard-rules). |
| "Just use `eas update` directly" | Skips [`scripts/ota.sh`](../scripts/ota.sh), which means your local `.env` value can bake into the bundle. Always use `npm run ota:*`. |
| "Set `related_support_request_id` on `/checkins/create`" | The Xano endpoint has no such field. The check-in ↔ support-request link is derived server-side. |
| "Roll a custom slide-up animation for this sheet" | Use [`BottomSheet`](../src/components/BottomSheet.tsx). New animations are visually inconsistent with existing sheets. |
| "Skip `resetRuntime` and just clear `AuthContext`" | Causes "logged out but still got a push" / "Intercom thinks I'm the old user" bugs. Always full cleanup. |
| "Hard-code this colour for now" | The whole codebase pulls from [`src/theme/index.ts`](../src/theme/index.ts). One hex leaks the design system. |
| "Use raw `fetch()` against Xano" | Skips auth headers, the data-source header, retries, and the auth-expired handler. Always go through [`request()`](../src/api/client.ts). |

If Claude pushes back on one of these, **trust the pushback**. It's reading from `CLAUDE.md` and memory; the rule is there for a reason.

## Side-by-side examples

### Add an analytics event

> **Bad:** *"Add analytics to login."*
>
> Produces: a `console.log`, or a raw `amplitude.track` call inline in some random component, or nothing because Claude isn't sure where analytics live.

> **Good:** *"In [`src/contexts/AuthContext.tsx`](../src/contexts/AuthContext.tsx) `login()`, after we set the user, fire an Amplitude event for login success. Add a typed wrapper to [`src/lib/analyticsEvents.ts`](../src/lib/analyticsEvents.ts) following the naming of the existing `trackSignUpCompleted` / `trackLoginCompleted` functions. Make sure it routes through the lazy-load guard so Expo Go doesn't crash."*
>
> Produces: a typed wrapper in the right file, called from the right place, with the right guards.

### Add a new bottom sheet

> **Bad:** *"Make a slide-up sheet that lets the user pick a date."*

> **Good:** *"Build a date-picker sheet that uses [`src/components/BottomSheet.tsx`](../src/components/BottomSheet.tsx) as its container. Mount it from [`src/screens/CheckInScreen/CheckInScreen.tsx`](../src/screens/CheckInScreen/CheckInScreen.tsx) when the user taps the date row. Style with theme tokens; no hard-coded colours."*

### Fix a bug

> **Bad:** *"Pairs list crashes sometimes, fix it."*

> **Good:** *"On [`src/screens/MyPairsScreen/MyPairsScreen.tsx`](../src/screens/MyPairsScreen/MyPairsScreen.tsx), the list crashes when a pair has no `phone_number`. The Sentry breadcrumb points at the `PairsRefinement` component. Reproduce with a pair created via invite that hasn't been completed yet. File a Linear bug under the Pairs component label first, then fix."*
>
> The "file a Linear bug first" is non-obvious — without it, the bug fix lands but the project board is missing the ticket.

### Ship an OTA

> **Bad:** *"Run the OTA."*

> **Good:** *"Push OTA to production with the recent emotion-detail polish + pair-invite share-sheet fix. Linear issues exist for both — mark them Done after publish. Teams message should be a features release, not incident."*
>
> The "features release, not incident" hint matters because the emoji + tone changes (`✨` vs `📲`).

### Refactor / restructure

> **Bad:** *"Clean up MyPulseScreen, it's getting messy."*

> **Good:** *"[`src/screens/MyPulseScreen/MyPulseScreenV2.tsx`](../src/screens/MyPulseScreen/MyPulseScreenV2.tsx) is currently 800+ lines with v1/v2 conditional rendering. Extract the v2-only carousel logic into its own hook in `src/screens/MyPulseScreen/v2/`. Don't change behaviour, just file structure. Create a Linear issue under Tech Debt + UX, Responsiveness & Performance components."*
>
> The "don't change behaviour" line stops the agent from rewriting things you didn't ask about.

## Keep CLAUDE.md and memory healthy

When a new convention emerges (a new pattern, a new "always do X", a new gotcha), **write it down**. The right place depends:

- **A rule that applies to every task** (e.g. "always use BottomSheet") → add to [`CLAUDE.md`](../CLAUDE.md). It'll auto-load in every session.
- **A reference (IDs, labels, lookup tables)** → add to the memory directory as a reference memory.
- **A workflow with steps** (e.g. "how to push an OTA") → add to [`CLAUDE.md`](../CLAUDE.md) **and** write a human runbook in [docs/runbooks/](./runbooks/). The two should mirror each other.
- **A user/feedback preference** (e.g. "this user prefers X") → memory directory as a feedback memory.

If you tell Claude "from now on always do X" in chat, it'll only remember that until the session ends. **Persist it explicitly:** *"Remember this in CLAUDE.md"* or *"Save this as a memory."*

## Working with the Linear MCP

[`.mcp.json`](../.mcp.json) configures a Linear MCP server. When Claude has it loaded, you can say things like:

- *"Show me issues in the Mobile App component that are still in Todo"*
- *"Create issues for the next three TODO comments I'm about to write"*
- *"What did EP-1000 say to do?"*

…and it'll call Linear directly. If the MCP isn't loaded, Claude falls back to direct GraphQL via the API key (also in [`.mcp.json`](../.mcp.json)).

## Working with the Supabase MCP

(Currently not used by Pulse — the backend is Xano — but the MCP is configured. Ignore for now.)

## A note on slash commands

Claude Code has built-in slash commands like `/review`, `/run`, `/loop`. They're not project-specific, but they're useful here:

- **`/review`** — review the current branch's diff. Great before a PR.
- **`/run`** — launches the app and screenshots it. Useful for visual verification.
- **`/verify`** — runs the change manually and reports what happened.

If `/ultrareview` is mentioned, that's a cloud-side multi-agent review, billed separately. User-triggered only.

## When you're stuck

The session is going sideways and Claude isn't getting it. Try, in order:

1. **Paste more context.** Open the file you want changed and paste a chunk near the section of interest. Specific code is the strongest possible anchor.
2. **Say what you've already tried.** *"I tried doing X but it broke Y."* avoids the agent suggesting X again.
3. **Constrain the scope explicitly.** *"Only change this one function. Don't touch the surrounding code, don't rename anything, don't add tests."*
4. **Ask Claude what it would need.** *"What context would make this task easier?"* — sometimes the answer is "the contents of `src/api/types.ts`" and you can paste that.
5. **Start a fresh session.** Long sessions accumulate context that biases the next answer. A clean session re-reads `CLAUDE.md` and starts fresh.

## Related

- [AI Handoff](./06-ai-handoff.md) — what the AI was doing on your behalf
- [`CLAUDE.md`](../CLAUDE.md) — the actual operating manual Claude reads
- [Runbooks](./runbooks/) — the human equivalents of the AI-driven flows
