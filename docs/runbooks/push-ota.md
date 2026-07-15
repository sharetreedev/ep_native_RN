# Runbook — Push an OTA update

**When to use:** you have a JS-only change you want to ship to live users without going through the App Store / Play Store.

**When NOT to use:** if you bumped `app.json` `version`, changed `app.json` plugins or permissions, or added a native dependency. See [Releases: decision flowchart](../05-releases.md#decision-flowchart).

**Time:** ~2 minutes (the publish itself; the dance around it takes ~5).

---

## Before you push

- [ ] You're on the branch that contains the changes
- [ ] You've manually tested the change on a dev client or simulator
- [ ] Recent commits are pushed to GitHub (so the OTA bundle matches what's on `main`)
- [ ] You have an outline of what changed in plain English (for the Teams post — see step 4)

## Step 1 — Publish the update

```bash
npm run ota:production -- --message "<short summary of what changed>"
```

Replace `production` with `preview` or `development` if you're shipping somewhere else first (which you should for big changes — push to `preview` first, install on TestFlight / internal Android, verify, then push to `production`).

What this does:

1. **Git pre-flight:**
   - Blocks if your local HEAD is behind `origin/main` (publishing would roll back merged work — `git pull --ff-only origin main` to fix).
   - **Live-release guard:** cross-references the `EP-####` tokens in the *currently-live* update's message against `origin/main`'s history. If the live release references work that isn't on `main` — i.e. it was OTA'd but **never merged to main** (the [EP-1125-1128 incident](rollback-ota.md) class) — it stops, because publishing from `main` would silently roll that work back. `update:list --json` doesn't expose each update's source commit, so this is a heuristic on EP numbers; get the missing work onto `main`, or pass `--skip-history-check` only if you're certain it's intentional.
   - Warns on a dirty working tree (`--allow-dirty` to skip).
2. Verifies `EXPO_PUBLIC_XANO_DATA_SOURCE` is set on the target EAS environment (`production` / `preview` / `development`)
3. Unsets any locally-exported `EXPO_PUBLIC_XANO_DATA_SOURCE` so it can't bleed into the bundle
4. Calls `eas update --channel <env> --environment <env>` — EAS pulls env vars from its server-side store, not your local `.env`

> **Do not call `eas update` directly.** It will use whatever's in your `.env` (currently `EXPO_PUBLIC_XANO_DATA_SOURCE=test`) and bake that into the bundle. The safety check in [`src/api/client.ts`](../../src/api/client.ts) would crash the app on user devices — better than corrupting data, but disruptive. The wrapper avoids this entirely.

The command will print an EAS update URL and a group ID when it succeeds. Save the group ID.

## Step 2 — Verify the update is live

```bash
eas update:list --branch production --limit 3
```

You should see your update at the top. Confirm:

- The `branch` matches the channel you published to
- The `runtimeVersion` matches `app.json` `version` (currently `3.1.2`)
- The message you set is correct

Then cold-launch your physical device (force-quit the app, reopen). The update should download silently in the background. Force-quit again and reopen to make sure you're running the new bundle.

> **A quicker check during dev:** in Expo dev tools, "Updates → Check for updates" forces a poll.

## Step 3 — Create / update Linear issues

For each piece of work in this update:

1. Make sure a Linear issue exists in **"Emotional Pulse - Mobile Native"** (see [Create a Linear issue](./create-linear-issue.md))
2. Mark each issue **Done** — it's live as soon as the OTA succeeds
3. Assign to Dylan if not already

If multiple commits are in this update, batch them — one mutation can create/update many issues using GraphQL aliases.

## Step 4 — Post the Teams release-note

See [Write a Teams release-note](./write-release-notes.md) for the writing rules and templates. Short version:

```bash
curl -X POST "https://hook.eu2.make.com/kk8btnn8wjnnuwpdup0wle6a08wulr2y" \
  -H "Content-Type: application/json" \
  -d '{"message": "<p>HTML release note here</p>"}'
```

The message must be **user-language**, not engineering-language. No EP numbers, no file paths, no acronyms.

## Step 5 — Keep an internal record

The Linear issues and your commit message are the engineering record. Make sure the commit on `main` summarizes the same scope of work that the OTA covered. You don't need a separate changelog file — `git log` + Linear is enough.

---

## Channels reference

| Channel | EAS environment | Data source | Audience |
|---|---|---|---|
| `production` | production | live | All live users |
| `preview` | preview | staging | Internal testers (TestFlight + Android internal) |
| `development` | development | test | Devs with EAS dev-client installed |

## If something goes wrong

- **Wrapper errors with "EXPO_PUBLIC_XANO_DATA_SOURCE is not set"** → That env var is missing from the EAS environment. Fix:
  ```bash
  eas env:create --environment production --name EXPO_PUBLIC_XANO_DATA_SOURCE --value live
  ```
- **Users report the app crashes on launch after an OTA** → almost certainly a misconfigured data source. The hard-throw in [`src/api/client.ts`](../../src/api/client.ts) catches this. Roll back immediately (see [Rollback runbook](./rollback-ota.md)). Users on the previous embedded bundle are unaffected.
- **Update appears in `eas update:list` but users don't see it** → check `runtimeVersion`. If it doesn't match the installed app's `version`, the OTA simply doesn't apply. You probably need a native build instead.

## Related

- [Environments](../03-environments.md) — the rules the wrapper enforces
- [Rollback an OTA](./rollback-ota.md) — undoing a bad push
- [Write a Teams release-note](./write-release-notes.md) — the user-facing comms
