import { useState, useCallback } from 'react';

interface UseAsyncHandlerResult {
  isLoading: boolean;
  error: string | null;
  wrap: <T>(fn: () => Promise<T>) => Promise<T | null>;
}

// Retry belongs in the HTTP client (`src/api/client.ts`), which correctly
// only retries idempotent methods. Historically this hook added its own
// retry loop on top, which silently double-fired POSTs on timeout/5xx —
// duplicating check-ins, creating duplicate support-request appends, etc.
// Do not reintroduce retry here.

/**
 * Shared loading/error wrapper for async operations in hooks.
 *
 * `wrap(() => fetcher())` sets loading, runs the fetcher, captures any error,
 * clears loading, and returns the resolved value or `null` on failure.
 */
export function useAsyncHandler({ initialLoading = false }: { initialLoading?: boolean } = {}): UseAsyncHandlerResult {
  const [isLoading, setLoading] = useState(initialLoading);
  const [error, setError] = useState<string | null>(null);

  const wrap = useCallback(async <T>(fn: () => Promise<T>): Promise<T | null> => {
    setLoading(true);
    setError(null);
    try {
      return await fn();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { isLoading, error, wrap };
}
