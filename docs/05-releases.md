# Releases

Two kinds of release ship Pulse: **OTA updates** (fast, JS-only) and **native builds** (slow, needed for native changes). This doc explains when each one applies. The step-by-step is in [the push-OTA runbook](./runbooks/push-ota.md).

## Decision flowchart

Ask, in order:

1. **Did you bump `version` in [`app.json`](../app.json)?**
   → Native build. (Bumping `version` changes the runtime version, so existing OTAs no longer apply to new installs.)

2. **Did you change [`eas.json`](../eas.json) or [`app.json`](../app.json) plugins/permissions?**
   → Native build.

3. **Did you add, remove, or version-bump a native dependency?** ("Native" = any package whose iOS/Android folders have actual source, not just JS. When in doubt: if `expo prebuild` would change `ios/` or `android/`, it's native.)
   → Native build.

4. **Otherwise** (JS, TSX, styles, assets, copy changes) → **OTA.**

## OTA (over-the-air update)

The fast path. Publishes a new JS bundle to EAS; users get it next time they cold-launch the app.

```bash
npm run ota:production   # ship to all production users
npm run ota:preview      # ship to preview/internal testers
npm run ota:development  # ship to dev-client installs
```

Each is a wrapper around [`scripts/ota.sh`](../scripts/ota.sh) that enforces the env-source rules from [Environments](./03-environments.md).

### Properties

- **No App Store review.** Goes live in ~1 minute.
- **Per-runtime-version.** Only reaches installs whose `version` matches the current `app.json` `version` (currently `3.1.2`).
- **Per-channel.** `production` / `preview` / `development` are independent — publishing to one never affects the others.
- **Bundled with EAS env vars.** Because we pass `--environment`, the published bundle uses EAS-hosted env values (not your local `.env`).

### The full publish flow lives in [the runbook](./runbooks/push-ota.md).

## Native build (App Store / Play Store)

The slow path. Required when JS isn't enough.

```bash
npm run build:production   # builds iOS+Android, auto-submits to App Store + Play Store internal
npm run build:preview      # builds iOS+Android for internal distribution (TestFlight + APK)
npm run build:development  # builds the dev client (one-time per developer/device)
```

Each is a wrapper around `eas build --platform all --profile <profile>`. The production profile has `--auto-submit`, so a successful build is automatically pushed to:

- **iOS:** App Store Connect (manual review/release in App Store Connect)
- **Android:** Google Play internal track (manually promote to production)

EAS handles all signing — no local provisioning profiles or keystores.

### When to do a native build

- Bumping `version` in `app.json`
- Adding/changing a plugin in `app.json` (OneSignal config, Intercom keys, splash screen)
- Adding/removing a native dependency
- Changing iOS `infoPlist` (permissions strings, privacy manifest)
- Changing Android permissions or `package` name
- Bumping a native dependency's SDK (e.g. OneSignal v5 → v6)

### Timing

- iOS: ~15-20 min build + 1-3 days for App Store review on a fresh submission, ~24h on subsequent ones
- Android: ~15-20 min build, then manual promotion in Play Console (a few hours of review)

If users need a fix sooner than that, see if you can split it: ship the JS part as an OTA on the current native version, and bundle the native change for the next planned native release.

## Version policy

- **`app.json` `version`** (`3.1.2`) — semver-ish, human-facing. Bump on every native release.
- **`runtimeVersion.policy: appVersion`** — OTA bundles only apply to installs whose `version` matches. So bumping `version` is implicitly bumping the OTA runtime.
- **`autoIncrement: true`** on the production profile — EAS auto-bumps the iOS `buildNumber` and Android `versionCode` for each build, so you never have to.

### What to bump when

- **Bug fix or feature, JS-only** → no version bump, ship as OTA
- **Bug fix or feature, requires native** → patch bump (`3.1.2` → `3.1.3`)
- **Visible breaking change to users** → minor bump (`3.1.x` → `3.2.0`)
- **Major rewrite or platform change** → major bump (`3.x.x` → `4.0.0`)

## Pre-release checklist

Before pushing an OTA or kicking off a native build:

- [ ] Ran the app locally and walked through the changed flow on a real device
- [ ] If you touched env vars: verified the right EAS environment has the right values (`eas env:list --environment <env>`)
- [ ] If you touched the API: confirmed the Xano endpoint exists on the target API branch (`:staging` for dev/development, main for preview/production)
- [ ] Linear issue exists and has type + component labels (see [Create a Linear issue](./runbooks/create-linear-issue.md))
- [ ] Have a short user-language summary ready for the Teams post (see [Write a Teams release-note](./runbooks/write-release-notes.md))

## After-release checklist

- [ ] Verify the update is live: `eas update:list --branch production --limit 5`
- [ ] Cold-launch a real device and confirm you see the change
- [ ] Mark the Linear issue **Done**
- [ ] Post to the Teams channel via the Make webhook (the [runbook](./runbooks/write-release-notes.md) has the template)

## If something is wrong

See [Rollback runbook](./runbooks/rollback-ota.md). OTAs are reversible in seconds; native releases are not.

## Related

- [Environments](./03-environments.md) — the env-source rules that the OTA wrapper enforces
- [Push an OTA](./runbooks/push-ota.md) — step-by-step
- [Rollback an OTA](./runbooks/rollback-ota.md) — when something is wrong
- [Troubleshoot builds](./runbooks/troubleshoot-builds.md) — when EAS build fails
