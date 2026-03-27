import {
  XanoGroup,
  XanoUserGroup,
  XanoForestMapEntry,
  XanoRunningStats,
} from '../api';
import { useGroupData } from './useGroupData';
import { useGroupInvites } from './useGroupInvites';
import { useGroupProfile } from './useGroupProfile';

interface UseGroupsResult {
  activeGroups: XanoUserGroup[];
  invites: XanoForestMapEntry[];
  isLoading: boolean;
  error: string | null;
  fetchAll: () => Promise<void>;
  createGroup: (groupName: string, groupImage: string, listOfUsers: unknown[]) => Promise<XanoGroup | null>;
  acceptInvite: (forestMapId: number) => Promise<XanoUserGroup | null>;
  declineInvite: (forestMapId: number) => Promise<XanoUserGroup | null>;
  inviteViaEmail: (groupId: number, inviteeEmail: string) => Promise<{ success: string; message: string; data: string } | null>;
  inviteUsers: (params: {
    emails: string;
    group_id: number;
    admin_message: string;
    user_access: string;
    group_subscriptions_id: number;
    is_mobile_invite: boolean;
    phone_numbers?: string[];
  }) => Promise<XanoGroup | null>;
  getForestMap: (groupId?: number) => Promise<XanoForestMapEntry[] | null>;
  getMembers: (groupId: number) => Promise<{ id: number; reqStatus: string; role: string; admin: string; sinceOnDate: number | null; user: { fullName: string; profilePic_url: string } | null }[] | null>;
  getGroupRunningStats: (groupRunningStatsId: number) => Promise<XanoRunningStats | null>;
  updateGroupName: (groupsId: number, groupName: string) => Promise<Record<string, unknown> | null>;
  updateProfilePic: (groupsId: number, profilePic: { uri: string; name: string; type: string }) => Promise<Record<string, unknown> | null>;
  updateBanner: (groupsId: number, banner: { uri: string; name: string; type: string }) => Promise<Record<string, unknown> | null>;
}

export function useGroups(): UseGroupsResult {
  const { activeGroups, invites, isLoading, error, fetchAll, createGroup, acceptInvite, declineInvite, getForestMap, getGroupRunningStats } = useGroupData();
  const { inviteViaEmail, inviteUsers } = useGroupInvites();
  const { getMembers, updateGroupName, updateProfilePic, updateBanner } = useGroupProfile();

  return {
    activeGroups,
    invites,
    isLoading,
    error,
    fetchAll,
    createGroup,
    acceptInvite,
    declineInvite,
    inviteViaEmail,
    inviteUsers,
    getForestMap,
    getMembers,
    getGroupRunningStats,
    updateGroupName,
    updateProfilePic,
    updateBanner,
  };
}
