import { request } from './client';
import type {
  XanoCheckInCreateResponse,
  XanoTimelineCheckIn,
  XanoGlobalPulse,
} from './types';

export const checkIns = {
  create: (emotionId: number, coordinateId: number, checkinView?: 'slider' | 'grid') =>
    request<XanoCheckInCreateResponse>('POST', '/checkins/create', {
      emotion_id: emotionId,
      coordinate_id: coordinateId,
      checkin_view: checkinView ?? 'slider',
    }),

  getTimeline: (startDate: string, endDate: string) =>
    request<XanoTimelineCheckIn[]>('GET', '/checkins/get_timeline', { start_date: startDate, end_date: endDate }),

  getGlobalPulse: () =>
    request<XanoGlobalPulse[]>('GET', '/checkins/get_global_pulse'),
};
