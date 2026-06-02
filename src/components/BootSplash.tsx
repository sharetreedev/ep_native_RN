import React, { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { colors } from '../theme';

// Full-bleed brand logo. Its background is colors.primary (#91A27D), so the
// container colour below matches it seamlessly — the image can finish
// decoding a frame late without any visible colour pop.
const LOGO = require('../../assets/Logo.png');

interface BootSplashProps {
  /** Flip true once the app shell is ready; the splash fades out, then unmounts. */
  ready: boolean;
  /** Called after the fade-out completes so the parent can stop rendering it. */
  onFinish: () => void;
}

/**
 * JS-controlled splash that shows the wide pulse logo edge-to-edge.
 *
 * Why this exists: on Android 12+ the OS launch splash forces the image into
 * a fixed centred circle and crops anything outside it — so the wide logo
 * can't live there. Instead we keep the native splash minimal and, the moment
 * this view paints, hand off to it (hide the native splash) so the full-bleed
 * logo is what the user actually perceives. It stays up until the app is ready,
 * then fades out.
 */
export default function BootSplash({ ready, onFinish }: BootSplashProps) {
  const opacity = useRef(new Animated.Value(1)).current;

  // Hand off from the native splash once our view has painted: hiding the OS
  // splash reveals the identical green/logo underneath with no gap (and clears
  // the lingering Android-12 circle).
  const handleLayout = () => {
    SplashScreen.hideAsync().catch(() => {});
  };

  useEffect(() => {
    if (!ready) return;
    Animated.timing(opacity, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) onFinish();
    });
  }, [ready, opacity, onFinish]);

  return (
    <Animated.View
      style={[styles.fill, { opacity }]}
      onLayout={handleLayout}
      pointerEvents="none"
    >
      <Image source={LOGO} style={styles.logo} resizeMode="cover" />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.primary,
    zIndex: 9999,
    elevation: 9999,
  },
  logo: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
});
