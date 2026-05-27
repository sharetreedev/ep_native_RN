import { request } from './client';

// SPEC NOTE: swagger declares this endpoint returns the full Users row, but
// the runtime actually returns `{ message: string }`. Keep hand-rolled shape
// until the spec is corrected. Consumer (AuthContext) ignores the response
// anyway.
export const onesignal = {
  /** Update the current user's OneSignal subscription ID. */
  updateSubscriptionId: (onesignal_subscription_id: string) =>
    request<{ message: string }>(
      'POST',
      '/auth/update_onesignal_subscription_id',
      { onesignal_subscription_id },
    ),
};
