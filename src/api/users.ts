import { request, requestMultipart } from './client';
import type { XanoUser, XanoCourseModules } from './types';
import type { Body } from './schema';

export const user = {
  // Spec returns the Users row's course_modules array. Hand-rolled
  // XanoCourseModules captures the shape; align with spec if it ever
  // grows beyond what XanoCourseModules describes.
  courseModules: () =>
    request<XanoCourseModules>('GET', '/user/course_modules'),

  engagementScore: () =>
    request<Body<'api/user/engagement_score|GET'>>('GET', '/user/engagement_score'),

  // SPEC NOTE: swagger declares `{}` — under-documented. Endpoint actually
  // returns the full Users row. Intersect with XanoUser until the spec is
  // corrected (then drop the intersection).
  viewUser: (userId: number) =>
    request<Body<'api/user/view_user|GET'> & XanoUser>(
      'GET', '/user/view_user', { user_id: userId },
    ),

  updateAppProfileBanner: () =>
    request<Body<'api/user/update_app_profile_banner|POST'>>(
      'POST', '/user/update_app_profile_banner',
    ),

  // SPEC NOTE: spec types is_existing_user/existing_user_id as `string`, but
  // historical responses also returned booleans/numbers — keep the wider
  // consumer-facing type via intersection so the merge-detection logic in
  // OnboardingScreen.handlePhoneSubmit doesn't have to special-case spec drift.
  updatePhoneNumber: (phoneNumber: string, countryIso: string) =>
    request<Body<'api/user/update_phone_number|POST'> & {
      is_existing_user: boolean | string;
      existing_user_id: number | string;
    }>(
      'POST', '/user/update_phone_number', { phoneNumber, country_iso: countryIso },
    ),

  // PATCH /user/update/profile is a "patch by keys present" endpoint — only
  // the fields you pass are touched. Pass `profilePicFile` to swap the
  // avatar; we send the binary in a separate multipart PATCH because Xano's
  // script reads scalar fields via `util.get_raw_input(encoding="json")`,
  // which doesn't parse multipart bodies — so sending both at once leaves
  // the name fields unpatched while the pic uploads fine.
  updateProfile: async (fields: {
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
    type UpdateProfileBody = Body<'api/user/update/profile|PATCH'>;
    let result: UpdateProfileBody | undefined;
    if (Object.keys(jsonFields).length > 0) {
      result = await request<UpdateProfileBody>(
        'PATCH', '/user/update/profile', jsonFields as Record<string, unknown>,
      );
    }
    if (profilePicFile) {
      const formData = new FormData();
      const ext = profilePicFile.uri.split('.').pop()?.split(';')[0]?.toLowerCase() || 'jpeg';
      const mime = profilePicFile.type ?? (ext === 'png' ? 'image/png' : 'image/jpeg');
      // Field name `Profile_File` matches the standalone `image`-typed input
      // on the Xano endpoint. The Users table's `Profile_Pic_File` column is
      // hidden from the dblink because file-resource validation rejects raw
      // multipart uploads — the script populates the column from this
      // separate image input via `storage.create_image`.
      formData.append('Profile_File', {
        uri: profilePicFile.uri,
        type: mime,
        name: profilePicFile.name ?? `profile.${ext}`,
      } as any);
      result = await requestMultipart<UpdateProfileBody>('PATCH', '/user/update/profile', formData);
    }
    return result as XanoUser;
  },

  // EP-949: in-app account deletion (App Store 5.1.1(v) / Google Play User Data).
  // Hard-deletes identifiers, pseudonymises check-ins / support requests /
  // AI MHFR transcripts via correlation_id, and records a salted-hash audit
  // row so legal lookups remain possible.
  // Spec response is `{}` — the script returns nothing semantic; we treat
  // a 2xx as success.
  deleteAccount: () =>
    request<Body<'api/user/account_deletion|DELETE'>>(
      'DELETE', '/user/account_deletion',
    ),
};

export const users = {
  // SPEC NOTE: swagger says `{}`. Real shape is `{ my_mhfr: XanoUser[], groups?: number[] }`.
  getTop4Mhfr: async () => {
    const data = await request<Body<'api/users/get_top_4_mhfr|GET'> & {
      my_mhfr: XanoUser[];
      groups?: number[];
    }>('GET', '/users/get_top_4_mhfr');
    return data.my_mhfr ?? [];
  },

  // SPEC NOTE: swagger says `{}`. Real shape is an array of XanoUser.
  // Spec drift here is more severe — spec declares object, runtime returns
  // array — so we cast rather than intersect.
  searchInGroups: (searchText: string) =>
    request<XanoUser[]>(
      'GET', '/users/search_in_groups', { search_text: searchText },
    ),
};
