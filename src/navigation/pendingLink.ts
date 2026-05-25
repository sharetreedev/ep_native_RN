import * as SecureStore from 'expo-secure-store';
import { logger } from '../lib/logger';

/**
 * Generic pending deep-link storage.
 *
 * When a Universal Link / deep link arrives and the user is not yet
 * authenticated, the full URL is saved here. After auth succeeds,
 * AppNavigator consumes the pending link and routes the user to the
 * originally-requested screen.
 *
 * This is separate from `pendingLesson.ts`, which handles a specific
 * onboarding-to-lesson handoff using typed lesson data. This module
 * handles raw URL strings for any deep link path.
 */

const STORAGE_KEY = 'pending_deep_link';

// In-memory mirror so `peekPendingLink()` can answer synchronously.
let cached: string | null = null;
let hydrated = false;
let hydrationPromise: Promise<void> | null = null;

async function hydrate(): Promise<void> {
  if (hydrated) return;
  if (hydrationPromise) return hydrationPromise;
  hydrationPromise = (async () => {
    try {
      const raw = await SecureStore.getItemAsync(STORAGE_KEY);
      if (raw) cached = raw;
    } catch (e) {
      logger.warn('[pendingLink] hydrate failed:', e);
    } finally {
      hydrated = true;
      hydrationPromise = null;
    }
  })();
  return hydrationPromise;
}

// Eager hydration — same pattern as pendingLesson.ts
hydrate();

/** Ensure the in-memory cache is populated from SecureStore. */
export function hydratePendingLink(): Promise<void> {
  return hydrate();
}

/**
 * Store a deep-link URL to be consumed after authentication.
 * Pass `null` to clear without consuming.
 */
export async function setPendingLink(url: string | null): Promise<void> {
  cached = url;
  hydrated = true;
  try {
    if (url) {
      await SecureStore.setItemAsync(STORAGE_KEY, url);
    } else {
      await SecureStore.deleteItemAsync(STORAGE_KEY);
    }
  } catch (e) {
    logger.warn('[pendingLink] persist failed:', e);
  }
}

/** Synchronous peek — returns the cached URL without clearing it. */
export function peekPendingLink(): string | null {
  return cached;
}

/**
 * Read and clear the pending link (consume-once semantics).
 * Returns the URL string, or `null` if nothing was pending.
 */
export async function consumePendingLink(): Promise<string | null> {
  await hydrate();
  const url = cached;
  if (!url) return null;
  cached = null;
  try {
    await SecureStore.deleteItemAsync(STORAGE_KEY);
  } catch (e) {
    logger.warn('[pendingLink] clear failed:', e);
  }
  return url;
}
