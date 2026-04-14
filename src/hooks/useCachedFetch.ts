import { useCallback, useRef } from 'react';
import { isFresh, markFresh, DEFAULT_CACHE_TTL } from '../lib/fetchCache';

/**
 * Wraps an async fetcher with a module-level cache (see `lib/fetchCache`).
 *
 * - `fetch()` runs the fetcher only if the cache entry is stale.
 * - `forceFetch()` always runs the fetcher and refreshes the entry.
 *
 * Use this when multiple screens need the same data but should not re-fetch
 * on every mount (pairs, check-ins, enrollments, etc.).
 */
export function useCachedFetch(
  cacheKey: string,
  fetchFn: () => Promise<void>,
  ttlMs: number = DEFAULT_CACHE_TTL,
) {
  const fetchingRef = useRef(false);
  // Use a ref so the fetch/forceFetch callbacks don't change when fetchFn changes
  const fetchFnRef = useRef(fetchFn);
  fetchFnRef.current = fetchFn;

  const fetch = useCallback(async () => {
    if (isFresh(cacheKey, ttlMs) || fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      await fetchFnRef.current();
      markFresh(cacheKey);
    } finally {
      fetchingRef.current = false;
    }
  }, [cacheKey, ttlMs]);

  const forceFetch = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      await fetchFnRef.current();
      markFresh(cacheKey);
    } finally {
      fetchingRef.current = false;
    }
  }, [cacheKey]);

  return { fetch, forceFetch };
}
