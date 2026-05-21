# Quickstart

Goal: clone the repo and have Pulse running on a physical device (or simulator) within ~30 minutes.

## 1. Install the toolchain

You need:

| Tool | Version | Why |
|---|---|---|
| **Node.js** | 18.3 or newer | Required by EAS CLI 18+ |
| **npm** | bundled with Node | Package install |
| **Xcode** | latest | iOS simulator & local iOS builds (Mac only) |
| **Android Studio** | latest | Android emulator & local Android builds |
| **EAS CLI** | latest | `npm i -g eas-cli` — talks to Expo's build servers |
| **Expo account** | — | `eas login` — must be added to the `sharetrees-organization` Expo team |
| **Apple Developer access** | — | Required to install iOS builds on a physical device (ask Dylan for an invite to the team `PL8F7LAM2G`) |

On macOS:

```bash
# Node via nvm is easiest
nvm install 20
brew install --cask android-studio
npm install -g eas-cli
```

## 2. Clone & install

```bash
git clone <repo-url> pulse-4.0
cd pulse-4.0
npm install
```

## 3. Set up environment variables

The committed `.env` file has safe defaults for local dev (`EXPO_PUBLIC_XANO_DATA_SOURCE=test`, public OAuth client IDs, etc).

You also need a **`.env.local`** for Sentry uploads. Ask Dylan for the `SENTRY_AUTH_TOKEN`. It looks like:

```
# .env.local — gitignored, never commit
SENTRY_AUTH_TOKEN=sntrys_xxxxxxxxxxxx
```

Without this, source map uploads on build will fail (everything else still works).

> **Why is `EXPO_PUBLIC_XANO_DATA_SOURCE` already in `.env`?**
> Because [`src/api/client.ts`](../src/api/client.ts) **throws at module load** if it's missing. The committed `.env` value (`test`) is correct for local dev. Don't change it locally without a reason — and never publish an OTA without going through [`scripts/ota.sh`](../scripts/ota.sh) (see [Environments](./03-environments.md)).

## 4. Pick a run mode

You have two ways to run Pulse locally. **Choose based on what you're changing:**

### Mode A — Expo Go (5-min setup, JS/UI work only)

Best for: UI tweaks, component changes, anything that doesn't touch native modules.

What's stubbed: OneSignal, Intercom, Amplitude, Sentry — these are native modules that don't exist in Expo Go. The app code guards against this, so most screens work fine; you just won't get pushes / Intercom chat / analytics events.

```bash
# Terminal 1
npm start          # press `s` to toggle to Expo Go mode if needed
```

Install Expo Go from the App Store / Play Store on your phone, scan the QR code from the terminal.

### Mode B — Dev client (15-min setup, full native experience)

Best for: anything touching OneSignal, Intercom, Amplitude, Sentry, OAuth, or app icons/splash/permissions.

One-time setup — build a dev client for your platform:

```bash
# iOS dev client (requires Apple Dev access on team PL8F7LAM2G)
eas build --profile development --platform ios

# Android dev client
eas build --profile development --platform android
```

Each takes ~15 min on EAS. When done, Expo emails you (or shows in the dashboard) a link to install the build on your phone. The app appears as **"EP Dev"** alongside your normal Pulse.

Day-to-day:

```bash
npm start --dev-client   # JS hot reload, just like Expo Go
```

You only need to rebuild the dev client when:

- A native dependency is added or version-bumped (e.g. someone updates `react-native-onesignal`)
- [`app.json`](../app.json) plugins, permissions, or bundle IDs change
- [`eas.json`](../eas.json) build profile changes

## 5. Sign in and verify

The Pulse data source `test` is wired to a Xano dataset with seeded test users. Ask Dylan for credentials for the `developer@sharetree.org` test account.

When you're in, you should see the main tab bar (MyPulse / Pulse / Get Support). If the app crashes on launch with a red screen mentioning `EXPO_PUBLIC_XANO_DATA_SOURCE`, your env file isn't loading — restart Metro with the cache cleared:

```bash
npm start -- --clear
```

## 6. Make your first change

Pick a simple thing to change so you can confirm the loop works:

1. Open [`src/screens/MyPulseScreen/`](../src/screens/) and change a label.
2. Save. The app reloads automatically.
3. See the change on your device.

That's the loop. Welcome aboard.

## Common first-day issues

| Symptom | Fix |
|---|---|
| App crashes immediately with "EXPO_PUBLIC_XANO_DATA_SOURCE is not set" | Your `.env` isn't being read. Restart Metro with `npm start -- --clear`. Check the file is named `.env` and lives at repo root. |
| QR code from `npm start` opens in a web browser | Add `--tunnel` to your start command: `npm start -- --tunnel`. |
| "Conflicts with existing package" installing the dev client APK | You have a previous dev client installed. The dev variant uses `com.sharetree.emotionalpulse.dev` (vs `.emotionalpulse` for prod), so they should coexist — uninstall the old one if they don't. |
| OneSignal / Intercom errors in dev | Expected if you're in Expo Go. Switch to a [dev client](#mode-b--dev-client-15-min-setup-full-native-experience). |
| iOS build fails on EAS with provisioning errors | You're not on the Apple team. Ask Dylan to add you to `PL8F7LAM2G`. |
| Metro is in "Expo Go mode" but you want dev client | Press `s` in the Metro terminal to toggle. |

> **One security note when sharing dev traces:** the Xano client logs request bodies in dev (`__DEV__` only — never in production). That means plaintext passwords appear in your Metro console during login testing. Scrub `[Xano] Body:` lines before pasting traces into Slack / Linear / Sentry tickets.

## Next steps

- [Architecture](./02-architecture.md) — understand the code map
- [Environments](./03-environments.md) — understand dev / preview / production
- [Push an OTA update](./runbooks/push-ota.md) — when you're ready to ship
