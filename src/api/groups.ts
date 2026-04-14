import { request, requestMultipart } from './client';
import type {
  XanoGroup,
  XanoUserGroup,
  XanoForestMapEntry,
  XanoGroupsResponse,
  XanoRunningStats,
} from './types';

export const group = {
  create: (groupName: string, groupImage: string, listOfUsers: unknown[]) =>
    request<XanoGroup>('POST', '/group/create', {
      group_name: groupName,
      group_image: groupImage,
      list_of_users: listOfUsers,
    }),

  createInvite: (params: {
    group_id: number;
    invitee_email: string;
    invited_by: number;
    invited_user: number;
    isAutoAccept: boolean;
  }) =>
    request<XanoForestMapEntry>('POST', '/group/create_invite', params as Record<string, unknown>),

  createInviteViaEmail: (groupId: number, inviteeEmail: string) =>
    request<{ success: string; message: string; data: string }>(
      'POST', '/group/create_invite_via_email', { group_id: groupId, invitee_email: inviteeEmail },
    ),

  getForestMap: (groupId?: number) =>
    request<XanoForestMapEntry[]>(
      'GET', '/group/get_forest_map', groupId !== undefined ? { group_id: groupId } : undefined,
    ),

  getMembers: (groupId: number) =>
    request<{ id: number; reqStatus: string; role: string; admin: string; sinceOnDate: number | null; user: { fullName: string; profilePic_url: string } | null }[]>(
      'GET', '/group/get_members', { group_id: groupId },
    ),

  getInvite: (forestId: number) =>
    request<{ forest: unknown; group: unknown }>('POST', '/group/get_invite', { forest_id: forestId }),

  getRunningStats: (groupRunningStatsId: number) =>
    request<XanoRunningStats>('GET', `/group/get_running_stats/${groupRunningStatsId}/`),

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

  updateGroupName: (groupsId: number, groupName: string) =>
    request<Record<string, unknown>>('POST', '/group/update_group_name', {
      groups_id: groupsId,
      group_name: groupName,
    }),

  updateProfilePic: (groupsId: number, profilePic: { uri: string; name: string; type: string }) => {
    const formData = new FormData();
    formData.append('groups_id', String(groupsId));
    formData.append('profile_pic', profilePic as unknown as Blob);
    return requestMultipart<Record<string, unknown>>('POST', '/group/update_profile_pic', formData);
  },

  updateBanner: (groupsId: number, banner: { uri: string; name: string; type: string }) => {
    const formData = new FormData();
    formData.append('groups_id', String(groupsId));
    formData.append('banner', banner as unknown as Blob);
    return requestMultipart<Record<string, unknown>>('POST', '/group/update_banner', formData);
  },
};

export const groups = {
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

  acceptInvite: (forestMapId: number) =>
    request<XanoUserGroup>('POST', '/groups/accept_invite', { forest_map_id: forestMapId }),

  declineInvite: (forestMapId: number) =>
    request<XanoUserGroup>('POST', '/groups/decline_invite', { forest_map_id: forestMapId }),
};
