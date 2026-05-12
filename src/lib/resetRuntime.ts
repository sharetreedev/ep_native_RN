import * as SecureStore from 'expo-secure-store';
import * as Updates from 'expo-updates';
import { tokenStore } from '../api/client';
import { invalidateAll } from './fetchCache';
import { logger } from './logger';

// SecureStore keys that hold per-user UI state ("have you seen this primer?",
// "have you dismissed this promo?") and should be cleared whenever the user
// identity changes. Token key is handled separately via tokenStore.clear()
// because we sometimes want to preserve the token (e.g. account merge —
// same session, new identity bound server-side).
//
// Intentionally excluded: `mypulse_version` is a per-device preference
// (the device has been opted into v2), not a per-user one, so it survives.
const USER_SCOPED_SECURE_KEYS: readonly string[] = [
  'push_primer_shown_v1',
  'mypulse_v2_promo_dismissed_v1',
];

// Subscriber for the splash overlay. The splash component registers a single
// listener on mount; `resetAndReload` pushes visibility/message changes to it
// before tearing down state. We use a module-level callback instead of React
// context so the reset can be triggered from anywhere (including inside other
// contexts) without provider-ordering gymnastics.
type SplashState = { visible: boolean; message: string };
let splashListener: ((state: SplashState) => void) | null = null;

export function subscribeRuntimeReset(cb: (state: SplashState) => void): () => void {
  splashListener = cb;
  return () => {
    splashListener = null;
  };
}

export type ResetReason = 'logout' | 'delete' | 'merge';

export interface ResetOptions {
  /** Message shown on the full-screen splash while the reload happens. */
  message: string;
  /** Wipe the auth token. True for logout/delete, false for merge (the token
   *  is still valid — the server-side merge re-binds it to the merged-into
   *  account, and a logout-style clear here would force the user to sign in
   *  again immediately after the merge). */
  clearAuthToken: boolean;
  /** Disassociate the device from the current user in OneSignal. True for
   *  logout/delete; false for merge (same device, new identity — let the
   *  next launch re-associate naturally via /auth/me). */
  onesignalLogout: boolean;
}

async function clearUserScopedSecureStore(): Promise<void> {
  await Promise.all(
    USER_SCOPED_SECURE_KEYS.map((k) =>
      SecureStore.deleteItemAsync(k).catch((e) => {
        // Non-fatal — worst case the user sees the primer twice.
        logger.warn(`[resetRuntime] failed to clear ${k}:`, e);
      }),
    ),
  );
}

function tryOneSignalLogout(): void {
  try {
    // Required at runtime — OneSignal native module isn't available in Expo Go.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { OneSignal } = require('react-native-onesignal');
    OneSignal.logout();
  } catch (e) {
    logger.warn('[resetRuntime] OneSignal logout failed:', e);
  }
}

/**
 * Tear down all per-user state and restart the JS runtime so no module-scope
 * singletons, in-flight fetches, context state, or third-party caches can
 * survive into the next session. This is the bulletproof equivalent of a
 * manual "clear everything" pass — guaranteed by construction, not discipline.
 *
 * Flow:
 *  1. Show the splash overlay with the caller's message.
 *  2. Brief pause so the splash actually paints before we tear down.
 *  3. OneSignal logout (if requested), invalidate in-memory cache, wipe
 *     user-scoped SecureStore keys, clear the auth token (if requested).
 *  4. Reload the JS runtime (`Updates.reloadAsync` in production, `DevSettings.reload`
 *     in dev). The JS bundle re-boots; all module/context state is fresh.
 *
 * If the reload itself throws (Expo Go without dev-settings reload available),
 * we hide the splash and re-throw so the caller can fall back to a manual
 * state reset.
 */
export async function resetAndReload(opts: ResetOptions): Promise<void> {
  splashListener?.({ visible: true, message: opts.message });

  // Let the splash render a frame before we start work. ~200ms is enough for
  // the fade-in to be visible but short enough not to feel laggy.
  await new Promise((r) => setTimeout(r, 200));

  if (opts.onesignalLogout) tryOneSignalLogout();
  invalidateAll();
  await clearUserScopedSecureStore();
  if (opts.clearAuthToken) await tokenStore.clear();

  // A tiny additional pause so the splash isn't replaced by a blank
  // half-rendered frame during the reload.
  await new Promise((r) => setTimeout(r, 100));

  // Only `Updates.reloadAsync` is safe under the new architecture — it tears
  // down the runtime cleanly. `DevSettings.reload()` segfaults in Expo Go +
  // Fabric (ShadowTreeRegistry vs. Hermes teardown race). When reload isn't
  // available (Expo Go without expo-updates configured), we hide the splash
  // and re-throw so the caller can fall through to a manual local reset.
  try {
    await Updates.reloadAsync();
  } catch (e) {
    logger.warn('[resetRuntime] reload unavailable, falling back:', e);
    splashListener?.({ visible: false, message: '' });
    throw e;
  }
}
