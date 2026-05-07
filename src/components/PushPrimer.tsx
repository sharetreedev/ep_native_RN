import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Bell } from 'lucide-react-native';
import ConfirmModal from './ConfirmModal';
import { colors } from '../theme';
import { logger } from '../lib/logger';

// Match the AuthContext pattern: load OneSignal once at module scope so
// Metro doesn't re-bundle on every render.
let OneSignalModule: any = null;
if (Platform.OS !== 'web') {
  try {
    OneSignalModule = require('react-native-onesignal').OneSignal;
  } catch {
    // Native module not available (e.g. Expo Go) — leave null.
  }
}

const STORAGE_KEY = 'push_primer_shown_v1';

/**
 * One-time soft prompt that explains why Pulse wants push permission before
 * the iOS system dialog appears. Both stores prefer context-first prompts;
 * mental-health apps in particular lose users at the bare system prompt.
 *
 * Tracked via SecureStore so it shows at most once per install.
 * Mounted inside the authenticated branch of AppNavigator.
 */
export default function PushPrimer() {
  const [visible, setVisible] = useState(false);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if (!OneSignalModule) return;
    (async () => {
      try {
        const seen = await SecureStore.getItemAsync(STORAGE_KEY);
        if (!seen) setVisible(true);
      } catch (e) {
        logger.warn('[PushPrimer] SecureStore read failed:', e);
      }
    })();
  }, []);

  const persistShown = async () => {
    try {
      await SecureStore.setItemAsync(STORAGE_KEY, '1');
    } catch (e) {
      logger.warn('[PushPrimer] SecureStore write failed:', e);
    }
  };

  const handleEnable = async () => {
    setRequesting(true);
    try {
      await OneSignalModule?.Notifications?.requestPermission(true);
    } catch (e) {
      logger.warn('[PushPrimer] requestPermission failed:', e);
    }
    await persistShown();
    setRequesting(false);
    setVisible(false);
  };

  const handleDismiss = async () => {
    await persistShown();
    setVisible(false);
  };

  return (
    <ConfirmModal
      visible={visible}
      onClose={handleDismiss}
      onConfirm={handleEnable}
      title="Stay in tune with your emotions"
      message="Get a gentle daily nudge to check in, plus alerts when a pair sends a support request or your MHFR responds. We won't spam you — only what you've asked for. You can change this any time in Reminders."
      confirmText="Enable reminders"
      cancelText="Maybe later"
      loading={requesting}
      variant="bottom"
      icon={<Bell color={colors.primary} size={28} />}
    />
  );
}
