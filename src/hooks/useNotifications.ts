import { useNotificationsContext } from '../contexts/NotificationsContext';

/**
 * Backwards-compatible wrapper around `NotificationsContext`. Previously this
 * was a stand-alone hook with per-instance state, which meant marking-read on
 * one screen left other screens (e.g. the MyPulse header dot) showing stale
 * unread counts. All notification state now lives in a single provider so
 * every consumer reads the same source of truth.
 */
export function useNotifications() {
  return useNotificationsContext();
}
