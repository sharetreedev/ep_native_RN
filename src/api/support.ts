import { request } from './client';
import type { XanoSupportRequest } from './types';

export const supportRequests = {
  getAll: () =>
    request<XanoSupportRequest[]>('GET', '/support_request/get_all'),

  getMHFRRequests: (status?: 'OPEN' | 'RESOLVED') =>
    request<XanoSupportRequest[]>('GET', '/support_requests/get_mhfr_requests', status ? { status } : undefined),

  create: (usersId: number, triggerCheckinId: number) =>
    request<XanoSupportRequest>('POST', '/support_request/create', {
      users_id: usersId,
      trigger_Checkin_id: triggerCheckinId,
    }),

  patch: (incidentLogsId: number, body: Record<string, unknown>) =>
    request<{ incident_logs: XanoSupportRequest; notify_mhfr: string }>(
      'PATCH',
      `/support_request/${incidentLogsId}`,
      body,
    ),
};
