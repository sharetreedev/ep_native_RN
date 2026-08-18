# Deploy to the App Store & Play Store (full native builds — NOT OTA)

Captured from the v3.2.0 release (EP-1194, 11–13 Aug 2026). OTA updates are a
different path (`docs/runbooks/push-ota.md` / the `/ota-publish` skill); use THIS
runbook when native code, entitlements, icons, or bundled assets change.

## Identity constants

| Thing | Value |
|---|---|
| EAS project | `@sharetrees-organization/mobile` (ID `442160e5-834b-4247-af44-9f98fcd593ff`) |
| Bundle ID | `com.vative.stemotionalpulse` (+ `…OneSignalNotificationServiceExtension`) |
| Apple team | `PL8F7LAM2G` (ShareTree Inc); ascAppId `1560353741`; submit appleId dylan@calibremedia.com.au |
| ASC API key | `./AuthKey_T43J42T3TA.p8` (repo root, gitignored via `*.p8`); Key ID `T43J42T3TA`; Issuer ID `69a6de8d-…` — all wired in `eas.json` → `submit.production.ios` |
| Play service account | `./google-play-service-account.json` (repo root, gitignored) |
| Last shipped | v3.2.0 — Android versionCode 129 (internal track), iOS build 23 |

## The runbook

1. **Native-affecting changes** (entitlements, icons, sounds in `app.json`) require
   this full-build path — an OTA cannot ship them.
2. **Bump ONLY `expo.version`** in `app.json`. Never touch buildNumber/versionCode —
   `appVersionSource: "remote"` + `autoIncrement: true` means EAS manages both.
   ⚠ `runtimeVersion: {"policy":"appVersion"}` — a version bump rolls the OTA
   runtime, so OTA updates stop reaching older binaries until users update.
3. **Commit everything first.** EAS builds from git; uncommitted changes are silently
   excluded. Use a release branch (e.g. `ep-XXXX-release`).
4. **Pre-flight** (before burning a ~20-min build):
   ```bash
   npx --yes eas-cli@latest whoami        # expect: sharetrees-organization
   ls google-play-service-account.json AuthKey_*.p8
   ```
   `eas` is NOT installed globally — always `npx --yes eas-cli@latest`.
5. **Build:**
   ```bash
   npx --yes eas-cli@latest build --platform all --profile production --non-interactive --no-wait
   ```
   Poll: `npx --yes eas-cli@latest build:list --limit 6 --non-interactive --json`.
   (`npm run build:production` = same + `--auto-submit`.)
6. **Submit Android** (uploads the .aab to the Play **internal** track):
   ```bash
   npx --yes eas-cli@latest submit --platform android --profile production --latest --non-interactive
   ```
   Then promote internal → production manually in Play Console.
7. **Submit iOS** (uploads the .ipa; NO 2FA needed thanks to the ASC key):
   ```bash
   npx --yes eas-cli@latest submit --platform ios --profile production --latest --non-interactive
   ```
   Apple processes ~5–60 min before the build appears in TestFlight → Builds.
8. **Manual, human-only final step** (no API can do this): App Store Connect →
   App Store/Distribution tab (NOT TestFlight) → open/create the version → What's
   New → Add Build → export compliance → **"Add for Review"** (top-right — this is
   the renamed "Submit for Review"). Review takes ~1–3 days.
9. **Close out:** merge release branch → main, push, verify no secrets committed
   (`git diff --name-only main..HEAD | grep -iE '\.p8|AuthKey|service-account'`),
   update `DEPLOYMENT.md`, comment the Linear ticket(s).

## Gotchas (every one hit for real in the v3.2.0 release)

- **New entitlement ⇒ interactive build once.** Adding a capability (e.g. Time
  Sensitive Notifications) to `app.json` makes non-interactive iOS builds FAIL with
  `XCODE_BUILD_ERROR` ("provisioning profile doesn't support … capability") — the
  build queues fine and dies late, in Xcode. Fix: run ONE interactive build
  (`… build --platform ios --profile production`, no `--non-interactive`) with Apple
  2FA so EAS enables the capability and regenerates the profile; then non-interactive
  works again.
- **`eas build` does not upload anywhere.** Build and submit are separate stages —
  if the build isn't in ASC/Play, you haven't run `eas submit`.
- **The Play key must be a SERVICE-ACCOUNT JSON** (`"type": "service_account"`,
  `client_email` ending `iam.gserviceaccount.com`) — NOT `google-services.json`
  (Firebase app config); `eas submit` can't use the latter.
- **Duplicate-binary submits fail opaquely.** Re-running `eas submit` for an
  already-uploaded build gives a generic "Something went wrong" — the real reason is
  only on the expo.dev submission page; eas-cli has no `submission:view`.
- **ASC key facts:** Key ID is in the filename (`AuthKey_<KEYID>.p8`); the Issuer ID
  is the single team-wide UUID at the TOP of Users and Access → Integrations (not the
  per-key ID); role ≥ App Manager. The key can upload builds but can NEVER click
  "Add for Review" — Apple requires a human.
- **`eas submit --id` needs the full build UUID** — truncated IDs fail; `--latest`
  is the safe flag.
- **Gitignore keys BEFORE dropping them in the repo** (`*.p8`,
  `google-play-service-account.json` are covered). IDs in `eas.json` are fine in a
  private repo; key FILES never.
- **Git quirk seen here:** local `main` once tracked the wrong upstream
  (`origin/ep-1128-…`) — check `git branch -vv` before `git pull` on main.

## v3.2.0 release outcome

**Both stores published** — Maurice promoted Android internal → production and
completed the iOS release manually in the store consoles (confirmed 18 Aug 2026).

Still genuinely open:
- Time-Sensitive entitlement's effect on already-quieted devices: verify on a real
  device now that 3.2.0 is live; fallback = in-app "re-enable notifications" prompt
  (follow-up ticket was proposed, not created).
- On-device verification of v3.2.0 polish items (custom sound, banner, icon); the
  Android build was never device-tested pre-release.
