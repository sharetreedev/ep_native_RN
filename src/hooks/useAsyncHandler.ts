import { useState, useCallback } from 'react';

/** Check if an error is a transient server/network issue worth retrying. */
function isRetryable(err: unknown): boolean {
  if (err && typeof err === 'object') {
    const status = (err as any).status ?? (err as any).statusCode;
    if (status && status >= 500) return true;
    const msg = (err as any).message ?? '';
    if (/network|timeout|abort|fetch failed/i.test(msg)) return true;
  }
  return false;
}

interface UseAsyncHandlerResult {
  isLoading: boolean;
  error: string | null;
  wrap: <T>(fn: () => Promise<T>) => Promise<T | null>;
}

/**
 * Shared loading/error wrapper for async operations in hooks.
 *
 * `wrap(() => fetcher())` sets loading, runs the fetcher, captures any error,
 * clears loading, and returns the resolved value or `null` on failure.
 * Prevents every data hook from re-implementing the same boilerplate.
 */
export function useAsyncHandler({ initialLoading = false }: { initialLoading?: boolean } = {}): UseAsyncHandlerResult {
  const [isLoading, setLoading] = useState(initialLoading);
  const [error, setError] = useState<string | null>(null);

  const wrap = useCallback(async <T>(fn: () => Promise<T>): Promise<T | null> => {
    setLoading(true);
    setError(null);

    const MAX_RETRIES = 2;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const result = await fn();
        setLoading(false);
        return result;
      } catch (err) {
        if (attempt < MAX_RETRIES && isRetryable(err)) {
          await new Promise((r) => setTimeout(r, (attempt + 1) * 1000));
          continue;
        }
        setError(err instanceof Error ? err.message : String(err));
        setLoading(false);
        return null;
      }
    }

    setLoading(false);
    return null;
  }, []);

  return { isLoading, error, wrap };
}
