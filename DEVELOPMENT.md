# Development Setup

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

### Troubleshooting

- **"Conflicts with existing package"** — The dev build uses a separate package name (`com.sharetree.emotionalpulse.dev`) so it should install alongside production. If it still conflicts, uninstall the old dev build first.
- **QR code opens browser/localhost** — Make sure you're using `--tunnel` flag and scanning from inside the EP (Dev) app, not the camera app.
- **OneSignal errors in dev** — Expected. OneSignal native modules aren't fully available in dev builds. The errors are non-fatal and caught gracefully.
- **Metro says "Expo Go" mode** — Press `s` in the terminal to switch to development build mode.
