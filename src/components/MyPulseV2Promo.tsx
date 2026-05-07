import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { X } from 'lucide-react-native';
import { RootStackParamList } from '../types/navigation';
import { useMyPulseVersion } from '../hooks/useMyPulseVersion';
import { useCheckIn } from '../contexts/CheckInContext';
import { colors, fonts, fontSizes, borderRadius, spacing } from '../theme';
import { logger } from '../lib/logger';

const STORAGE_KEY = 'mypulse_v2_promo_dismissed_v1';

export default function MyPulseV2Promo() {
  const { version, loading } = useMyPulseVersion();
  const { hasCheckedInToday } = useCheckIn();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [visible, setVisible] = useState(false);
  const { width: windowWidth } = useWindowDimensions();
  const cardWidth = windowWidth - 64;

  useEffect(() => {
    if (loading) return;
    if (version === 'v2') return;
    if (!hasCheckedInToday) return;
    (async () => {
      try {
        const seen = await SecureStore.getItemAsync(STORAGE_KEY);
        if (!seen) setVisible(true);
      } catch (e) {
        logger.warn('[MyPulseV2Promo] SecureStore read failed:', e);
      }
    })();
  }, [loading, version, hasCheckedInToday]);

  const persistDismissed = async () => {
    try {
      await SecureStore.setItemAsync(STORAGE_KEY, '1');
    } catch (e) {
      logger.warn('[MyPulseV2Promo] SecureStore write failed:', e);
    }
  };

  const handleDismiss = async () => {
    setVisible(false);
    await persistDismissed();
  };

  const handleTryItOut = async () => {
    setVisible(false);
    await persistDismissed();
    navigation.navigate('AccountSettings');
  };

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={handleDismiss}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={handleDismiss}>
        <TouchableWithoutFeedback>
          <View
            style={[styles.card, { width: cardWidth }]}
            accessibilityViewIsModal
            accessibilityLiveRegion="polite"
          >
            <Image
              source={require('../../assets/mypulse_2.png')}
              style={{ width: cardWidth, height: cardWidth }}
              resizeMode="cover"
              accessibilityIgnoresInvertColors
            />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleDismiss}
              accessibilityRole="button"
              accessibilityLabel="Close"
              hitSlop={8}
            >
              <X color="#FFFFFF" size={20} />
            </TouchableOpacity>
            <View style={styles.body}>
              <Text style={styles.title}>Introducing MyPulse 2.0</Text>
              <TouchableOpacity
                style={styles.cta}
                onPress={handleTryItOut}
                accessibilityRole="button"
                accessibilityLabel="Try MyPulse 2.0"
              >
                <Text style={styles.ctaText}>Try it out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.overlay,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: fontSizes.xl,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  cta: {
    alignSelf: 'stretch',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.base,
    color: colors.textOnPrimary,
  },
});
