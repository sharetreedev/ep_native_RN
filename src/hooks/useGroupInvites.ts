import { useCallback } from 'react';
import { group as xanoGroup, XanoGroup } from '../api';
import { useAsyncHandler } from './useAsyncHandler';

export function useGroupInvites() {
  const { isLoading, error, wrap } = useAsyncHandler();

  const inviteViaEmail = useCallback((groupId: number, inviteeEmail: string) =>
    wrap(() => xanoGroup.createInviteViaEmail(groupId, inviteeEmail)), [wrap]);

  const inviteUsers = useCallback((params: Parameters<typeof xanoGroup.inviteUsers>[0]) =>
    wrap(() => xanoGroup.inviteUsers(params)), [wrap]);

  return { isLoading, error, inviteViaEmail, inviteUsers };
}
