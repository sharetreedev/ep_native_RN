import { useState, useCallback } from 'react';

interface UseAsyncHandlerResult {
  isLoading: boolean;
  error: string | null;
  wrap: <T>(fn: () => Promise<T>) => Promise<T | null>;
}

export function useAsyncHandler(): UseAsyncHandlerResult {
  const [isLoading, setLoading] = useState(false);
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
