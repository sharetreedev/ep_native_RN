import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, fontSizes } from '../theme';
import PulseLoader from './PulseLoader';
import { subscribeRuntimeReset } from '../lib/resetRuntime';

/**
 * Full-screen branded overlay shown while the JS runtime is being reset
 * (logout, account deletion, account merge). Subscribes to the module-level
 * `resetRuntime` state on mount — the reset helper pushes visibility +
 * message updates, and we fade the overlay in over ~250ms before the reload
 * actually triggers. Rendering this above the rest of the app means the
 * tear-down (and any half-rendered context state during it) is fully hidden.
 *
 * Mount this as a sibling to the main app tree, *outside* any auth-gated
 * conditionals, so it's available the instant any code path calls
 * `resetAndReload`.
 */
export default function RuntimeResetSplash() {
  const [state, setState] = useState<{ visible: boolean; message: string }>({
    visible: false,
    message: '',
  });
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => subscribeRuntimeReset(setState), []);

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: state.visible ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [state.visible, opacity]);

  if (!state.visible) return null;

  return (
    <Animated.View
      style={[styles.overlay, { opacity }]}
      pointerEvents="auto"
      accessibilityViewIsModal
      accessibilityLabel={state.message}
    >
      <View style={styles.content}>
        <Image source={require('../../assets/Logo.png')} style={styles.logo} />
        <Text style={styles.brand} allowFontScaling={false}>
          Emotional Pulse
        </Text>
        <View style={styles.loaderWrap}>
          <PulseLoader size={64} />
        </View>
        <Text style={styles.message} allowFontScaling={false}>
          {state.message}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    elevation: 9999,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logo: {
    width: 64,
    height: 64,
    marginBottom: 12,
    resizeMode: 'contain',
  },
  brand: {
    fontFamily: fonts.heading,
    fontSize: fontSizes['2xl'],
    color: colors.textPrimary,
    marginBottom: 24,
  },
  loaderWrap: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  message: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
