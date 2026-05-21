# Third-Party Services

A reference for every service wired into the app. If you're adding a new SDK, follow the patterns here — especially around Expo Go safety and clean-logout via `resetRuntime`.

## At a glance

| Service | Purpose | Init file | Where creds live | Works in Expo Go? |
|---|---|---|---|---|
| **Xano** | Backend API | [`src/api/client.ts`](../src/api/client.ts) | EAS env (data source) + URL constants | Yes |
| **OneSignal** | Push notifications | `App.tsx` + [`PushPrimer.tsx`](../src/components/PushPrimer.tsx) | `app.json` (app ID), `.env` (public ID) | No |
| **Amplitude** | Analytics | [`src/lib/analytics.ts`](../src/lib/analytics.ts) | `.env` / EAS env (project keys) | No |
| **Intercom** | In-app support chat | [`src/lib/intercom.ts`](../src/lib/intercom.ts) | `app.json` (app ID + SDK keys) | No |
| **Sentry** | Crash reporting | `App.tsx` | `app.json` (DSN), `.env.local` (upload token) | Yes (init is guarded) |
| **Apple OAuth** | Sign in with Apple | [`AuthContext.tsx`](../src/contexts/AuthContext.tsx) | `app.json` plugin | No (Apple requires native) |
| **Microsoft OAuth** | Sign in with Microsoft | [`AuthContext.tsx`](../src/contexts/AuthContext.tsx) | `.env` (client ID) | Yes (uses `expo-auth-session`) |
| **Google OAuth** | Sign in with Google | [`AuthContext.tsx`](../src/contexts/AuthContext.tsx) | `app.json` / `.env` | Yes (uses `expo-auth-session`) |

## Xano (backend)

- **Instance:** `xdny-scc5-yag9`
- **Canonical API:** `LmTnxskw` (Mobile Native)
- **Workspace name:** "Emotional Pulse"
- **Base URL:** `https://xdny-scc5-yag9.a2.xano.io/api:LmTnxskw[:branch]`

