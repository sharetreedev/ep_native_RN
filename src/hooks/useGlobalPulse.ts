import { useState, useCallback, useEffect } from 'react';
import { checkIns as xanoCheckIns, XanoGlobalPulse } from '../api';

export function useGlobalPulse() {
  const [globalData, setGlobalData] = useState<XanoGlobalPulse[]>([]);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await xanoCheckIns.getGlobalPulse();
      setGlobalData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return {
    globalData,
    isLoading,
    error,
    refetch: fetch,
  };
}
