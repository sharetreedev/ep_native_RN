import { request } from './client';
import type { XanoNotificationList, XanoNotification } from './types';

// SPEC NOTE: swagger types most fields on these endpoints as optional, but
// consumers (NotificationsContext, NotificationsScreen) treat id/type/read as
// required. Keep hand-rolled types until the spec marks the required fields.
// Also: `notification/mark_all_read` is declared as `{}` in the spec but
// actually returns `{ success: boolean }`.
export const notification = {
  getAll: () =>
    request<XanoNotificationList>('GET', '/notification/get_all'),

  markRead: (notificationId: number) =>
    request<XanoNotification>('PATCH', '/notification/mark_read', { notification_id: notificationId }),

  markAllRead: (notificationIds: number[]) =>
    request<{ success: boolean }>('POST', '/notification/mark_all_read', { notification_ids: notificationIds }),
};
