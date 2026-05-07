import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { colors } from '../theme';
import { useReduceMotion } from '../hooks/useReduceMotion';

interface PulseLoaderProps {
  /** Override the wrapper style (e.g. to use inline instead of full-screen) */
  style?: ViewStyle;
  /** Ring colour — defaults to brand green */
  color?: string;
  /** Size of the largest ring — defaults to 80 */
  size?: number;
  /** Delay in ms before the loader becomes visible — prevents flash on fast loads */
  delay?: number;
}

const RING_COUNT = 3;
const DURATION = 1500;
const STAGGER = 400;

function Ring({ index, color, size, reduceMotion }: { index: number; color: string; size: number; reduceMotion: boolean }) {
  const progress = useSharedValue(0);

  React.useEffect(() => {
    if (reduceMotion) {
      progress.value = 0;
      return;
    }
    progress.value = withDelay(
      index * STAGGER,
      withRepeat(withTiming(1, { duration: DURATION }), -1, false),
    );
  }, [reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(progress.value, [0, 1], [0.4, 1.2], Extrapolate.CLAMP);
    const opacity = interpolate(progress.value, [0, 0.6, 1], [0.5, 0.2, 0], Extrapolate.CLAMP);
    return {
      transform: [{ scale }],
      opacity,
    };
  });

  return (
    <Animated.View
      style={[
        animatedStyle,
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 2.5,
          borderColor: color,
        },
      ]}
    />
  );
}

export default function PulseLoader({
  style,
  color = colors.primary,
  size = 80,
  delay = 0,
}: PulseLoaderProps) {
  const [visible, setVisible] = useState(delay === 0);
  const reduceMotion = useReduceMotion();

  useEffect(() => {
    if (delay <= 0) return;
    const id = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(id);
  }, [delay]);

  if (!visible) return <View style={[styles.container, style]} />;

  return (
    <View
      style={[styles.container, style]}
      accessibilityRole="progressbar"
      accessibilityLabel="Loading"
    >
      {Array.from({ length: RING_COUNT }).map((_, i) => (
        <Ring key={i} index={i} color={color} size={size} reduceMotion={reduceMotion} />
      ))}
      {/* Static centre dot */}
      <View
        style={[
          styles.dot,
          {
            width: size * 0.15,
            height: size * 0.15,
            borderRadius: (size * 0.15) / 2,
            backgroundColor: color,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  dot: {
    position: 'absolute',
  },
});
