import { useCallback } from 'react';
import { group as xanoGroup } from '../api';
import { useAsyncHandler } from './useAsyncHandler';

export function useGroupProfile() {
  const { isLoading, error, wrap } = useAsyncHandler();

  const getMembers = useCallback((groupId: number) =>
    wrap(() => xanoGroup.getMembers(groupId)), [wrap]);

  const updateGroupName = useCallback((groupsId: number, groupName: string) =>
    wrap(() => xanoGroup.updateGroupName(groupsId, groupName)), [wrap]);

  const updateProfilePic = useCallback((groupsId: number, profilePic: { uri: string; name: string; type: string }) =>
    wrap(() => xanoGroup.updateProfilePic(groupsId, profilePic)), [wrap]);

  const updateBanner = useCallback((groupsId: number, banner: { uri: string; name: string; type: string }) =>
    wrap(() => xanoGroup.updateBanner(groupsId, banner)), [wrap]);

  return { isLoading, error, getMembers, updateGroupName, updateProfilePic, updateBanner };
}
