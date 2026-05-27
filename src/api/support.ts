import { request } from './client';
import type { XanoSupportRequest } from './types';
import type { Body } from './schema';

// SPEC NOTE: swagger documents most XanoSupportRequest fields but marks
// everything as optional, and the nested `requesting_user_details` is missing
// `profile_hex_colour` which several screens render. Consumers
// (SupportRequestsScreen, SupportRequestDetailsScreen, NewMHFRSupportRequestSheet,
// useThingsToDo) rely on required fields like `id`, `status`, `users_id`.
// Keep hand-rolled XanoSupportRequest for the list/create endpoints until the
// spec marks required fields and adds the missing colour.
export const supportRequests = {
  getAll: () =>
    request<XanoSupportRequest[]>('GET', '/support_request/get_all'),

  // Path is intentionally `support_requests` (plural) — confirmed against the
  // Xano OpenAPI spec for the Mobile Native API group. The singular
  // `support_request/...` paths below are a separate (older) function group
  // that wasn't renamed when this endpoint was added.
  getMHFRRequests: (status?: 'OPEN' | 'RESOLVED') =>
    request<XanoSupportRequest[]>('GET', '/support_requests/get_mhfr_requests', status ? { status } : undefined),

  create: (usersId: number, triggerCheckinId: number) =>
    request<XanoSupportRequest>('POST', '/support_request/create', {
      users_id: usersId,
      trigger_Checkin_id: triggerCheckinId,
    }),

  // PATCH response is well-defined by the spec — `{ incident_logs, notify_mhfr }` —
  // but `incident_logs` carries the same optional-fields issue as above.
  // Intersect so consumers retain the required-field guarantee on the row.
  patch: (incidentLogsId: number, body: Record<string, unknown>) =>
    request<Body<'api/support_request/{incident_logs_id}|PATCH'> & {
      incident_logs: XanoSupportRequest;
      notify_mhfr: string;
    }>(
      'PATCH',
      `/support_request/${incidentLogsId}`,
      body,
    ),
};
