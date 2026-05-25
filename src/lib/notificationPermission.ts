import { Platform } from 'react-native';
import { logger } from './logger';

/**
 * Notification permission helper.
 *
 * Mirrors the OneSignal access pattern in PushPrimer.tsx so the new
 * onboarding step and the existing primer share the same plumbing. Both
 * gracefully degrade when the native module isn't available (Expo Go).
 */

let OneSignalModule: any = null;
if (Platform.OS !== 'web') {
  try {
    OneSignalModule = require('react-native-onesignal').OneSignal;
  } catch {
    // Native module not available (e.g. Expo Go) — leave null.
  }
}

/** True when push permission is already granted, false otherwise. */
export async function hasNotificationPermission(): Promise<boolean> {
  if (!OneSignalModule) return false;
  try {
    return Boolean(await OneSignalModule?.Notifications?.getPermissionAsync?.());
  } catch (e) {
    logger.warn('[notificationPermission] check failed:', e);
    return false;
  }
}

/**
 * Request push permission. Triggers the OS dialog the first time on iOS;
 * subsequent calls are no-ops once the user has chosen.
 * Returns true if granted after the request, false otherwise.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!OneSignalModule) return false;
  try {
    await OneSignalModule?.Notifications?.requestPermission(true);
  } catch (e) {
    logger.warn('[notificationPermission] request failed:', e);
  }
  return hasNotificationPermission();
}
