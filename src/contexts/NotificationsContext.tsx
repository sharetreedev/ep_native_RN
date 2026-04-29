import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { notification as xanoNotification, XanoNotification, XanoNotificationList } from '../api';
import { logger } from '../lib/logger';

interface NotificationsContextValue {
  notifications: XanoNotification[];
  pagination: Omit<XanoNotificationList, 'items'> | null;
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  markRead: (notificationId: number) => Promise<void>;
  markAllRead: (notificationIds: number[]) => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<XanoNotification[]>([]);
  const [pagination, setPagination] = useState<Omit<XanoNotificationList, 'items'> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setPagination(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await xanoNotification.getAll();
      setNotifications(data.items ?? []);
      const { items: _, ...paging } = data;
      setPagination(paging);
    } catch (e: any) {
      logger.warn('[NotificationsContext] fetch failed:', e);
      setError(e?.message ?? 'Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Reset on logout, fetch on login. Keying on `user?.id` so we refetch when
  // the user identity changes (e.g. account switch) but not on every user
  // refresh from AuthContext.
  useEffect(() => {
    refetch();
  }, [user?.id]);

  const markRead = useCallback(async (notificationId: number) => {
    try {
      const updated = await xanoNotification.markRead(notificationId);
      setNotifications((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
    } catch (e) {
      logger.warn('[NotificationsContext] markRead failed:', e);
    }
  }, []);

  const markAllRead = useCallback(async (notificationIds: number[]) => {
    try {
      await xanoNotification.markAllRead(notificationIds);
      setNotifications((prev) =>
        prev.map((n) => (notificationIds.includes(n.id) ? { ...n, read: true } : n)),
      );
    } catch (e) {
      logger.warn('[NotificationsContext] markAllRead failed:', e);
    }
  }, []);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const value = useMemo<NotificationsContextValue>(
    () => ({
      notifications,
      pagination,
      unreadCount,
      isLoading,
      error,
      refetch,
      markRead,
      markAllRead,
    }),
    [notifications, pagination, unreadCount, isLoading, error, refetch, markRead, markAllRead],
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotificationsContext(): NotificationsContextValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotificationsContext must be used within NotificationsProvider');
  return ctx;
}
