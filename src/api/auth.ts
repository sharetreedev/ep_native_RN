import { request } from './client';
import type { XanoAuthMeResponse, XanoUser } from './types';
import type { Body } from './schema';

export type MigratedUserResponse = 'login' | 'phone' | 'email';

/**
 * Normalise the response from `/auth/2fa/verifyCode` to a plain boolean.
 *
 * Per the swagger (docs/xano-api.json), Xano returns
 * `{ verified?: string }` — i.e. `{ "verified": "true" }` (string, not
 * boolean). Older builds returned a bare boolean or `{ verified: true }`.
 * Walk one level into nested objects so a Xano response-wrapping pass
 * doesn't silently break the check.
 */
export function isVerifiedResponse(res: unknown): boolean {
  if (res === true || res === 'true') return true;
  if (res && typeof res === 'object') {
    const obj = res as Record<string, unknown>;
    if (obj.verified === true || obj.verified === 'true') return true;
    if (obj.result === true || obj.result === 'true') return true;
    for (const v of Object.values(obj)) {
      if (v && typeof v === 'object') {
        const inner = v as Record<string, unknown>;
        if (inner.verified === true || inner.verified === 'true') return true;
        if (inner.result === true || inner.result === 'true') return true;
      }
    }
  }
  return false;
}

export const auth = {
  login: (email: string, password: string) =>
    request<Body<'api/auth/login|POST'>>('POST', '/auth/login', { email, password }),

  // Pre-sign-in migration check. `response` decides the flow:
  //   login → old-DB password still works, sign in normally
  //   email → migrated; verify via emailed code, then force a password reset
  //   phone → no email account; offer mobile sign-in instead
  // `user` is the numeric user id (as a string).
  // Spec types `response` as plain string; we narrow at the call site.
  isMigratedUser: (email: string) =>
    request<Body<'api/auth/is_migrated_user1|POST'> & { response: MigratedUserResponse }>(
      'POST', '/auth/is_migrated_user1', { email },
    ),

  generateCodeWithId: (type: 'email' | 'phone', usersId: number) =>
    request<Body<'api/auth/generateCodeWithId|POST'>>(
      'POST', '/auth/generateCodeWithId', { type, users_id: usersId },
    ),

  // Saves a new password for the (now authenticated) migrated user. Requires
  // the Bearer token from verifyMobileCode to already be set.
  resetPassword: (userId: number, password: string) =>
    request<Body<'api/reset_password_|POST'>>(
      'POST', '/reset_password_', { user_id: userId, password },
    ),

  // Flags a migrated account as reconciled from the old AWS database. Called
  // once, post email-code verification (the Bearer token must be set).
  // Spec returns the whole Users row; our XanoUser type aligns with that.
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
    request<Body<'api/auth/signup|POST'>>(
      'POST', '/auth/signup', fields as Record<string, unknown>,
    ),

  // /auth/me returns the full Users row + joined relations (groups, pairs,
  // pendingPairInvites, pendingGroupInvites). The spec just describes the
  // base Users row, so we keep the hand-rolled XanoAuthMeResponse which
  // documents the joined fields. Worth reconciling against the spec when
  // it catches up.
  me: () =>
    request<XanoAuthMeResponse>('GET', '/auth/me'),

  mergeAccounts: (existingUserId: number) =>
    request<Body<'api/auth/merge_accounts|PUT'>>(
      'PUT', '/auth/merge_accounts', { existing_user_id: existingUserId },
    ),

  generateCode: (type: 'email' | 'phone') =>
    request<Body<'api/auth/2fa/generateCode|POST'>>(
      'POST', '/auth/2fa/generateCode', { type },
    ),

  // Send the code as a string — `Number("0123")` strips the leading zero
  // and Xano then compares "123" to its stored "0123", producing a spurious
  // "wrong code" error roughly 1 in 10 times. The swagger declares
  // `verificationCode: int64` but Xano coerces the string at runtime.
  //
  // Response per spec is `{ verified?: string }`; `isVerifiedResponse`
  // normalises that.
  verifyCode: (verificationCode: string) =>
    request<Body<'api/auth/2fa/verifyCode|POST'>>(
      'POST', '/auth/2fa/verifyCode', { verificationCode },
    ),

  signInWithMobile: (phone: string, country_iso: string) =>
    request<Body<'api/auth/2fa/signinwithmobile|POST'>>(
      'POST', '/auth/2fa/signinwithmobile', { phone, country_iso },
    ),

  // String, not number — see verifyCode above for the leading-zero rationale.
  // Spec declares `verified` as a string here too (mirrors /verifyCode).
  verifyMobileCode: (verificationCode: string, user_id: string) =>
    request<Body<'api/auth/2fa/verifyMobileCode|POST'>>(
      'POST', '/auth/2fa/verifyMobileCode', { verificationCode, user_id },
    ),

  // Spec response is currently `{}` (Xano hasn't declared the body) but the
  // endpoint really does return `{ authToken: string }`. Intersect until the
  // spec is updated — then this becomes plain `Body<'…microsoft/callback|POST'>`.
  microsoftCallback: (params: {
    token: string;
    code_verifier: string;
    tenant_id?: string;
    domain?: string;
  }) =>
    request<Body<'api/auth/microsoft/callback|POST'> & { authToken: string }>(
      'POST', '/auth/microsoft/callback', params as Record<string, unknown>,
    ),

  // SPEC NOTE: swagger says this endpoint is GET, we call POST with a JSON
  // body. Both reach Xano; the script is wired to read the email regardless.
  // Worth aligning if/when the spec is corrected.
  requestPasswordReset: (email: string) =>
    request<Body<'api/auth/request_password_reset|GET'>>(
      'POST', '/auth/request_password_reset', { email },
    ),

  // Spec declares `{ authToken: string }` — matches what we read.
  appleCallback: (params: {
    identity_token: string;
    raw_nonce: string;
    authorization_code?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    apple_user_id?: string;
  }) =>
    request<Body<'api/auth/apple/callback|POST'>>(
      'POST', '/auth/apple/callback', params as Record<string, unknown>,
    ),
};
