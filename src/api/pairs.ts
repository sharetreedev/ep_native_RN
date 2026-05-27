import { request } from './client';
import type { XanoPair, XanoPairsResponse, XanoPairCheckin } from './types';
import type { Body } from './schema';

export const pair = {
  // SPEC NOTE: spec response matches `{ id, created_at, creator_id, recipient_id }`
  // but marks every field as optional; XanoPairCheckin treats them as required.
  // Keep hand-rolled until the spec marks required fields.
  checkin: (creatorId: number, recipientId: number) =>
    request<XanoPairCheckin>(
      'POST', '/pair/checkin', { creator_id: creatorId, recipient_id: recipientId },
    ),

  // Spec response `{ result: string }` — matches.
  checkinReminder: (pairsUserId: number, message: string) =>
    request<Body<'api/pair/checkin_reminder|POST'>>(
      'POST', '/pair/checkin_reminder', { pairs_user_id: pairsUserId, message },
    ),

  // Spec response array of `{ id, created_at, creator_id, recipient_id }`.
  getCheckinRequests: () =>
    request<Body<'api/pair/get_checkin_requests|GET'>>('GET', '/pair/get_checkin_requests'),

  // SPEC NOTE: swagger declares `{}` for /pair/get_by_token — under-documented.
  // Real response is a XanoPair row. Keep hand-rolled.
  getByToken: (token: string, currentUserId?: number) =>
    request<XanoPair>('GET', '/pair/get_by_token', {
      token,
      ...(currentUserId !== undefined ? { current_user_id: currentUserId } : {}),
    }),

  // SPEC NOTE: swagger lists this path as `/pair/remove_0`; we hit
  // `/pair/cancel_request_0`. Both reach Xano. Endpoint isn't in the spec at
  // this URL, so hand-rolled response stays.
  cancelRequest: (pairId: number) =>
    request<{ success: boolean }>('PATCH', '/pair/cancel_request_0', { pair_id: pairId }),

  // Stop sharing with a pair. Canonical endpoint per the backend cleanup:
  // POST /pair/remove_0 is being decommissioned in favour of REST-shaped
  // DELETE /pair with the pair_id in the body.
  // SPEC NOTE: swagger declares `{}` for the DELETE response — under-documented.
  // Real response is the deleted XanoPair row.
  remove: (pairId: number) =>
    request<XanoPair>('DELETE', '/pair', { pair_id: pairId }),
};

export const pairInvite = {
  // SPEC NOTE: swagger declares `{}` — real shape is an array of pair ids.
  getSentRequests: () =>
    request<number[]>('GET', '/pair-invite/get_sent_requests'),
};

export const pairs = {
  // SPEC NOTE: swagger types `active`/`invites` but the per-row shape is
  // under-documented (consumers like PairsGrid / PairsRefinement read
  // joined fields like `other_user`, `_last_emotion_key`, `lastEmotionKey`).
  // Keep hand-rolled XanoPairsResponse until the spec catches up.
  getAll: () =>
    request<XanoPairsResponse>('GET', '/pairs'),

  // Spec response covers the Pairs row reasonably well, but all fields are
  // optional in the spec while XanoPair marks `id`/`created_at` as required.
  // Keep hand-rolled.
  create: (pairType: 'DUAL' | 'PUSH' | 'PULL', requestFromId: number) =>
    request<XanoPair>('POST', '/pairs', { pairType, requestFromId }),

  getById: (pairsId: number) =>
    request<XanoPair>('GET', `/pairs/${pairsId}`),

  update: (pairsId: number, fields: Partial<XanoPair>) =>
    request<XanoPair>('PATCH', `/pairs/${pairsId}`, fields as Record<string, unknown>),

  // Backend only accepts `reqStatus` in the body; `pairs_id` is the path
  // param. Previously also sent `request_to_id`, which the endpoint
  // doesn't recognise → "Unable to locate input: request_to_id" error.
  // SPEC NOTE: swagger declares `{}` — runtime returns `{ success: boolean }`.
  respond: (pairsId: number, reqStatus: 'ACCEPTED' | 'REJECTED') =>
    request<{ success: boolean }>('PATCH', `/pairs/${pairsId}/respond`, {
      reqStatus,
    }),

  sendRequest: (pairsId: number, fields: { requestToId?: number; invite_email?: string }) => {
    if (typeof pairsId !== 'number' || !Number.isFinite(pairsId)) {
      throw new Error(`pairs.sendRequest: invalid pairsId (${String(pairsId)})`);
    }
    // SPEC NOTE: swagger declares `{}` — under-documented.
    return request<unknown>('PATCH', `/pairs/${pairsId}/sendrequest`, {
      pairs_id: pairsId,
      ...fields,
    });
  },
};
