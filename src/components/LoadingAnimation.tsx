import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import LottieView from 'lottie-react-native';

interface LoadingAnimationProps {
  /** Width & height of the animation container (default 120) */
  size?: number;
  /** Extra styles applied to the outer wrapper */
  style?: ViewStyle;
  /**
   * Delay in ms before the loader becomes visible. Prevents a flash of the
   * loader on fast loads (the network call resolves before the loader has
   * had a chance to appear, so the user only sees a brief flicker). Default
   * 0 — visible immediately.
   */
  delay?: number;
}

/**
 * The standard loading indicator across the app.
 *
 * Renders the EP line-logo Lottie animation. Used both as a screen-level
 * loader (full content, larger size) and as an inline loader (smaller size).
 * Anywhere there's a "loading" state that isn't a small spinner inside a
 * button, this is what you want. Button-internal spinners stay as
 * `ActivityIndicator` since the Lottie wouldn't fit the tight context.
 *
 * Examples:
 *   <LoadingAnimation />                  // 120px, screen-level
 *   <LoadingAnimation size={60} />        // smaller, inline
 *   <LoadingAnimation delay={150} />      // skip flash on fast loads
 */
export default function LoadingAnimation({
  size = 120,
  style,
  delay = 0,
}: LoadingAnimationProps) {
  const [visible, setVisible] = useState(delay === 0);

  useEffect(() => {
    if (delay === 0) return;
    const id = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(id);
  }, [delay]);

  if (!visible) return null;

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
