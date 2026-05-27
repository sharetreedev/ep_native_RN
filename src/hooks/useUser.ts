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
  updatePhoneNumber: (phoneNumber: string, countryIso: string) => Promise<{
    result1?: unknown;
    is_existing_user?: boolean | string;
    existing_user_id?: number | string;
  } | null>;
  updateProfile: (fields: {
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
  }) => Promise<XanoUser | null>;
}

export function useUser(): UseUserResult {
  const { profile, isLoading: profileLoading, error: profileError, viewUser, updateProfile } = useUserProfile();
  const { searchInGroups, getTop4Mhfr } = useUserSearch();
  const { engagementScore, updatePhoneNumber } = useUserSettings();

  return {
    profile,
    isLoading: profileLoading,
    error: profileError,
    viewUser,
    searchInGroups,
    getTop4Mhfr,
    engagementScore,
    updatePhoneNumber,
    updateProfile,
  };
}
