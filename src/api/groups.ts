import { request, requestMultipart, BRANCH_SUFFIX } from './client';
import type {
  XanoGroup,
  XanoUserGroup,
  XanoForestMapEntry,
  XanoGroupsResponse,
  XanoRunningStats,
} from './types';
import type { Body } from './schema';

// Group-invite deep-link endpoints live on a separate Xano API group
// (`api:wImR3IV3`) that has not yet been migrated to the canonical mobile
// branch. Dev builds hit the `:staging` branch; prod/preview hit main.
// Tracked as backend tech debt — see EP-1033 for the consolidation plan.
const GROUP_INVITE_BASE_URL = `https://xdny-scc5-yag9.a2.xano.io/api:wImR3IV3${BRANCH_SUFFIX}`;

export const group = {
  // SPEC NOTE: spec returns the full Groups row but marks every field as
  // optional. Hand-rolled XanoGroup is a narrower required-fields-first view
  // used across the app. Keep hand-rolled until the spec marks required.
  create: (groupName: string, groupImage: string, listOfUsers: unknown[]) =>
    request<XanoGroup>('POST', '/group/create', {
      group_name: groupName,
      group_image: groupImage,
      list_of_users: listOfUsers,
    }),

  // SPEC NOTE: swagger declares `{}` — under-documented.
  createInvite: (params: {
    group_id: number;
    invitee_email: string;
    invited_by: number;
    invited_user: number;
    isAutoAccept: boolean;
  }) =>
    request<XanoForestMapEntry>('POST', '/group/create_invite', params as Record<string, unknown>),

  // SPEC NOTE: spec response shape `{ success, message, data }` matches but
  // marks every field as optional; useGroups types the hook return as all
  // required. Keep hand-rolled until the spec marks required.
  createInviteViaEmail: (groupId: number, inviteeEmail: string) =>
    request<{ success: string; message: string; data: string }>(
      'POST', '/group/create_invite_via_email', { group_id: groupId, invitee_email: inviteeEmail },
    ),

  // SPEC NOTE: spec marks all fields optional; XanoForestMapEntry treats
  // `id` as required. Keep hand-rolled.
  getForestMap: (groupId?: number) =>
    request<XanoForestMapEntry[]>(
      'GET', '/group/get_forest_map', groupId !== undefined ? { group_id: groupId } : undefined,
    ),

  // SPEC NOTE: spec response array shape matches the inline type but marks
  // every field as optional; useGroups types the hook return with required
  // fields. Keep hand-rolled until the spec marks required.
  getMembers: (groupId: number) =>
    request<{ id: number; reqStatus: string; role: string; admin: string; sinceOnDate: number | null; user: { fullName: string; profilePic_url: string } | null }[]>(
      'GET', '/group/get_members', { group_id: groupId },
    ),

  // Spec response `{ forest, group }` — matches; consumer just shows the
  // invite metadata.
  getInvite: (forestId: number) =>
    request<Body<'api/group/get_invite|POST'>>('POST', '/group/get_invite', { forest_id: forestId }),

  // SPEC NOTE: spec documents many group_running_stats fields, but hand-rolled
  // XanoRunningStats captures additional joined fields (direction_* / shift_*
  // comparisons, full period objects) that consumers rely on. Keep hand-rolled.
  getRunningStats: (groupRunningStatsId: number) =>
    request<XanoRunningStats>('GET', `/group/get_running_stats/${groupRunningStatsId}/`),

  // SPEC NOTE: spec returns the full Groups row (matches `group.create`);
  // same optional-fields concern → keep hand-rolled XanoGroup.
  inviteUsers: (params: {
    emails: string;
    group_id: number;
    admin_message: string;
    user_access: string;
    group_subscriptions_id: number;
    is_mobile_invite: boolean;
    phone_numbers?: string[];
  }) =>
    request<XanoGroup>('POST', '/group/invite_users', params as Record<string, unknown>),

  // SPEC NOTE: swagger declares `{}` — under-documented. Consumer ignores
  // the response.
  updateGroupName: (groupsId: number, groupName: string) =>
    request<Record<string, unknown>>('POST', '/group/update_group_name', {
      groups_id: groupsId,
      group_name: groupName,
    }),

  // SPEC NOTE: swagger declares `{}` — under-documented.
  updateProfilePic: (groupsId: number, profilePic: { uri: string; name: string; type: string }) => {
    const formData = new FormData();
    formData.append('groups_id', String(groupsId));
    formData.append('profile_pic', profilePic as unknown as Blob);
    return requestMultipart<Record<string, unknown>>('POST', '/group/update_profile_pic', formData);
  },

  // SPEC NOTE: swagger declares `{}` — under-documented.
  updateBanner: (groupsId: number, banner: { uri: string; name: string; type: string }) => {
    const formData = new FormData();
    formData.append('groups_id', String(groupsId));
    formData.append('banner', banner as unknown as Blob);
    return requestMultipart<Record<string, unknown>>('POST', '/group/update_banner', formData);
  },
};

