# Deep Linking

This document explains how Universal Links (iOS) and App Links (Android) work in Emotional Pulse, and how to add a new deep-linkable path.

## Architecture overview

The app uses a dedicated subdomain — `app.emotionalpulse.ai` — for all deep links. When a user taps any `https://app.emotionalpulse.ai/…` URL on a device with the app installed, the OS intercepts the request and opens the app. React Navigation's `linking` config maps the URL to a screen.

If the app is **not** installed, the link opens normally in the browser.

If the user is **not authenticated**, the URL is saved to SecureStore via `pendingLink.ts`. After the user completes sign-in, `AppNavigator` consumes the pending link and routes to the originally-requested screen.

### Two URL conventions

**1. Query-string routing** (used by notification URLs):

```
https://app.emotionalpulse.ai/?page=s123   → Support request #123
https://app.emotionalpulse.ai/?page=p456   → Pair detail #456
https://app.emotionalpulse.ai/?page=i789   → Group invite #789
```

| Prefix | Routes to | Status |
|--------|-----------|--------|
| `s<id>` | Support request detail | Future ticket (logs + routes to Main) |
| `p<id>` | Pair detail | Future ticket (logs + routes to Main) |
| `i<id>` | Group invite | Future ticket (logs + routes to Main) |

Parsed by the custom `getStateFromPath` in `src/navigation/linking.ts`.

**2. Path-based routing** (used by shareable links):

```
https://app.emotionalpulse.ai/pair-invite?pair_token=abc
https://app.emotionalpulse.ai/group-invite?group_id=42
```

Handled by React Navigation's default path-to-screen mapping in the `config.screens` object.

### Key files

| File | Purpose |
|------|---------|
| `app.json` | `associatedDomains` (iOS) and `intentFilters` (Android) |
| `.well-known/apple-app-site-association` | Tells iOS the app claims `app.emotionalpulse.ai` |
| `.well-known/assetlinks.json` | Tells Android the app claims `app.emotionalpulse.ai` |
| `src/navigation/linking.ts` | URL-to-route mapping + `?page=` parser |
| `src/navigation/pendingLink.ts` | Stores deep links that arrive pre-auth |
| `src/navigation/AppNavigator.tsx` | Consumes pending links after auth |

## How to add a new deep-linkable path

### For `?page=` prefix routes

1. Build the target screen
2. Add it to `RootStackParamList` in `src/types/navigation.ts`
3. Add the `<Stack.Screen>` in `AppNavigator.tsx`
4. Update `resolvePageParam()` in `src/navigation/linking.ts` to return the correct route state for that prefix

No AASA / intent filter changes needed — the root `/` claim covers all paths on the subdomain.

### For path-based routes

1. Build the target screen
2. Add it to `RootStackParamList` in `src/types/navigation.ts`
3. Add the `<Stack.Screen>` in `AppNavigator.tsx`
4. Add the mapping in `linking.ts` under `config.screens`:

```typescript
config: {
  screens: {
    YourScreen: 'your-path',
  },
},
```

No AASA / intent filter changes needed — the root `/` claim covers all paths on the subdomain.

### Deploy the `.well-known/` files

The `apple-app-site-association` and `assetlinks.json` files must be hosted at:

- `https://app.emotionalpulse.ai/.well-known/apple-app-site-association`
- `https://app.emotionalpulse.ai/.well-known/assetlinks.json`

Requirements:
- Served as `application/json`
- No file extension on the AASA file
- No redirects
- No authentication required
- HTTPS only

**Important:** iOS caches AASA files aggressively via Apple's CDN. Allow at least 24 hours between deploying an updated AASA file and testing on-device.

### Rebuild the app (only for native config changes)

Changes to `associatedDomains` or `intentFilters` in `app.json` require a **native rebuild** (not an OTA update):

```bash
npm run build:production
```

The linking config in `linking.ts` (including `?page=` routing) **can** be updated via OTA since it's JavaScript. Adding new `?page=` prefixes or new path-based routes does not require a native rebuild.

## Testing

### iOS

- Universal Links only work on **real devices**, not the Simulator
- Tap a link from Notes, Messages, or Mail (not Safari's address bar)
- After installing a new build, iOS may take a few minutes to verify the AASA

### Android

- Verify app link status: `adb shell pm get-app-links com.sharetree.emotionalpulse`
- App Links are auto-verified on install if `assetlinks.json` is reachable
- Existing installs may need manual association: Settings > Apps > Emotional Pulse > Open by default

### Staging

The production subdomain (`app.emotionalpulse.ai`) is the only Universal Link target. Staging testing uses TestFlight / Internal Testing builds that intercept production URLs but call staging Xano. See the EP-1031 Linear ticket for the full staging testing approach.

## Existing deep link patterns

| Scheme | Path/Query | Purpose |
|--------|------------|---------|
| `emotionalpulse://` | `/auth` | Microsoft SSO OAuth callback (do not change) |
| `https://app.emotionalpulse.ai` | `/?page=s<id>` | Support request detail (future) |
| `https://app.emotionalpulse.ai` | `/?page=p<id>` | Pair detail (future) |
| `https://app.emotionalpulse.ai` | `/?page=i<id>` | Group invite (future) |
| `https://app.emotionalpulse.ai` | `/pair-invite` | Pair invite acceptance (Ticket 2) |
| `https://app.emotionalpulse.ai` | `/group-invite` | Group invite acceptance (future) |
