import { request, requestMultipart } from './client';
import type { XanoUser, XanoCourseModules } from './types';

export const user = {
  courseModules: () =>
    request<XanoCourseModules>('GET', '/user/course_modules'),

  engagementScore: () =>
    request<unknown>('GET', '/user/engagement_score'),

  viewUser: (userId: number) =>
    request<XanoUser>('GET', '/user/view_user', { user_id: userId }),

  updateLastSeen: (timezone: string) =>
    request<XanoUser>('POST', '/user/update_last_seen', { timezone }),

  updateAppProfileBanner: () =>
    request<XanoUser>('POST', '/user/update_app_profile_banner'),

  updatePhoneNumber: (phoneNumber: string, countryIso: string) =>
    request<{ result1: unknown; is_existing_user: string; existing_user_id: string }>(
      'POST', '/user/update_phone_number', { phoneNumber, country_iso: countryIso },
    ),

  updateReminderSettings: (settings: {
    frequency: string;
    days: number[];
    hour: number;
    min: number;
    is_custom: boolean;
  }) =>
    request<XanoUser>('PATCH', '/user/update_reminder_settings', settings as Record<string, unknown>),

  updateProfile: (fields: {
    first_name?: string;
    last_name?: string;
    phone_number?: string;
    country?: string;
    full_name?: string;
  }) =>
    request<XanoUser>('PATCH', '/user/update/profile', fields as Record<string, unknown>),

  updateProfilePic: (profilePicUri: string) => {
    const formData = new FormData();
    const ext = profilePicUri.split('.').pop()?.split(';')[0]?.toLowerCase() || 'jpeg';
    const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
    formData.append('profile_pic', {
      uri: profilePicUri,
      type: mime,
      name: `profile.${ext}`,
    } as any);
    return requestMultipart<XanoUser>('POST', '/user/update_profile_pic', formData);
  },
};

export const users = {
  getTop4Mhfr: () =>
    request<XanoUser[]>('GET', '/users/get_top_4_mhfr'),

  searchInGroups: (searchText: string) =>
    request<XanoUser[]>('GET', '/users/search_in_groups', { search_text: searchText }),
};
