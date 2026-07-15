# Development Setup

## iOS Simulator (macOS)

Run the full app in the iOS Simulator with a local **development build**. Expo Go
will **not** work — the app ships native modules (OneSignal, Sentry, Intercom,
Amplitude, Apple Auth) that Expo Go can't load. Everything below is scripted; the
manual detail is here so you understand what the script does and can debug it.

### One-time machine prerequisites

1. **Xcode** (from the App Store) + command-line tools: `xcode-select --install`
2. **An iOS Simulator runtime.** Xcode ships the SDK but not always a runtime.
   Install one (~7 GB):
   ```bash
   xcodebuild -downloadPlatform iOS
   ```
   Verify: `xcrun simctl list runtimes` should list an iOS runtime.
3. **CocoaPods** — use Homebrew's, the macOS system Ruby is too old:
   ```bash
   brew install cocoapods
   ```
4. **Node 22 LTS** (same pin the rest of the toolchain uses).

### Build & run

```bash
./scripts/ios-simulator.sh            # build + install the dev client (first run ~10 min)
npx expo start --dev-client           # then start Metro for day-to-day work
```

That's it. The first command builds the native app and installs it on a
simulator; the second serves your JS. After that, **JS/TSX edits hot-reload
instantly** — you only re-run the build script when a **native** dependency
changes.

Reconnect an already-installed app to a freshly-started Metro:
```bash
xcrun simctl openurl booted "exp+mobile://expo-development-client/?url=http://localhost:8081"
```
Screenshot the simulator for a PR/bug report: `xcrun simctl io booted screenshot shot.png`

### Two gotchas the script handles for you

- **Sentry won't compile locally** — `Module '_SentryPrivate' not found`. This is a
  sentry-cocoa + New Architecture + CocoaPods-static-linking issue that only bites
  on local Xcode (EAS's pinned Xcode is fine). The script temporarily adds
  `@sentry/react-native` to `expo.autolinking.exclude` in `package.json`, builds
  with `--no-bundler`, then **restores `package.json` on exit**. Sentry is
  `enabled: !__DEV__` so it's inert in dev anyway.
  > ⚠️ **Never commit an `expo.autolinking.exclude` for Sentry.** `package.json` is
  > tracked — committing that would disable crash reporting for real users on
  > EAS/production. The script keeps the edit transient for exactly this reason.
- **`.env.local` data source** — `src/api/client.ts` hard-throws at launch if
  `EXPO_PUBLIC_XANO_DATA_SOURCE` is unset. The script creates `.env.local` with
  `EXPO_PUBLIC_XANO_DATA_SOURCE=test` if it's missing. `.env.local` is git-ignored.
  Changing it requires restarting Metro with `-c` (env vars are inlined at bundle time).

### iOS troubleshooting

- **`pod: command not found`** — CocoaPods isn't on PATH. `brew install cocoapods`;
  the script prepends `/opt/homebrew/bin`.
- **No simulator to run on** — install a runtime (prerequisite 2 above).
- **`_SentryPrivate` error appears anyway** — you ran `npx expo run:ios` directly
  instead of `./scripts/ios-simulator.sh`. Use the script.
- **App loads then red-screens with a Xano env error** — `.env.local` is missing or
  Metro was started before it existed; create it and restart Metro with `-c`.

---

## Running on a physical Android device (Dev Client)

The dev client lets you test code changes instantly on a physical device using the `test` data source, without needing OTA updates.

### Prerequisites

- Node.js & npm installed
- EAS CLI: `npm install -g eas-cli`
- An Expo account linked to this project

### First-time setup (one-time only)

1. **Build the dev client APK:**

   ```bash
   npx eas build --profile development --platform android
   ```

   This takes ~15 minutes. Follow the build at the Expo dashboard link in the output.

2. **Install the APK on your device:**

   Open the build URL from the Expo dashboard on your Android device and tap Install. The app will appear as **"EP (Dev)"** — it can coexist alongside the production "Emotional Pulse" app.

3. **Set the data source to test:**

   In your `.env` file, set:

   ```
   EXPO_PUBLIC_XANO_DATA_SOURCE=test
   ```

   > **Important:** Remember to change this back to `live` before pushing OTA updates to production.

### Running the dev server

```bash
npx expo start --dev-client --tunnel
```

- `--dev-client` connects to the EP (Dev) app instead of Expo Go
- `--tunnel` uses ngrok so your phone can connect regardless of network setup

Open the **EP (Dev)** app on your device and scan the QR code from the terminal.

### Day-to-day workflow

- **Code changes** hot reload instantly — no OTA or rebuild needed
- **OTA to production** (`npx eas update --branch production --message "..."`) is only needed for users on the production app
- **Rebuild the dev client** only when native modules change (e.g. adding a new library with native code)

### Switching data sources

| Environment | `EXPO_PUBLIC_XANO_DATA_SOURCE` | How to deploy |
|---|---|---|
| Dev client | `test` | Automatic hot reload |
| Preview build | `test` (default) | `npx eas update --branch preview` |
| Production | `live` (set in `eas.json`) | `npx eas update --branch production` |

### Security note — dev logs contain passwords

The Xano API client logs every request body via `logger.log` (gated on `__DEV__`). For the email/password login flow this means the plaintext password appears in your Metro / Flipper console during development. It is **never** sent to production logs, crash reporters, or the `/bugs` endpoint.

**What this means for you:**

- Don't share screen recordings, Metro transcripts, or Flipper logs from a dev session without scrubbing them — they may contain credentials you typed while testing.
- Don't paste raw dev logs into Slack, Linear, or bug reports.
- If you need to share a trace for debugging, redact `[Xano] Body:` lines that follow a login/signup request.

This is intentional (valuable for debugging auth flows) but worth knowing about when sharing traces.

### Troubleshooting

- **"Conflicts with existing package"** — The dev build uses a separate package name (`com.sharetree.emotionalpulse.dev`) so it should install alongside production. If it still conflicts, uninstall the old dev build first.
- **QR code opens browser/localhost** — Make sure you're using `--tunnel` flag and scanning from inside the EP (Dev) app, not the camera app.
- **OneSignal errors in dev** — Expected. OneSignal native modules aren't fully available in dev builds. The errors are non-fatal and caught gracefully.
- **Metro says "Expo Go" mode** — Press `s` in the terminal to switch to development build mode.
