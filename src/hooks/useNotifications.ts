import { useState, useCallback, useEffect } from 'react';
import { notification as xanoNotification, XanoNotification, XanoNotificationList } from '../api';
import { useAsyncHandler } from './useAsyncHandler';

interface UseNotificationsResult {
  notifications: XanoNotification[];
  pagination: Omit<XanoNotificationList, 'items'> | null;
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  markRead: (notificationId: number) => Promise<void>;
  markAllRead: (notificationIds: number[]) => Promise<void>;
}

export function useNotifications(): UseNotificationsResult {
  const [notifications, setNotifications] = useState<XanoNotification[]>([]);
  const [pagination, setPagination] = useState<Omit<XanoNotificationList, 'items'> | null>(null);
  const { isLoading, error, wrap } = useAsyncHandler();

  const fetch = useCallback(async () => {
    const data = await wrap(() => xanoNotification.getAll());
    if (data) {
      setNotifications(data.items ?? []);
      const { items: _, ...paging } = data;
      setPagination(paging);
    }
  }, [wrap]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const markRead = useCallback(async (notificationId: number) => {
    const updated = await wrap(() => xanoNotification.markRead(notificationId));
    if (updated) {
      setNotifications(prev =>
        prev.map(n => n.id === updated.id ? updated : n),
      );
    }
  }, [wrap]);

  const markAllRead = useCallback(async (notificationIds: number[]) => {
    const result = await wrap(() => xanoNotification.markAllRead(notificationIds));
    if (result) {
      setNotifications(prev =>
        prev.map(n => notificationIds.includes(n.id) ? { ...n, read: true } : n),
      );
    }
  }, [wrap]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    pagination,
    unreadCount,
    isLoading,
    error,
    refetch: fetch,
    markRead,
    markAllRead,
  };
}
