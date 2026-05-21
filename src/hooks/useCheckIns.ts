import { useState, useCallback } from 'react';
import { checkIns as xanoCheckIns, XanoTimelineCheckIn } from '../api';
import { MappedEmotion } from './useEmotionStates';
import { useAsyncHandler } from './useAsyncHandler';
import { invalidate, CACHE_KEYS } from '../lib/fetchCache';
import { logger } from '../lib/logger';
import { trackCheckInCompleted } from '../lib/analyticsEvents';
export type { XanoTimelineCheckIn };

/**
 * Check-in write + timeline read helpers for the current user.
 *
 * Creating a check-in invalidates user and global-pulse caches so the next
 * focus-driven refetch picks up fresh data.
 */
export function useCheckIns() {
  const { isLoading, error, wrap } = useAsyncHandler();

  const createCheckIn = useCallback(async (
    emotion: MappedEmotion,
    coordinateId: number,
    checkinView?: 'slider' | 'grid',
  ) => {
    if (!coordinateId && coordinateId !== 0) {
      logger.warn('[useCheckIns] Missing coordinateId — skipping check-in');
      return null;
    }
    const result = await wrap(() => xanoCheckIns.create(emotion.xanoId, coordinateId, checkinView));
    if (result) {
      invalidate(CACHE_KEYS.USER, CACHE_KEYS.GLOBAL_PULSE);
      // Single chokepoint for every check-in path — fires only after the
      // Xano write succeeds (brief: never on button press). Spec: the only
      // property is check_in_type (the brief's needs_attention is not in spec).
      trackCheckInCompleted({ check_in_type: checkinView ?? 'slider' });
      return result.checkin_id;
    }
    return null;
  }, [wrap]);

  const [timeline, setTimeline] = useState<XanoTimelineCheckIn[]>([]);

  const fetchTimeline = useCallback(async (startDate: string, endDate: string) => {
    const data = await wrap(() => xanoCheckIns.getTimeline(startDate, endDate));
    if (data) {
      setTimeline(data);
    }
  }, [wrap]);

  return {
    timeline,
    isLoading,
    error,
    fetchTimeline,
    createCheckIn,
  };
}
