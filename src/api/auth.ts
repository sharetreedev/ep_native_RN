import { request } from './client';
import type { XanoAuthMeResponse, XanoAuthResponse, XanoUser } from './types';

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
    request<XanoAuthMeResponse>('GET', '/auth/me'),

  mergeAccounts: (existingUserId: number) =>
    request<{ result1: Pick<XanoUser, 'id' | 'email' | 'phoneNumber' | 'fullName' | 'phoneVerified'> }>(
      'PUT', '/auth/merge_accounts', { existing_user_id: existingUserId },
    ),

  generateCode: (type: 'email' | 'phone') =>
    request<{ status: string; message: string }>('POST', '/auth/2fa/generateCode', { type }),

  verifyCode: (verificationCode: number) =>
    request<{ verified: boolean | string }>('POST', '/auth/2fa/verifyCode', { verificationCode }),

  signInWithMobile: (phone: string, country_iso: string) =>
    request<{ status: string; message: string; user_id: string }>(
      'POST', '/auth/2fa/signinwithmobile', { phone, country_iso },
    ),

  verifyMobileCode: (verificationCode: number, user_id: string) =>
    request<{ message: string; verified: boolean; authToken: string }>(
      'POST', '/auth/2fa/verifyMobileCode', { verificationCode, user_id },
    ),

  microsoftCallback: (params: {
    token: string;
    code_verifier: string;
    tenant_id?: string;
    domain?: string;
  }) =>
    request<{ authToken: string }>(
      'POST', '/auth/microsoft/callback', params as Record<string, unknown>,
    ),

  // EP-963: in-app password reset trigger. Backend sends an email with a
  // reset link; SSO-only accounts are no-oped server-side. Update the path
  // here when the Xano endpoint is confirmed.
  requestPasswordReset: (email: string) =>
    request<{ success: boolean }>('POST', '/auth/request_password_reset', { email }),

  appleCallback: (params: {
    identity_token: string;
    raw_nonce: string;
    authorization_code?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    apple_user_id?: string;
  }) =>
    request<{ authToken: string }>(
      'POST', '/auth/apple/callback', params as Record<string, unknown>,
    ),
};
