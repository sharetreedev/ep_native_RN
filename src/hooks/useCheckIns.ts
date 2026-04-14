import { useState, useCallback, useMemo } from 'react';
import { checkIns as xanoCheckIns, XanoCheckIn, XanoTimelineCheckIn } from '../api';
import { MappedEmotion } from './useEmotionStates';
import { useAsyncHandler } from './useAsyncHandler';
import { invalidate, CACHE_KEYS } from '../lib/fetchCache';
import { logger } from '../lib/logger';
export type { XanoCheckIn, XanoTimelineCheckIn };

export interface CheckInRecord {
  id: string;
  emotionId: number;
  coordinateId: number;
  createdAt: string;
  userId?: string;
}

/**
 * Loads and manages the current user's emotional check-ins.
 *
 * Transforms Xano's raw check-in records into the app's internal `CheckInRecord`
 * shape and exposes helpers for fetching, refetching, creating, and resolving
 * the user's most-recent check-in.
 *
 * @param userId - Optional user ID; required by some endpoints that scope to a specific user.
 * @param emotionStates - Optional `MappedEmotion[]` used to hydrate check-ins with colour/theme metadata.
 */
export function useCheckIns(userId?: string, emotionStates?: MappedEmotion[]) {
  const [checkIns, setCheckIns] = useState<CheckInRecord[]>([]);
  const { isLoading, error, wrap } = useAsyncHandler();

  // Map xanoId → MappedEmotion for quick lookup when consumers need emotion data
  const emotionByXanoId = useMemo(() => {
    const map: Record<number, MappedEmotion> = {};
    if (emotionStates) {
      emotionStates.forEach((e) => { map[e.xanoId] = e; });
    }
    return map;
  }, [emotionStates]);

  const toCheckInRecord = useCallback((raw: XanoCheckIn): CheckInRecord => ({
    id: String(raw.id),
    emotionId: raw.emotion_id,
    coordinateId: raw.coordinate_id,
    createdAt: new Date(raw.created_at).toISOString(),
    userId: raw.user_id !== undefined ? String(raw.user_id) : undefined,
  }), []);

  const fetch = useCallback(async (page: number = 1) => {
    const data = await wrap(() => xanoCheckIns.getAll(page));
    if (data) {
      const items = data.items ?? [];
      const records = items
        .filter(c => !userId || c.user_id == null || String(c.user_id) === userId)
        .map(toCheckInRecord);
      setCheckIns(records);
    }
  }, [userId, toCheckInRecord, wrap]);

  const createCheckIn = useCallback(async (
    emotion: MappedEmotion,
    coordinateId: number,
    relatedSupportRequestId?: number,
    checkinView?: 'slider' | 'grid',
  ) => {
    if (!coordinateId && coordinateId !== 0) {
      logger.warn('[useCheckIns] Missing coordinateId — skipping check-in');
      return null;
    }
    const result = await wrap(() => xanoCheckIns.create(emotion.xanoId, coordinateId, relatedSupportRequestId, checkinView));
    if (result) {
      invalidate(CACHE_KEYS.CHECK_INS, CACHE_KEYS.USER, CACHE_KEYS.GLOBAL_PULSE);
      // API only returns checkin_id — refetch to get the full record
      await fetch();
      return result.checkin_id;
    }
    return null;
  }, [fetch, wrap]);

  const [timeline, setTimeline] = useState<XanoTimelineCheckIn[]>([]);

  const fetchTimeline = useCallback(async (startDate: string, endDate: string) => {
    const data = await wrap(() => xanoCheckIns.getTimeline(startDate, endDate));
    if (data) {
      setTimeline(data);
    }
  }, [wrap]);

  const lastCheckIn = checkIns[0] ?? null;

  return {
    checkIns,
    timeline,
    lastCheckIn,
    isLoading,
    error,
    emotionByXanoId,
    refetch: fetch,
    fetchTimeline,
    createCheckIn,
  };
}
