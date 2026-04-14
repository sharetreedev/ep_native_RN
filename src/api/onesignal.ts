import { request } from './client';

export const onesignal = {
  /** Update the current user's OneSignal subscription ID. */
  updateSubscriptionId: (onesignal_subscription_id: string) =>
    request<{ message: string }>(
      'POST',
      '/auth/update_onesignal_subscription_id',
      { onesignal_subscription_id },
    ),
};
