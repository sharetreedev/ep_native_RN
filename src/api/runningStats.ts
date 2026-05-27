import { request } from './client';
import type { XanoRunningStats } from './types';

// SPEC NOTE: swagger declares `{}` for all three endpoints — under-documented.
// Hand-rolled XanoRunningStats models the real shape (periods w1/w2/m1/m2/at,
// direction_* / shift_* comparisons, modeCheckInArray, recentCheckIns, etc.).
// `calculate` actually returns `{ success: boolean }`. Keep hand-rolled until
// the spec is fleshed out.
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
