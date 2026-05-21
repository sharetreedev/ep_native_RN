import * as SecureStore from 'expo-secure-store';
import { logger } from '../lib/logger';

// Durable "this freshly-migrated user still has to set a new password" flag.
// Mirrors pendingLesson.ts: persisted in SecureStore so the gate survives a
// cold launch (user kills the app on the Welcome / Set-password screen, comes
// back still authenticated but without a usable password). Consumed only once
// the new password has actually been saved.
const STORAGE_KEY = 'pending_password_setup_v1';

let cached = false;
let hydrated = false;
let hydrationPromise: Promise<void> | null = null;

async function hydrate(): Promise<void> {
  if (hydrated) return;
  if (hydrationPromise) return hydrationPromise;
  hydrationPromise = (async () => {
    try {
      const raw = await SecureStore.getItemAsync(STORAGE_KEY);
      cached = raw === '1';
    } catch (e) {
      logger.warn('[pendingPasswordSetup] hydrate failed:', e);
    } finally {
      hydrated = true;
      hydrationPromise = null;
    }
  })();
  return hydrationPromise;
}

hydrate();

export function hydratePendingPasswordSetup(): Promise<void> {
  return hydrate();
}

export async function setPendingPasswordSetup(value: boolean): Promise<void> {
  cached = value;
  hydrated = true;
  try {
    if (value) {
      await SecureStore.setItemAsync(STORAGE_KEY, '1');
    } else {
      await SecureStore.deleteItemAsync(STORAGE_KEY);
    }
  } catch (e) {
    logger.warn('[pendingPasswordSetup] persist failed:', e);
  }
}

export function peekPendingPasswordSetup(): boolean {
  return cached;
}
