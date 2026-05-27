import { request } from './client';
import type {
  XanoTimelineCheckIn,
  XanoGlobalPulse,
} from './types';
import type { Body } from './schema';

export const checkIns = {
  create: (emotionId: number, coordinateId: number, checkinView?: 'slider' | 'grid') =>
    request<Body<'api/checkins/create|POST'>>('POST', '/checkins/create', {
      emotion_id: emotionId,
      coordinate_id: coordinateId,
      checkin_view: checkinView ?? 'slider',
    }),

  // SPEC NOTE: swagger lists most fields but consumers (see XanoTimelineCheckIn)
  // rely on a richer shape (stateCoordinates joins, emotion_states join, etc).
  // Keep hand-rolled type until the spec is fleshed out.
  getTimeline: (startDate: string, endDate: string) =>
    request<XanoTimelineCheckIn[]>('GET', '/checkins/get_timeline', { start_date: startDate, end_date: endDate }),

  getGlobalPulse: () =>
    request<XanoGlobalPulse[]>('GET', '/checkins/get_global_pulse'),
};
