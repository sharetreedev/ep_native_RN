import { useState, useCallback } from 'react';
import {
  group as xanoGroup,
  groups as xanoGroups,
  XanoGroup,
  XanoUserGroup,
  XanoForestMapEntry,
  XanoRunningStats,
} from '../api';
import { useAsyncHandler } from './useAsyncHandler';
import { invalidate, CACHE_KEYS } from '../lib/fetchCache';
import { trackGroupCreated, trackGroupInviteAccepted } from '../lib/analyticsEvents';

interface GroupsState {
  activeGroups: XanoUserGroup[];
  invites: XanoForestMapEntry[];
}

export function useGroupData() {
  const [state, setState] = useState<GroupsState>({ activeGroups: [], invites: [] });
  const { isLoading, error, wrap } = useAsyncHandler({ initialLoading: true });

  const fetchAll = useCallback(async () => {
    const data = await wrap(() => xanoGroups.getAll());
    if (data) {
      const rawActive = Array.isArray(data.active_groups) ? data.active_groups : [];
      const rawInvites = Array.isArray(data.invites) ? data.invites : [];
      // Backend can return PENDING forest_map entries inside active_groups,
      // which causes invited-but-not-accepted groups to render in the active
      // list. Split defensively so activeGroups is accepted-only and any
      // stray pending entries surface as invites instead.
      const isAccepted = (g: any) => {
        const status = g?.forest?.reqStatus ?? g?.reqStatus;
        return !status || status === 'ACCEPTED';
      };
      // The same forest_map row can appear in both `data.invites` and
      // `data.active_groups` (when the backend leaks PENDING into the active
      // array). Dedupe by forest_map id so the UI doesn't render duplicate
      // keys.
      const inviteId = (i: any): number | undefined => i?.forest?.id ?? i?.id;
      const mergedInvites: any[] = [];
      const seenInviteIds = new Set<number>();
      for (const i of [...rawInvites, ...rawActive.filter((g: any) => !isAccepted(g))]) {
        const id = inviteId(i);
        if (id == null || !seenInviteIds.has(id)) {
          if (id != null) seenInviteIds.add(id);
          mergedInvites.push(i);
        }
      }
      setState({
        activeGroups: rawActive.filter(isAccepted),
        invites: mergedInvites,
      });
    }
  }, [wrap]);

  const createGroup = useCallback(async (groupName: string, groupImage: string, listOfUsers: unknown[]) => {
    const result = await wrap(() => xanoGroup.create(groupName, groupImage, listOfUsers));
    if (result) {
      invalidate(CACHE_KEYS.GROUPS);
      trackGroupCreated(); // spec: no properties
    }
    return result;
  }, [wrap]);

  // Invite entries can have two shapes:
  //   - XanoForestMapEntry rows from the API's `invites` array (forest_map id at top level)
  //   - Forest-map entries lifted out of `active_groups` by the PENDING filter
  //     above (forest_map id is at `forest.id`)
  const inviteForestMapId = (i: any): number | undefined => i?.forest?.id ?? i?.id;

  const acceptInvite = useCallback(async (forestMapId: number) => {
    const result = await wrap(() => xanoGroups.acceptInvite(forestMapId));
    if (result) {
      invalidate(CACHE_KEYS.GROUPS);
      trackGroupInviteAccepted(); // spec: no properties
      setState(prev => ({
        ...prev,
        invites: prev.invites.filter((i: any) => inviteForestMapId(i) !== forestMapId),
        activeGroups: [...prev.activeGroups, result],
      }));
    }
    return result;
  }, [wrap]);

  const declineInvite = useCallback(async (forestMapId: number) => {
    const result = await wrap(() => xanoGroups.declineInvite(forestMapId));
    if (result) {
      invalidate(CACHE_KEYS.GROUPS);
      setState(prev => ({
        ...prev,
        invites: prev.invites.filter((i: any) => inviteForestMapId(i) !== forestMapId),
      }));
    }
    return result;
  }, [wrap]);

  const getForestMap = useCallback((groupId?: number) =>
    wrap(() => xanoGroup.getForestMap(groupId)), [wrap]);

  const getGroupById = useCallback((groupId: number) =>
    wrap(() => xanoGroups.getById(groupId)), [wrap]);

  const getGroupRunningStats = useCallback((groupRunningStatsId: number) =>
    wrap(() => xanoGroup.getRunningStats(groupRunningStatsId)), [wrap]);

  return {
    activeGroups: state.activeGroups,
    invites: state.invites,
    isLoading,
    error,
    fetchAll,
    createGroup,
    acceptInvite,
    declineInvite,
    getForestMap,
    getGroupById,
    getGroupRunningStats,
  };
}
