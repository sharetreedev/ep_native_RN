import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import LottieView from 'lottie-react-native';

interface LoadingAnimationProps {
  /** Width & height of the animation container (default 120) */
  size?: number;
  /** Extra styles applied to the outer wrapper */
  style?: ViewStyle;
}

/**
 * EP line-logo Lottie animation used as the standard loading indicator.
 *
 * Drop-in replacement for ActivityIndicator anywhere in the app:
 *
 *   <LoadingAnimation />
 *   <LoadingAnimation size={80} />
 */
export default function LoadingAnimation({ size = 120, style }: LoadingAnimationProps) {
  return (
    <View style={[styles.container, style]}>
      <LottieView
        source={require('../../assets/ep-line-animation.json')}
        autoPlay
        loop
        style={{ width: size, height: size }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
