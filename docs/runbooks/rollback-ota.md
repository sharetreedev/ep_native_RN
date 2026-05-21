# Runbook — Roll back a bad OTA

**When to use:** you published an OTA and it broke something — users are crashing, a feature regressed, the wrong backend is being hit, etc.

**Good news:** OTAs are reversible in under a minute. The fastest path is to re-publish a previous bundle to the same channel.

**Time:** ~2 minutes.

---

## Step 1 — Confirm the impact

Before rolling back, sanity-check the scope:

- Are users actually crashing? (Sentry: <https://sentry.io/organizations/sharetree/issues/>) — look for a spike right after the publish time.
- Is the new bundle the one running? Cold-launch on a real device and verify.
- Is it a hard-crash on launch from the `src/api/client.ts` data-source guardrail? If so, **users on the previous embedded bundle aren't affected** — the crash forces a fallback. But anyone who already updated _was_ getting the bad bundle.

## Step 2 — Find the last known-good update

```bash
eas update:list --branch production --limit 10
```

Look for the update group ID that was running fine before the bad one. Note the **group ID** (a UUID).

You can also see updates on the EAS dashboard: <https://expo.dev/accounts/sharetrees-organization/projects/mobile/updates>

## Step 3 — Republish the good bundle

The cleanest rollback is to republish the previous update to the same branch:

```bash
eas update:republish --branch production --group <previous-good-group-id> --message "rollback: <reason>"
```

This creates a new update group that's a copy of the previous one, on top of the bad one. Users see the new "rollback" group on their next launch — exactly the same content as the version they were running before the bad push.

> **Why republish vs roll back?** EAS Update has no "delete" or "true rollback" — the bad bundle stays in the history. The right move is to push a known-good bundle on top so it wins.

## Step 4 — Verify

```bash
eas update:list --branch production --limit 3
```

The newest entry should be your republish. Cold-launch a real device, confirm you're on the good bundle.

## Step 5 — Communicate

Post to Teams (use the **incident** template — see [Write a Teams release-note](./write-release-notes.md)):

```
Pulse update just went out 📲

We fixed <plain-language description of what was broken>. <One sentence on what's now correct.>

What you need to do: fully close and reopen the Pulse app to pick up the latest version.
```

Then:

- Update any Linear issues that were tied to the bad change — move them back to "In Progress" or "To Test" (not "Done")
- Open a new Linear issue for the rollback itself: type **Bug**, components matching the affected area, description explaining what went wrong

## Special case — the data-source guardrail crash

If users are crashing on launch with `[Xano] Non-dev build must use 'live' data source`:

1. The crash itself is the fail-safe — users fall back to the previous embedded bundle automatically.
2. Still rollback the OTA (step 3) so users who do update aren't stuck in a crash loop.
3. Fix the EAS env: `eas env:update --environment production --name EXPO_PUBLIC_XANO_DATA_SOURCE --value live`
4. Re-publish the **good** code with the fixed env: `npm run ota:production -- --message "fix data-source routing"`

The Teams message should acknowledge that some users may have been connecting to test data. The CLAUDE.md "incident release" example covers this exact case.

## When OTA rollback isn't enough

If the bad change was a **native build** (not an OTA), you can't roll back the same way. You need to:

- Submit a new build with the fix as fast as possible
- Use the App Store Connect / Play Console "phased rollout" pause feature to halt distribution to new users
- If a critical bug, contact App Store / Play support to expedite review

## Related

- [Push an OTA](./push-ota.md) — the publish that you might be undoing
- [Troubleshoot builds](./troubleshoot-builds.md) — for native-build problems
- [Environments](../03-environments.md) — for understanding why a misrouted bundle crashes safely
