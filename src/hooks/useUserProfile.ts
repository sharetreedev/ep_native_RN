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
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    country?: string;
    fullName?: string;
    profile_hex_colour?: string;
    timezone?: string;
    emailVerified?: boolean;
    phoneVerified?: boolean;
    intro_slides_seen?: boolean;
    seen_trend_card?: boolean;
    onboarding_complete?: boolean;
    reminder_frequency?: string;
    reminder_hour?: number;
    reminder_min?: number;
    reminder_day?: number[];
    set_custom_user_reminder?: boolean;
    profilePicFile?: { uri: string; name?: string; type?: string };
  }) => {
    const data = await wrap(() => xanoUser.updateProfile(fields));
    if (data) setProfile(data);
    return data;
  }, [wrap]);

  return { profile, isLoading, error, viewUser, updateProfile };
}
