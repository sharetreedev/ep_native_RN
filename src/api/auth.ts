import { request } from './client';
import type { XanoAuthResponse, XanoUser } from './types';

export const auth = {
  login: (email: string, password: string) =>
    request<XanoAuthResponse>('POST', '/auth/login', { email, password }),

  signup: (fields: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phoneNumber?: string;
    fullName?: string;
    timezone?: string;
    country?: string;
    source?: string;
    onesignal_subscription_id?: string;
  }) =>
    request<XanoAuthResponse>('POST', '/auth/signup', fields as Record<string, unknown>),

  me: () =>
    request<XanoUser>('GET', '/auth/me'),

  mergeAccounts: (existingUserId: number) =>
    request<{ result1: Pick<XanoUser, 'id' | 'email' | 'phoneNumber' | 'fullName' | 'phoneVerified'> }>(
      'PUT', '/auth/merge_accounts', { existing_user_id: existingUserId },
    ),

  generateCode: (type: 'email' | 'phone') =>
    request<{ status: string; message: string }>('POST', '/auth/2fa/generateCode', { type }),

  verifyCode: (verificationCode: number) =>
    request<{ verified: string }>('POST', '/auth/2fa/verifyCode', { verificationCode }),

  signInWithMobile: (phone: string, country_iso: string) =>
    request<{ status: string; message: string; user_id: string }>(
      'POST', '/auth/2fa/signinwithmobile', { phone, country_iso },
    ),

  verifyMobileCode: (verificationCode: number, user_id: string) =>
    request<{ message: string; verified: boolean; authToken: string }>(
      'POST', '/auth/2fa/verifyMobileCode', { verificationCode, user_id },
    ),
};
