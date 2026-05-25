import { request } from './client';
import type { XanoAuthMeResponse, XanoAuthResponse, XanoUser } from './types';

export type MigratedUserResponse = 'login' | 'phone' | 'email';

/**
 * Normalise the response from `/auth/2fa/verifyCode` to a plain boolean.
 * The endpoint may return a raw boolean, `{ verified: true }`, or
 * `{ result: true }` depending on backend version — treat them all uniformly.
 */
export function isVerifiedResponse(
  res: boolean | { verified?: boolean; result?: boolean } | null | undefined,
): boolean {
  if (res === true) return true;
  if (res && typeof res === 'object') {
    return res.verified === true || res.result === true;
  }
  return false;
}

export const auth = {
  login: (email: string, password: string) =>
    request<XanoAuthResponse>('POST', '/auth/login', { email, password }),

  // Pre-sign-in migration check. `response` decides the flow:
  //   login → old-DB password still works, sign in normally
  //   email → migrated; verify via emailed code, then force a password reset
  //   phone → no email account; offer mobile sign-in instead
  // `user` is the numeric user id (as a string).
  isMigratedUser: (email: string) =>
    request<{ response: MigratedUserResponse; user: string }>(
      'POST', '/auth/is_migrated_user1', { email },
    ),

  generateCodeWithId: (type: 'email' | 'phone', usersId: number) =>
    request<{ status: string; message: string }>(
      'POST', '/auth/generateCodeWithId', { type, users_id: usersId },
    ),

  // Saves a new password for the (now authenticated) migrated user. Requires
  // the Bearer token from verifyMobileCode to already be set.
  resetPassword: (userId: number, password: string) =>
    request<Record<string, never>>(
      'POST', '/reset_password_', { user_id: userId, password },
    ),

  // Flags a migrated account as reconciled from the old AWS database. Called
  // once, post email-code verification (the Bearer token must be set).
  awsSynced: () =>
    request<XanoUser>('POST', '/auth/aws_synced'),

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

  // Send the code as a string — `Number("0123")` strips the leading zero
  // and Xano then compares "123" to its stored "0123", producing a spurious
  // "wrong code" error roughly 1 in 10 times.
  //
  // The response shape from Xano is `{ verified: boolean }` (verified by
  // inspecting the actual server response). We previously typed this as
  // `request<boolean>` and checked `result === true`, which was always false
  // because the response is an object — so even a correct code was rejected
  // by the client. Accept either shape to be defensive against backend
  // contract drift.
  verifyCode: (verificationCode: string) =>
    request<boolean | { verified?: boolean; result?: boolean }>(
      'POST', '/auth/2fa/verifyCode', { verificationCode },
    ),

  signInWithMobile: (phone: string, country_iso: string) =>
    request<{ status: string; message: string; user_id: string }>(
      'POST', '/auth/2fa/signinwithmobile', { phone, country_iso },
    ),

  // String, not number — see verifyCode above for the leading-zero rationale.
  verifyMobileCode: (verificationCode: string, user_id: string) =>
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

  requestPasswordReset: (email: string) =>
    request<{ message: string }>('POST', '/auth/request_password_reset', { email }),

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
