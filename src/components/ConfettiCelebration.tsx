import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, Dimensions, StyleSheet } from 'react-native';
import { colors, fonts, fontSizes, borderRadius, spacing } from '../theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CONFETTI_COUNT = 40;
const CONFETTI_COLORS = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A78BFA', '#F472B6', '#34D399', '#60A5FA', '#FB923C'];

interface ConfettiPiece {
  x: Animated.Value;
  y: Animated.Value;
  rotate: Animated.Value;
  color: string;
  size: number;
  isCircle: boolean;
}

interface ConfettiCelebrationProps {
  visible: boolean;
  courseName?: string;
  onComplete?: () => void;
}

export default function ConfettiCelebration({ visible, courseName, onComplete }: ConfettiCelebrationProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pieces = useRef<ConfettiPiece[]>(
    Array.from({ length: CONFETTI_COUNT }, () => ({
      x: new Animated.Value(Math.random() * SCREEN_WIDTH),
      y: new Animated.Value(-20 - Math.random() * 200),
      rotate: new Animated.Value(0),
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: 6 + Math.random() * 8,
      isCircle: Math.random() > 0.5,
    })),
  ).current;

  useEffect(() => {
    if (!visible) return;

    // Reset positions
    pieces.forEach((p) => {
      p.x.setValue(Math.random() * SCREEN_WIDTH);
      p.y.setValue(-20 - Math.random() * 200);
      p.rotate.setValue(0);
    });

    // Fade in the overlay + message
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();

    // Animate confetti falling (no auto-close)
    const animations = pieces.map((p) => {
      const duration = 2000 + Math.random() * 1500;
      const drift = (Math.random() - 0.5) * 120;
      return Animated.parallel([
        Animated.timing(p.y, {
          toValue: SCREEN_HEIGHT + 50,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(p.x, {
          toValue: (p.x as any)._value + drift,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(p.rotate, {
          toValue: 4 + Math.random() * 8,
          duration,
          useNativeDriver: true,
        }),
      ]);
    });

    Animated.stagger(40, animations).start();
  }, [visible]);

  const handleClose = () => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
      onComplete?.();
    });
  };

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {pieces.map((p, i) => {
        const spin = p.rotate.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '360deg'],
        });
        return (
          <Animated.View
            key={i}
            style={[
              styles.piece,
              {
                width: p.size,
                height: p.isCircle ? p.size : p.size * 0.5,
                borderRadius: p.isCircle ? p.size / 2 : 2,
                backgroundColor: p.color,
                transform: [
                  { translateX: p.x },
                  { translateY: p.y },
                  { rotate: spin },
                ],
              },
            ]}
          />
        );
      })}
      <Animated.View style={[styles.messageContainer, { opacity: fadeAnim }]} pointerEvents="box-none">
        <View style={styles.messageBubble}>
          <Text style={styles.emoji}>🎉</Text>
          <Text style={styles.headingText}>Course Completed!</Text>
          <Text style={styles.courseNameText}>✅ {courseName || 'Course'}</Text>

          <TouchableOpacity style={styles.closeButton} onPress={handleClose} activeOpacity={0.8}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  piece: {
    position: 'absolute',
  },
  messageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageBubble: {
    width: SCREEN_WIDTH * 0.9,
    backgroundColor: colors.surface,
    paddingHorizontal: 32,
    paddingTop: 28,
    paddingBottom: 20,
    borderRadius: 20,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
    alignItems: 'center',
  },
  emoji: {
    fontSize: 40,
    textAlign: 'center',
    marginBottom: 8,
  },
  headingText: {
    fontFamily: fonts.heading,
    fontSize: fontSizes['2xl'],
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  courseNameText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.lg,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 24,
  },
  closeButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.button,
    paddingVertical: spacing.md,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  closeButtonText: {
    color: colors.textOnPrimary,
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.base,
    fontWeight: '700',
  },
});
