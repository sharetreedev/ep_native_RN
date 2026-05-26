import { request, requestMultipart } from './client';
import type { XanoUser, XanoCourseModules } from './types';

export const user = {
  courseModules: () =>
    request<XanoCourseModules>('GET', '/user/course_modules'),

  engagementScore: () =>
    request<unknown>('GET', '/user/engagement_score'),

  viewUser: (userId: number) =>
    request<XanoUser>('GET', '/user/view_user', { user_id: userId }),

  updateAppProfileBanner: () =>
    request<XanoUser>('POST', '/user/update_app_profile_banner'),

  updatePhoneNumber: (phoneNumber: string, countryIso: string) =>
    request<{
      result1: unknown;
      is_existing_user: boolean | string;
      existing_user_id: number | string;
    }>(
      'POST', '/user/update_phone_number', { phoneNumber, country_iso: countryIso },
    ),

  // PATCH /user/update/profile is a "patch by keys present" endpoint — only
  // the fields you pass are touched. Pass `profilePicFile` to swap the
  // avatar in the same call (the request switches to multipart so Xano gets
  // the raw bytes and stores them as a file resource on `Profile_Pic_File`).
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
  }) => {
    const { profilePicFile, ...jsonFields } = fields;
    if (profilePicFile) {
      const formData = new FormData();
      const ext = profilePicFile.uri.split('.').pop()?.split(';')[0]?.toLowerCase() || 'jpeg';
      const mime = profilePicFile.type ?? (ext === 'png' ? 'image/png' : 'image/jpeg');
      formData.append('Profile_Pic_File', {
        uri: profilePicFile.uri,
        type: mime,
        name: profilePicFile.name ?? `profile.${ext}`,
      } as any);
      for (const [k, v] of Object.entries(jsonFields)) {
        if (v === undefined) continue;
        formData.append(k, typeof v === 'string' ? v : JSON.stringify(v));
      }
      return requestMultipart<XanoUser>('PATCH', '/user/update/profile', formData);
    }
    return request<XanoUser>('PATCH', '/user/update/profile', jsonFields as Record<string, unknown>);
  },

  // EP-949: in-app account deletion (App Store 5.1.1(v) / Google Play User Data).
  // Hard-deletes identifiers, pseudonymises check-ins / support requests /
  // AI MHFR transcripts via correlation_id, and records a salted-hash audit
  // row so legal lookups remain possible. Endpoint defined in Xano as
  // `query "user/account_deletion"`.
  deleteAccount: () =>
    request<{ success: boolean }>('DELETE', '/user/account_deletion'),
};

export const users = {
  getTop4Mhfr: async () => {
    const data = await request<{ my_mhfr: XanoUser[]; groups?: number[] }>('GET', '/users/get_top_4_mhfr');
    return data.my_mhfr ?? [];
  },

  searchInGroups: (searchText: string) =>
    request<XanoUser[]>('GET', '/users/search_in_groups', { search_text: searchText }),
};
