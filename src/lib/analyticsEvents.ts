/**
 * Typed Amplitude event wrappers — the ONLY place `track` is called from.
 *
 * Per the implementation brief: raw `track('...')` strings let a typo silently
 * create a phantom Amplitude event nobody notices for weeks. One typed function
 * per event makes event + property names compile-time checked, and gives a
 * single place to update if a property vocabulary changes.
 *
 * Property shapes here are the AUTHORITATIVE spec (emotional-pulse-amplitude-
 * tracking-spec.md), which supersedes the brief's summary. 13 events.
 *
 * Two non-negotiables, enforced at the CALL SITES (not here): fire only AFTER
 * the relevant Xano call returns success (never on button press), and never
 * pass content — emotion ids, note text, message bodies, full emails, free
 * text. Properties are booleans / ids / categoricals only.
 *
 * Divergences flagged to Maurice (EP-1023):
 *   • Pair Removed: spec lists NO properties, but the brief says pair_id must
 *     flow through the whole invite→accept/reject→remove lifecycle. Following
 *     the spec (no props) — the lifecycle is still traceable via the other
 *     pair events. Confirm.
 *   • Pair Invite Rejected: spec names the event but lists no properties; using
 *     { pair_id } for lifecycle parity with the other pair events. Confirm.
 *   • signup_method: spec value is `email`; mobile also has Microsoft/Apple
 *     entry points — typed open as string, defaulting `email`. Confirm.
 */
import { trackAnalyticsEvent } from './analytics';

/* ───────────── Engagement ───────────── */

/** Spec: `check_in_type` only (the brief's `needs_attention` is NOT in spec). */
export function trackCheckInCompleted(props: { check_in_type: 'grid' | 'slider' }): void {
  trackAnalyticsEvent('Check-In Completed', props);
}

/** Spec: `module_index` only (no `course_id` until a 2nd course launches). */
export function trackModuleCompleted(props: { module_index: number }): void {
  trackAnalyticsEvent('Module Completed', props);
}

/* ───────────── Lifecycle ───────────── */

/** Spec: `signup_method`. Fire after signup auth returns success, AFTER
 *  identify. See divergence note re: non-email methods. */
export function trackSignUpCompleted(props: { signup_method: string }): void {
  trackAnalyticsEvent('Sign Up Completed', props);
}

/** Spec: `login_method`. MUST fire only on user-initiated login — never
 *  session rehydration / token refresh / app resume. Fire AFTER identify. */
export function trackLoginCompleted(props: {
  login_method: 'email' | 'microsoft_auth' | 'microsoft_sso' | 'mobile';
}): void {
  trackAnalyticsEvent('Login Completed', props);
}

/** Spec: no properties. */
export function trackOnboardingCompleted(): void {
  trackAnalyticsEvent('Onboarding Completed');
}

/* ───────────── Pair lifecycle ───────────── */

/** Spec: `pair_type, invite_method, pair_id`. */
export function trackPairInviteSent(props: {
  pair_type: 'DUAL' | 'PUSH' | 'PULL';
  invite_method: 'email' | 'link';
  pair_id: number;
}): void {
  trackAnalyticsEvent('Pair Invite Sent', props);
}

/** Spec: `pair_id`. Fires only on acceptance. */
export function trackPairCreated(props: { pair_id: number }): void {
  trackAnalyticsEvent('Pair Created', props);
}

/** Spec: new event, fires when an invite is rejected. No props in spec —
 *  using { pair_id } for lifecycle parity (flagged). */
export function trackPairInviteRejected(props: { pair_id: number }): void {
  trackAnalyticsEvent('Pair Invite Rejected', props);
}

/** Spec: no properties. */
export function trackPairRemoved(): void {
  trackAnalyticsEvent('Pair Removed');
}

/* ───────────── Group lifecycle ───────────── */

/** Spec: no properties. */
export function trackGroupCreated(): void {
  trackAnalyticsEvent('Group Created');
}

/** Spec: no properties. */
export function trackGroupInviteAccepted(): void {
  trackAnalyticsEvent('Group Invite Accepted');
}

/* ───────────── Support operations ─────────────
 * SAFETY-CRITICAL: all three carry the SAME `support_request_id` for a given
 * request (always the support request's `.id`), or the time-to-resolution
 * funnels can't compute. */

export function trackSupportRequestCreated(props: { support_request_id: number }): void {
  trackAnalyticsEvent('Support Request Created', props);
}

export function trackSupportRequestContactAttempted(props: { support_request_id: number }): void {
  trackAnalyticsEvent('Support Request Contact Attempted', props);
}

/** Spec: `support_request_id, resolution`. */
export function trackSupportRequestResolved(props: {
  support_request_id: number;
  resolution: string;
}): void {
  trackAnalyticsEvent('Support Request Resolved', props);
}
