import { request } from './client';
import type { XanoAuthMeResponse, XanoAuthResponse, XanoUser } from './types';
import type { components, operations } from './xano-schema';

// Helper aliases — pull operation request/response types straight from the
// generated swagger types so we don't restate what Xano already declares.
// If the swagger changes, `npm run gen:api` regenerates the types and any
// drift becomes a compile error here.
//
// (`components` is exported for downstream type lookups even if not used yet.)
export type Op<K extends keyof operations> = operations[K];
type _UnusedComponents = components;
export type VerifyCodeResponse = Op<'api/auth/2fa/verifyCode|POST'>['responses']['200']['content']['application/json'];

export type MigratedUserResponse = 'login' | 'phone' | 'email';

/**
 * Normalise the response from `/auth/2fa/verifyCode` to a plain boolean.
 * The endpoint has historically returned each of:
 *   - a raw boolean
 *   - `{ verified: true }`
 *   - `{ result: true }`
 *   - the verified flag wrapped one level deeper (e.g. `{ result1: { verified: true } }`)
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
  // "wrong code" error roughly 1 in 10 times. The swagger declares
  // `verificationCode: int64` but Xano coerces the string at runtime.
  //
  // Response type is sourced from the generated swagger schema. Per the
  // spec, the body is `{ verified?: string }` (string, e.g. "true"). The
  // `isVerifiedResponse` helper normalises both legacy and current shapes.
  verifyCode: (verificationCode: string) =>
    request<VerifyCodeResponse>(
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
