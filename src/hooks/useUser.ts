import { XanoUser } from '../api';
import { useUserProfile } from './useUserProfile';
import { useUserSearch } from './useUserSearch';
import { useUserSettings } from './useUserSettings';

interface UseUserResult {
  profile: XanoUser | null;
  isLoading: boolean;
  error: string | null;
  viewUser: (userId: number) => Promise<XanoUser | null>;
  searchInGroups: (searchText: string) => Promise<XanoUser[]>;
  getTop4Mhfr: () => Promise<XanoUser[]>;
  engagementScore: () => Promise<unknown>;
  updateLastSeen: (timezone: string) => Promise<void>;
  updatePhoneNumber: (phoneNumber: string, countryIso: string) => Promise<{
    result1: unknown;
    is_existing_user: string;
    existing_user_id: string;
  } | null>;
  updateReminderSettings: (settings: {
    frequency: string;
    days: number[];
    hour: number;
    min: number;
    is_custom: boolean;
  }) => Promise<XanoUser | null>;
  updateProfile: (fields: {
    first_name?: string;
    last_name?: string;
    phone_number?: string;
    country?: string;
    full_name?: string;
    profile_pic_uri?: string;
  }) => Promise<XanoUser | null>;
}

export function useUser(): UseUserResult {
  const { profile, isLoading: profileLoading, error: profileError, viewUser, updateProfile, updateLastSeen } = useUserProfile();
  const { searchInGroups, getTop4Mhfr } = useUserSearch();
  const { engagementScore, updatePhoneNumber, updateReminderSettings } = useUserSettings();

  return {
    profile,
    isLoading: profileLoading,
    error: profileError,
    viewUser,
    searchInGroups,
    getTop4Mhfr,
    engagementScore,
    updateLastSeen,
    updatePhoneNumber,
    updateReminderSettings,
    updateProfile,
  };
}
