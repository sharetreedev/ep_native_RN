import { useState, useCallback } from 'react';
import { runningStats as xanoRunningStats, XanoRunningStats } from '../api';
import { useAsyncHandler } from './useAsyncHandler';

interface UseRunningStatsResult {
  stats: XanoRunningStats | null;
  isLoading: boolean;
  error: string | null;
  fetchById: (runningStatsId: number) => Promise<void>;
  create: () => Promise<XanoRunningStats | null>;
  calculate: (params: {
    runningStatsId: number;
    x: number;
    y: number;
    emotionName: string;
  }) => Promise<boolean>;
}

export function useRunningStats(): UseRunningStatsResult {
  const [stats, setStats] = useState<XanoRunningStats | null>(null);
  const { isLoading, error, wrap } = useAsyncHandler();

  const fetchById = useCallback(async (runningStatsId: number) => {
    const data = await wrap(() => xanoRunningStats.getById(runningStatsId));
    if (data) setStats(data);
  }, [wrap]);

  const create = useCallback(async () => {
    const data = await wrap(() => xanoRunningStats.create());
    if (data) setStats(data);
    return data;
  }, [wrap]);

  const calculate = useCallback(async (params: {
    runningStatsId: number;
    x: number;
    y: number;
    emotionName: string;
  }): Promise<boolean> => {
    const result = await wrap(() => xanoRunningStats.calculate(params));
    return result?.success ?? false;
  }, [wrap]);

  return { stats, isLoading, error, fetchById, create, calculate };
}
