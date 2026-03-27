const cache = new Map<string, number>();

export const DEFAULT_CACHE_TTL = 45_000; // 45 seconds

export const CACHE_KEYS = {
  USER: 'user',
  PAIRS: 'pairs',
  GROUPS: 'groups',
  CHECK_INS: 'checkIns',
  ENROLLMENT: 'enrollment',
  GLOBAL_PULSE: 'globalPulse',
} as const;

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
