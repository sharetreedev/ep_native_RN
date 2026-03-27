import { request } from './client';
import type { XanoUser } from './types';

export const onboarding = {
  complete: () =>
    request<XanoUser>('POST', '/onboarding/complete'),

  emailVerified: () =>
    request<XanoUser>('POST', '/onboarding/email_verified'),

  phoneVerified: () =>
    request<XanoUser>('POST', '/onboarding/phone_verified'),

  introSlidesSeen: () =>
    request<XanoUser>('POST', '/onboarding/intro_slides_seen'),

  trendCardSeen: () =>
    request<XanoUser>('POST', '/onboarding/trend_card_seen'),

  markCourseEnrollmentSeen: (usersId: number) =>
    request<XanoUser>('PATCH', '/onboarding/mark_course_enrollment_seen', { users_id: usersId }),
};
