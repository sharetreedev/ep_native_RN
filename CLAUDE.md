# Pulse 4.0 - React Native Mobile App

## Linear Integration

When working on tasks in this project:
- **Create a Linear issue** in the project "Emotional Pulse - Mobile Native" for each task requested
- **Apply appropriate labels** from the project — both the type (bug, improvement, feature) and the relevant app component labels that match the area of the app being worked on
- **When a task is completed**, update the Linear issue status to "Done"
- Use the Linear GraphQL API directly (`https://api.linear.app/graphql`) — read the API key from `.mcp.json`
- All IDs (team, project, assignee, labels, workflow states) are cached in the memory file `project_linear_workflow.md` — no need to fetch them each session

## OTA Update Workflow

When the user asks to "push OTA", "OTA update", or similar — follow these steps in order:

### 1. Publish the update
```bash
npm run ota:production -- --message "<brief summary of changes>"
```
- **NEVER call `eas update` directly.** It reads `EXPO_PUBLIC_*` env vars from the local `.env` at publish time, which will silently bake the wrong `x-data-source` header into the production bundle. The `npm run ota:*` scripts wrap `eas update` with `--environment` so the EAS-hosted env vars are used instead.
- Channels: `ota:production` | `ota:preview` | `ota:development`
- The wrapper (`scripts/ota.sh`) verifies `EXPO_PUBLIC_XANO_DATA_SOURCE` exists on the target EAS environment before publishing and unsets any locally-exported value.
- `src/api/client.ts` hard-throws at module-load if a non-`__DEV__` build ships with anything other than `live`. A misconfigured OTA crashes on launch and users roll back to the previous embedded bundle — safer than silently running against the wrong backend.
- The message should summarize what changed — infer from conversation history or ask the user

### 2. Create Linear issues
- Create a Linear issue for each piece of work included in this update
- Use the Linear GraphQL API — all IDs and labels are in the memory file `project_linear_workflow.md`
- Mark all issues as **Done** (they're live once OTA is published)
- Assign to Dylan

### 3. Post to Microsoft Teams via Make

**The Teams audience is END USERS, not developers.** Every message must be written for someone who has never seen the codebase, doesn't know what an "OTA" or a "refactor" is, and only cares about what they will notice when they open the app.

- **Webhook URL:** `https://hook.eu2.make.com/kk8btnn8wjnnuwpdup0wle6a08wulr2y`
- Send a POST request with an **HTML** `message` field:
  ```bash
  curl -X POST "https://hook.eu2.make.com/kk8btnn8wjnnuwpdup0wle6a08wulr2y" \
    -H "Content-Type: application/json" \
    -d '{"message": "<p>HTML message here</p>"}'
  ```

#### Writing rules — apply to every Teams message
1. **Lead with user impact, not the cause.** "Sign up is faster" — not "refactored AuthScreen form layout".
2. **Each bullet describes what the user will see or feel**, in plain language. Strip every framework name, file path, component name, hook name, and acronym (no "MHFR refactor", no "context provider split", no "EmotionBadge").
3. **Group all backend / refactor / perf work into ONE catch-all line** — never list it ticket-by-ticket. Example: "Behind the scenes: a stability and performance pass — the app should feel snappier all round."
4. **No Linear links, no EP numbers, no update group IDs, no commit hashes** in the user-facing message. Those are for our internal records only.
5. **Always end with a concrete action** the user can take to receive the update — typically "Close and reopen Pulse to get the update."
6. **If something went wrong** (data integrity, sign-in confusion, lost work): acknowledge it honestly, explain who it might have affected in plain terms, and offer a recovery path ("give us a shout — we can get them restored"). Never hide impact.
7. **Friendly register, not corporate.** "A few quality-of-life improvements" beats "This release contains the following enhancements".
8. **Open with one of:** `Pulse update just went out ✨` (features) / `Pulse update just went out 📲` (fixes/incident). Pick the emoji to match the vibe — celebratory for new things, neutral for fixes.

#### Template — features / improvements release
```
Pulse update just went out ✨

A few quality-of-life improvements:

- <user-visible change in plain language>
- <user-visible change in plain language>
- <user-visible change in plain language>
- Behind the scenes: <one-line summary of any refactor / perf / tech-debt work, framed as "the app should feel ..."> 

Close and reopen Pulse to get the update.
```

#### Template — fix / incident release
```
Pulse update just went out 📲

We fixed <plain-language description of the issue and who it may have affected>. <One sentence on what's now correct.>

What you need to do: fully close and reopen the Pulse app to pick up the latest version. <If relevant: recovery path — "if you ... give us a shout, we can get them restored".>
```

#### Worked example — features release (the EP-801 → EP-808 batch)
```
Pulse update just went out ✨

A few quality-of-life improvements:

- Sign up is faster — first and last name now sit on a single row, and the Microsoft and mobile sign-up buttons are clearer about what they do
- Cleaner check-in grid — fixed a brief colour flicker when the grid first loads
- Profile screen polish — the emotion badge under your avatar now sits a bit lower so it breathes better
- Support requests — your pairs list now only shows people you can actually call (accepted invites with a phone number)
- Behind the scenes: a big stability and performance pass across Groups, Pairs, MHFR support, and the support request flow — the app should feel snappier all round

Close and reopen Pulse to get the update.
```

#### Worked example — incident release (the env-source hardening fix)
```
Pulse update just went out 📲

We fixed a behind-the-scenes issue where some people signing in over the last week may have been connecting to a test environment instead of their real Pulse account. Everyone is now reliably signing in to the correct account.

What you need to do: fully close and reopen the Pulse app to pick up the latest version. If you created any check-ins or invited any pairs in the last week and don't see them when you log back in, give us a shout — we can get them restored.
```

#### Internal record (NOT sent to Teams)
Keep the EP numbers, EAS update group ID, and engineering detail in the **Linear issues** themselves and in the OTA commit message. Teams gets the user story; Linear is the engineering record.

### Notes
- If unsure what work was done, check `git log` since the last update or ask the user
- You can batch multiple Linear issue creates in a single GraphQL mutation using aliases

## Project Details

- This is a React Native (Expo) mobile app
- Backend API: Xano (https://xdny-scc5-yag9.a2.xano.io/api:LmTnxskw)
