import { request } from './client';
import type { XanoNotificationList, XanoNotification } from './types';

export const notification = {
  getAll: () =>
    request<XanoNotificationList>('GET', '/notification/get_all'),

  markRead: (notificationId: number) =>
    request<XanoNotification>('PATCH', '/notification/mark_read', { notification_id: notificationId }),

  markAllRead: (notificationIds: number[]) =>
    request<{ success: boolean }>('POST', '/notification/mark_all_read', { notification_ids: notificationIds }),
};
