import { useCallback, useRef } from 'react';
import { isFresh, markFresh, DEFAULT_CACHE_TTL } from '../lib/fetchCache';

export function useCachedFetch(
  cacheKey: string,
  fetchFn: () => Promise<void>,
  ttlMs: number = DEFAULT_CACHE_TTL,
) {
  const fetchingRef = useRef(false);

  const fetch = useCallback(async () => {
    if (isFresh(cacheKey, ttlMs) || fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      await fetchFn();
      markFresh(cacheKey);
    } finally {
      fetchingRef.current = false;
    }
  }, [cacheKey, fetchFn, ttlMs]);

  const forceFetch = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      await fetchFn();
      markFresh(cacheKey);
    } finally {
      fetchingRef.current = false;
    }
  }, [cacheKey, fetchFn]);

  return { fetch, forceFetch };
}