export const groups = {
  // SPEC NOTE: spec types `active_groups`/`invites` as objects, but the
  // runtime envelope's per-row shape is deeply joined and under-documented.
  // Hand-rolled XanoGroupsResponse keeps the call site types loose enough to
  // index the joins consumers depend on.
  getAll: () =>
    request<XanoGroupsResponse>('GET', '/groups/get_all'),

  /** Fetch a single group by ID (filters from getAll). */
  getById: async (groupId: number) => {
    const data = await request<XanoGroupsResponse>('GET', '/groups/get_all');
    const activeGroups = Array.isArray(data.active_groups) ? data.active_groups : [];
    const match = activeGroups.find((g: any) => {
      const gId = g.group?.id ?? g.groups?.id ?? g.id;
      return gId === groupId;
    });
    return match ?? null;
  },

  /**
   * Respond to a group invite (accept or decline).
   *
   * Backend contract:
   *   PATCH /group/respond/{group_forest_map_id}
   *   body: { reqStatus, userID }
   *
   * `userID` is sent explicitly in the body — the backend currently takes it
   * from input rather than deriving from `$auth.id`. Same tech-debt flagged
   * on the deep-link respond in EP-1033.
   *
   * Replaces three older endpoints that were each used inconsistently:
   *   - POST /groups/accept_invite           (in-app sheet, old)
   *   - POST /groups/decline_invite          (in-app sheet, old)
   *   - PATCH /group_forest_map/{id}         (deep-link screen, on wImR3IV3)
   *
   * SPEC NOTE: swagger declares `{}` — under-documented. Keep XanoUserGroup
   * hand-rolled.
   */
  respond: (groupForestMapId: number, userId: number, reqStatus: 'ACCEPTED' | 'REJECTED') =>
    request<XanoUserGroup>(
      'PATCH',
      `/group/respond/${groupForestMapId}`,
      { reqStatus, userID: userId },
    ),
};

// ─────────────────────────────────────────────────────────────────────────
// Group-invite deep-link endpoints (api:wImR3IV3)
// ─────────────────────────────────────────────────────────────────────────
// The token-based group-invite flow uses a separate Xano API group than the
// canonical mobile branch. These two endpoints power the GroupInviteAccept
// screen which is reached via Universal Link from email/SMS invites.

/** Shape of the invite payload returned by `GET /get_group_invite`. */
export interface XanoGroupInviteRecord {
  id: number; // group_forest_map_id — used as the path param on the PATCH
  invitee_email?: string | null;
  invitee_mobile_number?: string | null;
  group_id?: number;
  group_name?: string;
  group_image?: string | null;
  invited_by_name?: string;
  invited_by_user_id?: number;
  // Joined fields the backend may include (group/inviter metadata)
  _group?: {
    id?: number;
    group_name?: string;
    group_image?: string | null;
  };
  _invited_by?: {
    id?: number;
    firstName?: string;
    lastName?: string;
    fullName?: string;
    profilePic_url?: string | { url?: string } | null;
    profile_hex_colour?: string | null;
  };
  [key: string]: unknown;
}

export const groupInvite = {
  /**
   * Fetch invite metadata by token. Works without auth — anyone with the link
   * can preview the invite, but only the matching recipient can accept.
   *
   * NOTE: `get_group_invite` is the only endpoint still on `api:wImR3IV3`.
   * The respond endpoint has been consolidated onto the canonical branch
   * (see `groups.respond` above). If/when `get_group_invite` is migrated
   * onto the canonical branch, this whole `groupInvite` namespace and the
   * `GROUP_INVITE_BASE_URL` constant above can be deleted.
   *
   * This endpoint isn't in the canonical Xano OpenAPI spec — it lives on the
   * separate `api:wImR3IV3` group — so the hand-rolled XanoGroupInviteRecord
   * is the source of truth here.
   */
  getByToken: (token: string) =>
    request<XanoGroupInviteRecord>(
      'GET',
      '/get_group_invite',
      { token_hash: token },
      { baseUrl: GROUP_INVITE_BASE_URL },
    ),
};
