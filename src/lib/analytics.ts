/**
 * Amplitude analytics — Phase 1: init + environment routing + identification.
 *
 * Modelled on `src/lib/intercom.ts`: the native module doesn't exist on web or
 * in Expo Go, so it's required lazily and every call no-ops if it's absent or
 * if Amplitude was never initialised (missing API key). Analytics must never
 * block app start.
 *
 * Per the implementation brief (emotional-pulse-amplitude-mobile-implementation-brief.md):
 *
 *  - Production and staging are SEPARATE Amplitude projects with SEPARATE keys.
 *    We do NOT tag events with an `environment` property. The prod/staging
 *    split reuses the app's existing, already-guarded `DATA_SOURCE` axis
 *    (src/api/client.ts): only a `live` non-dev build is production; preview
 *    (`staging`), dev (`test`) and Expo Go (`__DEV__`) all use the staging key.
 *  - User IDs MUST be prefixed `user_`. Amplitude silently drops user IDs < 5
 *    chars; a bare Xano id ("3916") is 4 chars and would fail the whole
 *    identify call plus any events batched with it.
 *  - No content ever leaves via analytics: only the email DOMAIN (never the
 *    full address), IDs, booleans and categorical types.
 *
 * Events (Phase 2) are intentionally NOT wired here yet — the brief requires
 * identification to be verified in Amplitude first, and the exact per-event
 * properties live in the spec doc. They'll go in a typed events module.
 *
 * NOTE: ships native code; SDK bumps need a fresh EAS build, not an OTA.
 */
import { Platform } from 'react-native';
import { logger } from './logger';
import { DATA_SOURCE } from '../api/client';

type AmplitudeModule = typeof import('@amplitude/analytics-react-native');

let amplitude: AmplitudeModule | null = null;
let initialised = false;

if (Platform.OS !== 'web') {
  try {
    amplitude = require('@amplitude/analytics-react-native');
  } catch (e) {
    logger.warn('[Amplitude] Native module not available (Expo Go?):', e);
  }
}

/**
 * Only a live, non-dev build talks to the production Amplitude project.
 * Everything else (preview `staging`, dev `test`, Expo Go / `__DEV__`) uses
 * the staging project. Mirrors the `__DEV__ || isStagingBuild` rule in the
 * brief, expressed via the app's existing environment axis.
 */
const isProduction = !__DEV__ && DATA_SOURCE === 'live';

/**
 * Initialise the Amplitude client. Call once, early, from `App.tsx`.
 * No-ops (with a warning) if the relevant API key env var is missing so
 * analytics never blocks startup.
 */
export function initAnalytics(): void {
  if (!amplitude || initialised) return;
  const apiKey = isProduction
    ? process.env.EXPO_PUBLIC_AMPLITUDE_KEY_PRODUCTION
    : process.env.EXPO_PUBLIC_AMPLITUDE_KEY_STAGING;
  if (!apiKey) {
    logger.warn(
      `[Amplitude] ${isProduction ? 'EXPO_PUBLIC_AMPLITUDE_KEY_PRODUCTION' : 'EXPO_PUBLIC_AMPLITUDE_KEY_STAGING'} not set — analytics disabled`,
    );
    return;
  }
  try {
    // The brief's `defaultTracking: { sessions, appLifecycles, deepLinks,
    // screenViews }` is Browser-SDK syntax — the React Native SDK has no such
    // option. `trackingSessionEvents` is the faithful RN equivalent of
    // `sessions: true`; appLifecycles/deepLinks/screenViews have no RN analog
    // (RN has no auto screen-view tracking at all). This is a deliberate,
    // documented divergence from the brief — flagged to Maurice for the spec.
    amplitude.init(apiKey, undefined, { trackingSessionEvents: true });
    initialised = true;
  } catch (e) {
    logger.warn('[Amplitude] init failed:', e);
  }
}

/** The minimal user data Amplitude identification needs. Mapped from `User`
 *  at the call site so this module stays a leaf (no contexts import). */
export interface AnalyticsIdentity {
  /** Raw Xano integer id — used both for the `user_`-prefixed Amplitude user
   *  id and the `xano_user_id` property (raw, for cross-referencing). */
  xanoUserId: number;
  /** Full email — ONLY the domain is ever sent to Amplitude. */
  email: string;
  /** Xano `created_at`, passed through for web parity. Null if unknown. */
  signupDate: number | null;
  /** Xano `access` tier; falls back to 'unknown'. */
  planType: string;
  /** Length of the user's active pairs collection. */
  pairCount: number;
  /** Active group ids. */
  groupIds: number[];
}

/**
 * Associate subsequent events with the signed-in user and set the six user
 * properties. Call after auth succeeds (login / signup / session restore) and
 * on every app foreground so `pair_count` / `group_ids` stay current.
 */
export function identifyAnalyticsUser(u: AnalyticsIdentity): void {
  if (!amplitude || !initialised) return;
  try {
    // `user_` prefix: clears Amplitude's undocumented 5-char minimum (a bare
    // 4-digit Xano id silently fails identify + batched events). Brief trap #1.
    amplitude.setUserId('user_' + String(u.xanoUserId));
    const id = new amplitude.Identify();
    // Domain only — the full address is content and never leaves the system.
    id.set('email_domain', u.email.includes('@') ? u.email.split('@')[1] : 'unknown');
    if (u.signupDate != null) id.set('signup_date', u.signupDate);
    id.set('plan_type', u.planType || 'unknown');
    id.set('pair_count', u.pairCount);
    id.set('group_ids', u.groupIds);
    id.set('xano_user_id', u.xanoUserId);
    amplitude.identify(id);
  } catch (e) {
    logger.warn('[Amplitude] identify failed:', e);
  }
}

/**
 * Low-level event track. NOT for direct use from screens — go through the
 * typed wrappers in `analyticsEvents.ts` so event/property names are checked
 * at compile time (a raw-string typo silently creates a phantom Amplitude
 * event that nobody notices for weeks — see the implementation brief).
 */
export function trackAnalyticsEvent(name: string, properties?: Record<string, unknown>): void {
  if (!amplitude || !initialised) return;
  try {
    amplitude.track(name, properties);
  } catch (e) {
    logger.warn('[Amplitude] track failed:', e);
  }
}

/** Clear the Amplitude identity (new user/device). Call from the logout /
 *  runtime-reset path so the next user doesn't inherit this identity. */
export function resetAnalytics(): void {
  if (!amplitude || !initialised) return;
  try {
    amplitude.reset();
  } catch (e) {
    logger.warn('[Amplitude] reset failed:', e);
  }
}
