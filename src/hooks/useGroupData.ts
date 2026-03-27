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

interface GroupsState {
  activeGroups: XanoUserGroup[];
  invites: XanoForestMapEntry[];
}

export function useGroupData() {
  const [state, setState] = useState<GroupsState>({ activeGroups: [], invites: [] });
  const { isLoading, error, wrap } = useAsyncHandler();

  const fetchAll = useCallback(async () => {
    const data = await wrap(() => xanoGroups.getAll());
    if (data) {
      setState({
        activeGroups: Array.isArray(data.active_groups) ? data.active_groups : [],
        invites: Array.isArray(data.invites) ? data.invites : [],
      });
    }
  }, [wrap]);

  const createGroup = useCallback(async (groupName: string, groupImage: string, listOfUsers: unknown[]) => {
    const result = await wrap(() => xanoGroup.create(groupName, groupImage, listOfUsers));
    if (result) invalidate(CACHE_KEYS.GROUPS);
    return result;
  }, [wrap]);

  const acceptInvite = useCallback(async (forestMapId: number) => {
    const result = await wrap(() => xanoGroups.acceptInvite(forestMapId));
    if (result) {
      invalidate(CACHE_KEYS.GROUPS);
      setState(prev => ({
        ...prev,
        invites: prev.invites.filter(i => i.id !== forestMapId),
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
        invites: prev.invites.filter(i => i.id !== forestMapId),
      }));
    }
    return result;
  }, [wrap]);

  const getForestMap = useCallback((groupId?: number) =>
    wrap(() => xanoGroup.getForestMap(groupId)), [wrap]);

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
    getGroupRunningStats,
  };
}
