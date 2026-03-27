import { request } from './client';
import type { XanoPair, XanoPairsResponse, XanoPairCheckin } from './types';

export const pair = {
  checkin: (creatorId: number, recipientId: number) =>
    request<XanoPairCheckin>('POST', '/pair/checkin', { creator_id: creatorId, recipient_id: recipientId }),

  checkinReminder: (pairsUserId: number, message: string) =>
    request<{ result: string }>('POST', '/pair/checkin_reminder', { pairs_user_id: pairsUserId, message }),

  getCheckinRequests: () =>
    request<unknown[]>('GET', '/pair/get_checkin_requests'),

  getByToken: (token: string, currentUserId?: number) =>
    request<XanoPair>('GET', '/pair/get_by_token', {
      token,
      ...(currentUserId !== undefined ? { current_user_id: currentUserId } : {}),
    }),

  cancelRequest: (pairId: number) =>
    request<{ success: boolean }>('PATCH', '/pair/cancel_request_0', { pair_id: pairId }),

  remove: (pairId: number) =>
    request<XanoPair>('POST', '/pair/remove_0', { pair_id: pairId }),
};

export const pairInvite = {
  getSentRequests: () =>
    request<number[]>('GET', '/pair-invite/get_sent_requests'),
};

export const pairs = {
  getAll: () =>
    request<XanoPairsResponse>('GET', '/pairs'),

  create: (inviteEmail: string, extraFields?: Partial<XanoPair>) =>
    request<XanoPair>('POST', '/pairs', { invite_email: inviteEmail, ...extraFields } as Record<string, unknown>),

  getById: (pairsId: number) =>
    request<XanoPair>('GET', `/pairs/${pairsId}`),

  update: (pairsId: number, fields: Partial<XanoPair>) =>
    request<XanoPair>('PATCH', `/pairs/${pairsId}`, fields as Record<string, unknown>),

  respond: (pairsId: number, reqStatus: 'ACCEPTED' | 'REJECTED', requestToId: number) =>
    request<{ success: boolean }>('PATCH', `/pairs/${pairsId}/respond`, {
      reqStatus,
      request_to_id: requestToId,
    }),

  sendRequest: (pairsId: number, fields: Partial<XanoPair>) =>
    request<XanoPair>('PATCH', `/pairs/${pairsId}/sendrequest_0`, fields as Record<string, unknown>),
};
