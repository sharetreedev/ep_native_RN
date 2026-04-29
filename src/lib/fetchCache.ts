import { AppState } from 'react-native';

const cache = new Map<string, number>();

export const DEFAULT_CACHE_TTL = 45_000; // 45 seconds

export const CACHE_KEYS = {
  USER: 'user',
  PAIRS: 'pairs',
  GROUPS: 'groups',
  ENROLLMENT: 'enrollment',
  GLOBAL_PULSE: 'globalPulse',
  RUNNING_STATS: 'runningStats',
} as const;

// Keys that are refreshed when the app returns to foreground. Previously we
// called `cache.clear()` wholesale on every foreground event, which killed
// the 45s TTL entirely — every resume triggered a full refetch of everything,
// including low-churn data like pairs/groups/enrollment. The list below is
// restricted to data that actually changes mid-session (the user's own
// check-in state and the global pulse), so short background→foreground
// transitions no longer thrash the network.
const FOREGROUND_INVALIDATE_KEYS: readonly string[] = [
  CACHE_KEYS.USER,
  CACHE_KEYS.GLOBAL_PULSE,
  CACHE_KEYS.RUNNING_STATS,
];

AppState.addEventListener('change', (state) => {
  if (state !== 'active') return;
  for (const key of FOREGROUND_INVALIDATE_KEYS) cache.delete(key);
});

export function isFresh(key: string, ttlMs: number = DEFAULT_CACHE_TTL): boolean {
  const ts = cache.get(key);
  if (ts == null) return false;
  return Date.now() - ts < ttlMs;
}

export function markFresh(key: string): void {
  cache.set(key, Date.now());
}

export function invalidate(...keys: string[]): void {
  for (const key of keys) cache.delete(key);
}

export function invalidateAll(): void {
  cache.clear();
}