The single HTTP client is [`src/api/client.ts`](../src/api/client.ts). It handles auth headers, retries, the `x-data-source` routing header, and the auth-expired callback. See [Architecture: API layer](./02-architecture.md#api-layer) for the full picture and [Environments](./03-environments.md) for the routing axes.

### Gotchas

- **No client-side join between check-ins and support requests.** The `/checkins/create` endpoint has no `related_support_request_id` field — the backend derives the link server-side. Don't try to set one from the client.
- **Tokens are in SecureStore**, wrapped in try/catch. If you hit a storage error, the worst case is the user logs in again next cold start. Never treat token storage as guaranteed.
- **Retries are GET-only.** Mutations never retry — we don't want duplicate check-ins / pair invites.

### Account ownership

Backend changes go through the Xano workspace owned by Sharetree's backend team. Mobile devs don't touch the backend directly. Coordinate via Linear for API changes.

## OneSignal (push)

- **App ID:** `fb2857a5-9090-4834-8259-2daf3e05ff18`
- **Dashboard:** [OneSignal app dashboard](https://onesignal.com/) (ask Dylan for access)
- **Plugin:** `onesignal-expo-plugin` (configured in [`app.json`](../app.json))

Push flow:

1. [`App.tsx`](../App.tsx) initializes OneSignal at startup, lazy-loading the native module so Expo Go doesn't crash.
2. On login, [`src/api/onesignal.ts`](../src/api/onesignal.ts) sets the External User ID so notifications can be targeted by Xano user ID.
3. The [`PushPrimer`](../src/components/PushPrimer.tsx) component shows an in-app explanation **before** the OS permission prompt — this dramatically improves opt-in rates and only shows once per install (tracked in SecureStore).
4. On logout, [`resetRuntime.ts`](../src/lib/resetRuntime.ts) clears the External User ID and unsubscribes the device.

### Gotchas

- **Not available in Expo Go.** All calls are guarded — they no-op when the native module is missing.
- **A user can have multiple devices.** OneSignal handles this via the External User ID; you don't need to manage device tokens manually.
- **PushPrimer persists across logout** (intentional — we don't want to re-ask if the user already declined).

## Amplitude (analytics)

- **Production project key:** in EAS env vars and `.env` (`EXPO_PUBLIC_AMPLITUDE_KEY_PRODUCTION`)
- **Staging project key:** same (`EXPO_PUBLIC_AMPLITUDE_KEY_STAGING`)
- **Dashboard:** [Amplitude](https://amplitude.com/)

Production vs staging routing happens in [`src/lib/analytics.ts`](../src/lib/analytics.ts):

```
DATA_SOURCE === 'live' && !__DEV__   →  production project
everything else                       →  staging project
```

So local dev, Expo Go, preview, and EAS `development` channel all funnel into the staging project. Only real production users hit the production project.

### Identity rules

- User ID is `user_<xano_id>` — Amplitude requires IDs longer than 5 chars.
- Only the **email domain** is logged (e.g. `@sharetree.org`), never the full address. Same for any other PII.
- User properties are reset on logout via `resetRuntime`.

### Events

Typed wrappers in [`src/lib/analyticsEvents.ts`](../src/lib/analyticsEvents.ts). Add new events there; don't call `amplitude.track` raw — the wrappers enforce the naming convention and parameter shape.

### Gotchas

- **Native module — no Expo Go.** Guarded; calls no-op silently.
- **SDK bumps need a new EAS build** — they can't be shipped as an OTA.

## Intercom (in-app support)

- **App ID:** `t015ivcr` (US region)
- **iOS SDK key:** in [`app.json`](../app.json)
- **Android SDK key:** in [`app.json`](../app.json)
- **Dashboard:** [Intercom](https://app.intercom.com/)

Lives in [`src/lib/intercom.ts`](../src/lib/intercom.ts). On login, we call `identifyIntercomUser(user)`; on logout, `logoutIntercomUser()`. Both are no-ops in Expo Go.

### Gotchas

- **The native Intercom session survives JS reloads.** You _must_ explicitly log out on user sign-out, otherwise the next sign-in shows the previous user's conversation history. `resetRuntime` does this for you — call it on logout.
- **Not available in Expo Go.** Guarded.
- **iOS/Android keys are different.** Both live in `app.json` under the `@intercom/intercom-react-native` plugin.

## Sentry (crash reporting)

- **Org:** `sharetree`
- **Project:** `mobile-native-react-native`
- **DSN:** in `app.json` via the `@sentry/react-native/expo` plugin
- **Upload token:** `.env.local` (`SENTRY_AUTH_TOKEN`) — for source map uploads at build time
- **Dashboard:** [sentry.io](https://sentry.io/organizations/sharetree/)

Initialized in [`App.tsx`](../App.tsx). Production-only — dev/preview builds don't send events.

Settings:

- `sendDefaultPii: true` — we send user IDs and emails to make triage easier
- Session replay: 1% baseline, 100% on errors
- All text, images, and vectors are masked in replays

### Gotchas

- **Source maps need the upload token.** Builds without `SENTRY_AUTH_TOKEN` in `.env.local` succeed but produce un-symbolicated stack traces. Ask Dylan for the token.
- **Don't put Sentry in a try/catch** — let it bubble. The init in `App.tsx` is the one place exceptions are intentionally swallowed.

## Auth providers

Three SSO providers, plus email + phone:

| Provider | Library | Setup |
|---|---|---|
| **Apple** | `expo-apple-authentication` | iOS only. Configured via `app.json` plugin. App must be on the Apple team `PL8F7LAM2G`. |
| **Microsoft** | `expo-auth-session` (OAuth flow) | Public client ID in `.env` (`EXPO_PUBLIC_MICROSOFT_CLIENT_ID`). Tenant is multi-org. |
| **Google** | `expo-auth-session` (OAuth flow) | Configured in the auth code. |
| **Email/password** | Xano native | `auth/login`, `auth/signup` |
| **Phone** | Xano native | Magic-link via SMS |

All flows funnel into [`AuthContext`](../src/contexts/AuthContext.tsx) → Xano `/auth/*` endpoints → token → `tokenStore.set` → `_setUser`.

### Gotchas

- **Apple sign-in is iOS-only.** It will be unavailable in Expo Go (no native), on Android (no Apple), and on Mac Catalyst.
- **Microsoft tenant** is multi-org — any work/school account works.
- **Migration flow:** legacy users (from the old Pulse) get a one-time password-setup screen on first login. The state is gated by `pendingPasswordSetup` in SecureStore.

## Adding a new service

If you're integrating something new (a new SDK, a new OAuth provider), follow this checklist:

1. **Decide if it's a native module.** If yes, it won't work in Expo Go — guard every call site or lazy-load the module.
2. **Pick where credentials live**:
   - Public IDs that the bundle needs at runtime → `.env` (committed) and `app.json` if a plugin needs them at build time
   - Secrets used at build time only → `.env.local` (gitignored)
   - Per-environment values → EAS env vars
3. **Wire identification to `AuthContext`** if the SDK has a "current user" concept.
4. **Wire teardown to [`resetRuntime`](../src/lib/resetRuntime.ts)** so logout cleans up correctly.
5. **Document the gotchas here.** Future-you will thank you.

## Related

- [Environments](./03-environments.md) — where each env var lives
- [Architecture](./02-architecture.md) — `resetRuntime` and the auth flow
