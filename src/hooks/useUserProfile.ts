import { useState, useCallback } from 'react';
import { user as xanoUser, XanoUser } from '../api';
import { useAsyncHandler } from './useAsyncHandler';

export function useUserProfile() {
  const [profile, setProfile] = useState<XanoUser | null>(null);
  const { isLoading, error, wrap } = useAsyncHandler();

  const viewUser = useCallback(async (userId: number) => {
    const data = await wrap(() => xanoUser.viewUser(userId));
    if (data) setProfile(data);
    return data;
  }, [wrap]);

  const updateProfile = useCallback(async (fields: {
    first_name?: string;
    last_name?: string;
    phone_number?: string;
    country?: string;
    full_name?: string;
    profile_hex_colour?: string;
  }) => {
    const data = await wrap(() => xanoUser.updateProfile(fields));
    if (data) setProfile(data);
    return data;
  }, [wrap]);

  const updateProfilePic = useCallback(async (profilePicUri: string) => {
    const data = await wrap(() => xanoUser.updateProfilePic(profilePicUri));
    if (data) setProfile(data);
    return data;
  }, [wrap]);

  const updateLastSeen = useCallback(async (timezone: string) => {
    const data = await wrap(() => xanoUser.updateLastSeen(timezone));
    if (data) setProfile(data);
  }, [wrap]);

  return { profile, isLoading, error, viewUser, updateProfile, updateProfilePic, updateLastSeen };
}
