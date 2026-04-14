import { request } from './client';
import type {
  XanoCheckInCreateResponse,
  XanoCheckInsPage,
  XanoTimelineCheckIn,
  XanoGlobalPulse,
} from './types';

export const checkIns = {
  create: (emotionId: number, coordinateId: number, relatedSupportRequestId?: number, checkinView?: 'slider' | 'grid') =>
    request<XanoCheckInCreateResponse>('POST', '/checkins/create', {
      emotion_id: emotionId,
      coordinate_id: coordinateId,
      ...(relatedSupportRequestId !== undefined ? { related_support_request_id: relatedSupportRequestId } : {}),
      checkin_view: checkinView ?? 'slider',
    }),

  getAll: (page: number = 1) =>
    request<XanoCheckInsPage>('GET', '/checkins/get_all', { page }),

  getTimeline: (startDate: string, endDate: string) =>
    request<XanoTimelineCheckIn[]>('GET', '/checkins/get_timeline', { start_date: startDate, end_date: endDate }),

  getGlobalPulse: () =>
    request<XanoGlobalPulse[]>('GET', '/checkins/get_global_pulse'),
};
