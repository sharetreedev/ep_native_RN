import { useCallback, useEffect, useRef } from 'react';
import { isFresh, markFresh, DEFAULT_CACHE_TTL } from '../lib/fetchCache';

/**
 * Wraps an async fetcher with a module-level cache (see `lib/fetchCache`).
 *
 * - `fetch()` runs the fetcher only if the cache entry is stale.
 * - `forceFetch()` always runs the fetcher and refreshes the entry.
 *
 * The fetcher receives an `AbortSignal` that is aborted on unmount or when a
 * new in-flight request supersedes the previous one. Forwarding the signal
 * into `request()` cancels the underlying HTTP fetch instead of letting it
 * complete in the background after the consumer has unmounted.
 *
 * Use this when multiple screens need the same data but should not re-fetch
 * on every mount (pairs, check-ins, enrollments, etc.).
 */
export function useCachedFetch(
  cacheKey: string,
  fetchFn: (signal: AbortSignal) => Promise<void>,
  ttlMs: number = DEFAULT_CACHE_TTL,
) {
  const fetchingRef = useRef(false);
  const inFlightControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);
  // The cache only tracks freshness, not data — data lives in each consumer's
  // own state. So a fresh cache from another consumer's recent fetch is not
  // enough to skip: this instance must have populated its own state at least
  // once, otherwise it's stuck rendering empty/loading forever.
  const hasFetchedThisInstance = useRef(false);
  // Use a ref so the fetch/forceFetch callbacks don't change when fetchFn changes
  const fetchFnRef = useRef(fetchFn);
  fetchFnRef.current = fetchFn;

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      inFlightControllerRef.current?.abort();
      inFlightControllerRef.current = null;
    };
  }, []);

  const runFetch = useCallback(async () => {
    // Abort any prior in-flight fetch from this instance before starting a new one
    inFlightControllerRef.current?.abort();
    const controller = new AbortController();
    inFlightControllerRef.current = controller;
    fetchingRef.current = true;
    try {
      await fetchFnRef.current(controller.signal);
      if (controller.signal.aborted) return;
      hasFetchedThisInstance.current = true;
      markFresh(cacheKey);
    } finally {
      fetchingRef.current = false;
      if (inFlightControllerRef.current === controller) {
        inFlightControllerRef.current = null;
      }
    }
  }, [cacheKey]);

  const fetch = useCallback(async () => {
    if (fetchingRef.current) return;
    if (hasFetchedThisInstance.current && isFresh(cacheKey, ttlMs)) return;
    await runFetch();
  }, [cacheKey, ttlMs, runFetch]);

  const forceFetch = useCallback(async () => {
    if (fetchingRef.current) return;
    await runFetch();
  }, [runFetch]);

  return { fetch, forceFetch };
}
