# Architecture

A code map of Pulse 4.0. The goal of this doc is not to re-describe every file — the codebase itself is the documentation for that — but to surface **the non-obvious patterns and decisions** that you can't infer from grep.

## The big picture

```
App.tsx                          App root: providers, font loading, Sentry init
  └─ AuthProvider                Who is logged in (src/contexts/AuthContext.tsx)
     └─ Other providers          Course, MHFR, Notifications, Toast, etc.
        └─ AppNavigator          Routing brain (src/navigation/AppNavigator.tsx)
           ├─ Auth stack         If not logged in
           ├─ Onboarding         If logged in but onboarding incomplete
           └─ Tab navigator      Main app: MyPulse / Pulse / Get Support
              └─ Screens         src/screens/*
                 └─ Hooks        src/hooks/* — talk to contexts + API
                    └─ API       src/api/* — HTTP to Xano
                       └─ Xano   The backend
```

Three things to internalize:

1. **`AppNavigator` is the routing brain.** It looks at auth state, onboarding state, and pending-password-setup state and decides which stack to mount. Don't add routes by guessing — read [`src/navigation/AppNavigator.tsx`](../src/navigation/AppNavigator.tsx) once.
2. **State lives in React Contexts, not Redux/Zustand/React Query.** This is unusual for a project this size. See [State](#state) below.
3. **The Xano client is the only HTTP layer.** Every API call goes through [`src/api/client.ts`](../src/api/client.ts). It handles auth headers, retries, the `x-data-source` header, and the auth-expired callback.

## Folder structure

| Folder | What's in it |
|---|---|
| [`src/api/`](../src/api/) | One file per Xano resource (`auth.ts`, `checkins.ts`, `pairs.ts`, …) + the HTTP client. Hand-written types in `types.ts`. |
| [`src/components/`](../src/components/) | Reusable UI primitives and feature-shared components (~54 files). The `BottomSheet` primitive is special — see below. |
| [`src/contexts/`](../src/contexts/) | Global state: Auth, CheckIn, Course, MHFR, Notifications, Toast. |
| [`src/hooks/`](../src/hooks/) | Custom hooks that wrap a context or an API call. |
| [`src/lib/`](../src/lib/) | Cross-cutting utilities: `analytics.ts`, `intercom.ts`, `logger.ts`, `fetchCache.ts`, `resetRuntime.ts`, `bugReporter.ts`. |
| [`src/navigation/`](../src/navigation/) | React Navigation setup. `AppNavigator.tsx` is the entrypoint. |
| [`src/screens/`](../src/screens/) | One folder per screen (~38). Each screen is a React component + its own README in some cases. |
| [`src/theme/`](../src/theme/) | Design tokens (colours, fonts, spacing, radii). See [`DESIGN_SYSTEM.md`](../DESIGN_SYSTEM.md). |
| [`src/types/`](../src/types/) | App-level TypeScript types (e.g. `navigation.ts` for typed routes). |
| [`src/utils/`](../src/utils/) | Pure helpers (dates, validation, formatting). |
| [`android/`](../android/), [`ios/`](../ios/) | Generated native projects. Don't hand-edit unless you really mean it; they're recreated by `expo prebuild`. |
| [`scripts/`](../scripts/) | Shell scripts. `ota.sh` is the OTA-publish wrapper — never bypass it. |
| [`assets/`](../assets/) | Icons, splash, fonts, in-app images. |

## Navigation

**Library:** [React Navigation v7](https://reactnavigation.org), specifically `@react-navigation/native-stack` and `@react-navigation/material-top-tabs`.

The routing tree:

- **Root:** native stack in [`AppNavigator.tsx`](../src/navigation/AppNavigator.tsx)
- **Branches** (one of these is mounted at a time, based on auth state):
  - **Unauthenticated:** Auth, MobileSignIn, MobileVerify, AccountNotFound, MigrationVerify
  - **Password-setup pending:** MigrationWelcome, SetPassword
  - **Onboarding:** OnboardingScreen (course selection)
  - **Main:** [`TabNavigator`](../src/navigation/TabNavigator.tsx) + ~24 modal/stack screens (CheckIn, DailyInsight, Lessons, Pairs, Groups, MHFR, Account, etc.)
- **Tabs** (inside Main):
  - **MyPulse** — personal dashboard
  - **Pulse** — sub-tabbed (GlobalPulse / MyPairs / Groups), via [`PulseNavigator.tsx`](../src/navigation/PulseNavigator.tsx)
  - **Get Support** — crisis routes

**All route params are typed** in [`src/types/navigation.ts`](../src/types/navigation.ts) (`RootStackParamList`, `MainTabParamList`).

### Non-obvious bits

- **Auto-push CheckIn modal**: `AppNavigator` watches whether the user has checked in today and pushes the CheckIn screen automatically if not. The check lives near the top of [`AppNavigator.tsx`](../src/navigation/AppNavigator.tsx).
- **Pending lesson handoff**: when a notification or deep link wants to drop the user into a specific lesson, the target is stashed in SecureStore via [`pendingLesson.ts`](../src/navigation/pendingLesson.ts) (`peek` and `consume`). The navigator picks it up when ready. This avoids race conditions between "auth is ready" and "navigator is mounted".
- **Password-setup gate**: persisted in SecureStore via [`pendingPasswordSetup.ts`](../src/navigation/pendingPasswordSetup.ts) so a user who signs up with a magic-link doesn't get stuck in the password screen if they kill the app mid-flow.

## State

**No Redux. No Zustand (despite it being in `package.json` — it's vestigial). No React Query.**

Instead:

- **React Contexts** for cross-screen state (auth, current check-in, course progress, notifications)
- **A hand-rolled fetch cache** ([`src/lib/fetchCache.ts`](../src/lib/fetchCache.ts)) for HTTP response caching with TTLs

This is unusual for a project this size, but it's deliberate: the app is small enough that an explicit `if (cache hit) return cached else fetch` flow is more readable than a query-library DSL, and we don't have stale-while-revalidate / mutation requirements that justify React Query's bundle weight.

### The `fetchCache` pattern

```ts
import { fetchCache, CACHE_KEYS, TTL } from '../lib/fetchCache';

const data = await fetchCache.getOrFetch(
  CACHE_KEYS.PAIRS,
  () => api.pairs.list(),
  TTL.MEDIUM,
);
```

- Backed by a single in-memory `Map`
- Default TTL is 45 seconds
- **Foreground invalidation is smart**: on app resume, only high-churn keys (`USER`, `GLOBAL_PULSE`, `RUNNING_STATS`) are cleared. Low-churn keys (`PAIRS`, `GROUPS`, `ENROLLMENT`) survive resumes.
- Cleared entirely on logout via `resetRuntime` (see below).

### The auth context

[`src/contexts/AuthContext.tsx`](../src/contexts/AuthContext.tsx) holds:

- The current user (`id`, `email`, `name`, `avatar`, `timezone`, `accessTier`, `pairs[]`, `groups[]`, `onboardingComplete`, `isMHFR`, `reminders`)
- All auth methods: `login`, `signup`, `loginWithApple`, `loginWithMicrosoft`, `logout`, `deleteAccount`
- Token lifecycle (via `tokenStore` in [`src/api/client.ts`](../src/api/client.ts))

**Non-obvious:** `AuthContext` exports `_setUser` (underscore-prefixed) for `CheckInContext` to use when a check-in mutates the user's current-emotion state. This is intentional — leave it as-is.

## API layer

**Backend:** Xano. Instance `xdny-scc5-yag9`, canonical API `LmTnxskw`.

### Routing has two axes

This trips everyone up at first:

1. **Data source** (HTTP header `x-data-source`): `test` | `staging` | `live` — picks which **data** the backend uses.
2. **API branch** (URL suffix `:staging`): controls which **API definitions** the request hits. Set by `__DEV__`: dev gets `:staging`, prod/preview hit the main branch.

See [Environments](./03-environments.md) for the full story. Both are decided at module load in [`src/api/client.ts`](../src/api/client.ts).

### File layout

Each resource is a module exporting typed functions:

- [`auth.ts`](../src/api/auth.ts) — login, signup, SSO, password reset, migration
- [`users.ts`, `user.ts`](../src/api/) — profile get/update, delete account
- [`checkins.ts`](../src/api/checkins.ts) — create, get, timeline, emotion details
- [`pairs.ts`, `pairInvite.ts`](../src/api/) — invite, accept, manage
- [`groups.ts`](../src/api/groups.ts) — get_all, create, invite, profile
- [`support.ts`](../src/api/support.ts) — support requests, risk assessment, MHFR
- [`courses.ts`](../src/api/courses.ts) — enrollments, lessons, progress
- [`emotions.ts`](../src/api/emotions.ts) — state coordinates, emotion list
- [`notifications.ts`](../src/api/notifications.ts) — get, mark read
- [`runningStats.ts`](../src/api/runningStats.ts) — weekly/period stats
- [`onesignal.ts`](../src/api/onesignal.ts) — push subscription ID sync
- [`onboarding.ts`](../src/api/onboarding.ts) — complete onboarding
- [`types.ts`](../src/api/types.ts) — Xano response types

### Token storage

Tokens live in `expo-secure-store` (iOS Keychain / Android Keystore), with an in-memory fallback if storage is unavailable. Every SecureStore call is wrapped in try/catch — iOS keychains can be locked, Android keystores can corrupt after OS updates. The worst case is the user has to log in again next launch.

### Auth-expired handling

If a request with a Bearer token returns 401 or 403, [`client.ts`](../src/api/client.ts) clears the token and fires `onAuthExpired`. `AuthContext` registers a handler that drops the UI back to the Auth screen and triggers `resetRuntime`.

### Retries

GET requests with 5xx or network errors retry up to 2 times with 1s / 2s backoff. **POST / PUT / PATCH / DELETE never retry** — we don't want to accidentally create a check-in twice.

## Design system

See [`DESIGN_SYSTEM.md`](../DESIGN_SYSTEM.md) at the repo root for the canonical tokens (colours, fonts, spacing, border radii). The short version:

- **Source of truth:** [`src/theme/index.ts`](../src/theme/index.ts)
- **Never hard-code** hex values, font names, or spacing numbers. Pull from `theme`.
- **Component library:** [`src/components/`](../src/components/) — `Button`, `Avatar`, `EmotionBadge`, `EngagementScore`, `ConfirmModal`, `PhoneInput`, `BottomSheet`, etc.
- **Styling approach:** Nativewind (Tailwind for RN) is the default. Use the `className` prop. For values that come from theme tokens (e.g. dynamic colours), use `StyleSheet.create` with token imports.
- **Icons:** `lucide-react-native`. Always pass `color={colors.X}` from theme; never hard-code.

### Always use the `BottomSheet` primitive

For any slide-up sheet (filters, pickers, confirmations, info overlays), reach for [`src/components/BottomSheet.tsx`](../src/components/BottomSheet.tsx). It handles the fade/slide animation, swipe-to-dismiss, keyboard avoidance, and safe-area padding. **Never re-roll your own** — animation differences between sheets make the app feel jittery.

## Cross-cutting concerns

### Logging

[`src/lib/logger.ts`](../src/lib/logger.ts). Use `logger.log / debug / warn / error` — never raw `console.*`.

- `log` / `debug` / `warn` are stripped in production
- `error` always fires (and is captured by Sentry)
- Tag your logs: `logger.log('[Auth] login ok')`

### Analytics

[`src/lib/analytics.ts`](../src/lib/analytics.ts) — wraps Amplitude. Lazy-loads the native module so Expo Go doesn't crash. Identification happens on login; events are fired from [`src/lib/analyticsEvents.ts`](../src/lib/analyticsEvents.ts).

- User IDs are prefixed `user_` (Amplitude requires >5 chars)
- Only the email domain is logged, never the full address
- Production builds use the production Amplitude project; everything else uses staging

### Push notifications

[`src/lib/onesignalApi.ts`](../src/lib/onesignalApi.ts) + the [`PushPrimer`](../src/components/PushPrimer.tsx) component (a soft prompt shown once per install before the OS prompt). Initialized in `App.tsx`, lazy-loaded for Expo Go safety.

### In-app support

[`src/lib/intercom.ts`](../src/lib/intercom.ts) — identifies the user on login, logs out on signout. The Intercom native session survives JS reloads, so **explicit logout is required** on user sign-out.

### Crash reporting

Sentry is initialized in `App.tsx` and runs only in production builds. 1% session replay, 100% on errors. Text/images/vectors are masked.

### Clean logout — `resetRuntime`

[`src/lib/resetRuntime.ts`](../src/lib/resetRuntime.ts) is the **canonical "fully sign out"**. It:

1. Clears OneSignal external user ID + push subscription
2. Logs out Intercom
3. Resets Amplitude user
4. Clears SecureStore (token + flags)
5. Clears the in-memory fetch cache
6. Triggers `Updates.reloadAsync()` (or `DevSettings.reload()` in dev) to reload the JS bundle

**Don't try to do partial cleanup yourself on logout.** Call `resetRuntime`. Forgetting one of those steps is the source of every "logged out but still got a push" or "Intercom thinks I'm the old user" bug.

## Testing

Currently minimal — Jest with `jest-expo`, two test files ([`src/__tests__/theme.test.ts`](../src/__tests__/theme.test.ts), [`src/__tests__/logger.test.ts`](../src/__tests__/logger.test.ts)).

No E2E. Verification is manual: build a dev client, click through the flow.

If you add code, please add tests where they're cheap to write — pure utilities, theme tokens, validation. Don't try to mock the entire navigation tree.

## Where to look next

- [Environments](./03-environments.md) — `EXPO_PUBLIC_*` vars and the data-source guardrails
- [Services](./04-services.md) — third-party integrations with their gotchas
- [`CLAUDE.md`](../CLAUDE.md) — the AI assistant's playbook (Linear, OTA, Teams)
