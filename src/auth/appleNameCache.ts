import * as SecureStore from 'expo-secure-store';
import { logger } from '../lib/logger';

// Apple Sign-In delivers `fullName` (givenName/familyName) and `email` exactly
// ONCE — on the user's first authorization for this app. Every subsequent
// credential.fullName comes back null. If our backend call fails right after
// Apple has burned its one-shot delivery, the name is gone forever unless we
// stash it locally.
//
// We cache by Apple's stable user id (credential.user, aka the JWT `sub`) so
// retries on the same device merge the cached name back in. Cleared once we've
// confirmed the user record actually carries a firstName.
const STORAGE_KEY_PREFIX = 'apple_name_cache_v1:';

export interface AppleNameCacheEntry {
  firstName?: string;
  lastName?: string;
}

function keyFor(appleUserId: string): string {
  return `${STORAGE_KEY_PREFIX}${appleUserId}`;
}

export async function readAppleNameCache(
  appleUserId: string | null | undefined,
): Promise<AppleNameCacheEntry | null> {
  if (!appleUserId) return null;
  try {
    const raw = await SecureStore.getItemAsync(keyFor(appleUserId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const firstName = typeof parsed?.firstName === 'string' ? parsed.firstName : undefined;
    const lastName = typeof parsed?.lastName === 'string' ? parsed.lastName : undefined;
    if (!firstName && !lastName) return null;
    return { firstName, lastName };
  } catch (e) {
    logger.warn('[appleNameCache] read failed:', e);
    return null;
  }
}

export async function writeAppleNameCache(
  appleUserId: string | null | undefined,
  entry: AppleNameCacheEntry,
): Promise<void> {
  if (!appleUserId) return;
  const firstName = entry.firstName?.trim() || undefined;
  const lastName = entry.lastName?.trim() || undefined;
  if (!firstName && !lastName) return;
  try {
    await SecureStore.setItemAsync(
      keyFor(appleUserId),
      JSON.stringify({ firstName, lastName }),
    );
  } catch (e) {
    logger.warn('[appleNameCache] write failed:', e);
  }
}

export async function clearAppleNameCache(
  appleUserId: string | null | undefined,
): Promise<void> {
  if (!appleUserId) return;
  try {
    await SecureStore.deleteItemAsync(keyFor(appleUserId));
  } catch (e) {
    logger.warn('[appleNameCache] clear failed:', e);
  }
}
