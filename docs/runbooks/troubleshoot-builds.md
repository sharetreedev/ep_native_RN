# Runbook — Troubleshoot a failed build

**When to use:** an `eas build` or `eas update` failed.

EAS build logs are linked from the CLI output and on <https://expo.dev>. The dashboard usually has the answer; this runbook covers the recurring patterns.

---

## Decision tree

### "Provisioning profile" / "Apple Developer team" / signing errors (iOS)

- You're not a member of Apple team `PL8F7LAM2G`. Ask Dylan for an invite.
- The credentials EAS has cached have expired. Run:
  ```bash
  eas credentials
  ```
  and re-fetch / regenerate for the iOS production profile.

### "Keystore" / "service account" errors (Android)

- The service account JSON at the repo root ([`emotional-pulse-f5d8b-add4482e5bf6.json`](../../emotional-pulse-f5d8b-add4482e5bf6.json)) is referenced by [`eas.json`](../../eas.json) for submit. If the file is missing, restore it (ask Dylan).
- For the upload keystore, run `eas credentials` and pick "Configure Android keystore". EAS can generate one or you can paste an existing one.

### Native dependency mismatch

Symptom: build fails compiling a native module ("undefined symbol", "method not found", "duplicate symbol").

Cause: you bumped a dep that has native code without also rebuilding the dev client / production native binary, OR two deps want different versions of the same transitive native lib.

Fixes:

1. Make sure the **lockfile** matches the manifest: `npm install` locally, commit `package-lock.json`.
2. Run `npx expo install` (not bare `npm install`) for any Expo SDK package — it'll pin the correct version for your current Expo SDK.
3. If `peerDependencies` conflict, add an `overrides` block in `package.json`. Pulse already does this for `tailwindcss`, `react-native-worklets`, and `react-native-pager-view` — see the bottom of [`package.json`](../../package.json).
4. Worst case, run `npx expo prebuild --clean` locally and check that the resulting iOS/Android folders compile. (Don't commit prebuild output unless you mean to.)

### "EXPO_PUBLIC_XANO_DATA_SOURCE is not set" at module load

You're publishing an OTA without `--environment`, or the EAS env doesn't have the var.

Fix:

```bash
# Verify what's set on each env
eas env:list --environment production
eas env:list --environment preview
eas env:list --environment development

# If missing, add it
eas env:create --environment <env> --name EXPO_PUBLIC_XANO_DATA_SOURCE --value <live|staging|test>
```

Then re-run `npm run ota:<env>`.

### App builds but crashes on launch with "Non-dev build must use 'live' data source"

You published an OTA to `production` or `preview` with a non-`live` data source. The crash is intentional (see [Environments: hard rules](../03-environments.md#1-non-dev-builds-must-use-expo_public_xano_data_sourcelive)).

Fix:

1. Update the EAS env: `eas env:update --environment production --name EXPO_PUBLIC_XANO_DATA_SOURCE --value live`
2. Re-publish: `npm run ota:production -- --message "fix data-source routing"`
3. Users on the previous embedded bundle were unaffected — only users who got the bad OTA had a crash; their app rolls back to the previous bundle automatically on next launch.

### "Could not find native module" / OneSignal / Intercom errors in Expo Go

Expected — these modules don't exist in Expo Go. Either:

- Switch to a dev client (`npm start --dev-client`), or
- Ignore the errors if you're just doing UI work — the calls are guarded and no-op safely

### Metro / bundler errors

| Error | Fix |
|---|---|
| "Unable to resolve module" | `npm install`, then restart Metro with `--clear` |
| "Element type is invalid: expected a string but got undefined" | Circular import — trace the import chain |
| "Cannot read property of undefined (reading 'X')" in production but not dev | Logger output is stripped in prod; check whether you accidentally relied on a `logger.log` side-effect |
| Metro hangs after a file save | Kill it, `rm -rf node_modules/.cache .expo`, `npm start -- --clear` |

### EAS dashboard says "Building" forever

EAS occasionally hangs. Cancel from the dashboard and re-trigger. If the same step hangs twice, it's likely a transient EAS infrastructure issue — check status.expo.dev.

### TypeScript errors that don't reproduce locally

EAS runs `tsc` on a clean checkout. If you have stale `node_modules` locally, your local build might not see the same errors. Fix by:

```bash
rm -rf node_modules
npm install
npx tsc --noEmit
```

## Useful diagnostic commands

```bash
# Recent EAS builds and their status
eas build:list --limit 5

# Recent EAS updates and their status
eas update:list --branch production --limit 5
eas update:list --branch preview --limit 5

# What env vars are on each EAS environment
eas env:list --environment production
eas env:list --environment preview
eas env:list --environment development

# What credentials EAS has cached
eas credentials

# What's in the lockfile vs manifest for a given dep
npm ls <pkg>

# Force a fresh prebuild (don't commit unless you mean to)
npx expo prebuild --clean
```

## When you're stuck

1. Read the full EAS build log on <https://expo.dev>. The CLI truncates; the dashboard doesn't.
2. Search the message in the [Expo forums](https://forums.expo.dev/) or `expo` issue tracker.
3. Ask Claude Code with the log pasted in — it has good pattern recognition for Expo/EAS errors.
4. Last resort: ping Dylan.

## Related

- [Environments](../03-environments.md) — env-var rules
- [Push an OTA](./push-ota.md) — the publish path
