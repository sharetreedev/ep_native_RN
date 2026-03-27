import { useState, useEffect } from 'react';
import { staticData, XanoStateCoordinate } from '../api';

interface UseStateCoordinatesResult {
  coordinates: XanoStateCoordinate[];
  isLoading: boolean;
  error: string | null;
}

export function useStateCoordinates(): UseStateCoordinatesResult {
  const [coordinates, setCoordinates] = useState<XanoStateCoordinate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await staticData.getStateCoordinates();
        if (!cancelled) {
          // Flattened array sorted by order_meta
          const sorted = [...data].sort((a, b) => 
            (a.order_meta ?? 0) - (b.order_meta ?? 0)
          );
          setCoordinates(sorted);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message ?? 'Failed to load state coordinates');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return { coordinates, isLoading, error };
}
