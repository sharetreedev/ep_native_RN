import { request } from './client';
import type { XanoRunningStats } from './types';

export const runningStats = {
  create: () =>
    request<XanoRunningStats>('POST', '/running_stats'),

  getById: (runningStatsId: number) =>
    request<XanoRunningStats>('GET', `/running_stats/${runningStatsId}`),

  calculate: (params: { runningStatsId: number; x: number; y: number; emotionName: string }) =>
    request<{ success: boolean }>('POST', '/running_stats/calculate', {
      runningStats_id: params.runningStatsId,
      x: params.x,
      y: params.y,
      emotion_name: params.emotionName,
    }),
};
