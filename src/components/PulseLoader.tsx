import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import LoadingAnimation from './LoadingAnimation';

interface PulseLoaderProps {
  /** Override the wrapper style (e.g. to use inline instead of full-screen) */
  style?: ViewStyle;
  /** Ring colour — accepted for API compat; ignored by the Lottie animation. */
  color?: string;
  /** Size of the loader animation — defaults to 80 */
  size?: number;
  /** Delay in ms before the loader becomes visible — prevents flash on fast loads */
  delay?: number;
}

/**
 * Full-screen loading panel.
 *
 * Historically this rendered a 3-ring pulsating animation. As of the
 * standard-loader unification, it delegates to `LoadingAnimation` (the EP
 * line-logo Lottie) inside a flex-1 wrapper so every callsite stays
 * working unchanged. All app-wide loading states now share the same look.
 *
 * Keep using `LoadingAnimation` directly when you don't need the
 * full-screen flex wrapper.
 */
export default function PulseLoader({
  style,
  size = 80,
  delay = 0,
}: PulseLoaderProps) {
  return (
    <View
      style={[styles.container, style]}
      accessibilityRole="progressbar"
      accessibilityLabel="Loading"
    >
      <LoadingAnimation size={size} delay={delay} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
});
