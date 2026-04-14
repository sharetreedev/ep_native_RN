import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import EmotionDetailSheet from '../EmotionDetailSheet';
import { MappedEmotion } from '../../hooks/useEmotionStates';
import { XanoStateCoordinate } from '../../api';
import { colors, fonts, fontSizes, buttonStyles } from '../../theme';
import MeshGradientPalette from './meshGradient/MeshGradientPalette';
import MeshGradientResult from './meshGradient/MeshGradientResult';
import {
  PADDING,
  PALETTE_ACTUAL,
  HAPTIC_THROTTLE_MS,
  buildEmotionGrid,
  buildQuadrantColors,
  findEmotionAtPosition,
  findBestCoordinate,
} from './meshGradient/meshGradientUtils';

interface MeshGradientSliderProps {
  emotions: MappedEmotion[];
  coordinates: XanoStateCoordinate[];
  onComplete: (emotion: MappedEmotion, coordinateId: number, needsAttention?: boolean) => void;
}

export default function MeshGradientSlider({ emotions, coordinates, onComplete }: MeshGradientSliderProps) {
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [matchedEmotion, setMatchedEmotion] = useState<MappedEmotion | null>(null);
  const [matchedCoord, setMatchedCoord] = useState<XanoStateCoordinate | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const lastHapticRef = useRef<number>(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const contentShiftAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    if (matchedEmotion) {
      Animated.spring(contentShiftAnim, {
        toValue: -60,
        useNativeDriver: true,
        tension: 50,
        friction: 10,
      }).start();
    }
  }, [matchedEmotion]);

  const quadrantColors = useMemo(() => buildQuadrantColors(emotions), [emotions]);
  const emotionGrid = useMemo(() => buildEmotionGrid(emotions), [emotions]);

  const handleTouch = useCallback(
    (x: number, y: number) => {
      const clampedX = Math.max(0, Math.min(PALETTE_ACTUAL, x));
      const clampedY = Math.max(0, Math.min(PALETTE_ACTUAL, y));

      setCursorPos({ x: clampedX, y: clampedY });

      // Continuous haptic feedback (throttled)
      const now = Date.now();
      if (now - lastHapticRef.current >= HAPTIC_THROTTLE_MS) {
        Haptics.selectionAsync();
        lastHapticRef.current = now;
      }

      const emotion = findEmotionAtPosition(emotionGrid, clampedX, clampedY);
      if (emotion) {
        setMatchedEmotion(emotion);
        setMatchedCoord(findBestCoordinate(coordinates, emotion, clampedX, clampedY));
      }
    },
    [emotionGrid, coordinates]
  );

  const handleTouchStart = useCallback(
    (x: number, y: number) => {
      setIsDragging(true);
      lastHapticRef.current = 0;
      handleTouch(x, y);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    [handleTouch]
  );

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const handleConfirm = () => {
    if (matchedEmotion && matchedCoord) {
      onComplete(matchedEmotion, matchedCoord.id, !!matchedCoord.needs_attention);
    }
  };

  const handleReset = () => {
    Animated.spring(contentShiftAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 50,
      friction: 10,
    }).start();
    setCursorPos(null);
    setMatchedEmotion(null);
    setMatchedCoord(null);
  };

  return (
    <View style={styles.outerContainer}>
      <Animated.View style={[styles.containerCentered, { opacity: fadeAnim, transform: [{ scale: scaleAnim }, { translateY: contentShiftAnim }] }]}>
        <Text style={styles.heading}>How are you feeling?</Text>

        <MeshGradientPalette
          cursorPos={cursorPos}
          isDragging={isDragging}
          quadrantColors={quadrantColors}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouch}
          onTouchEnd={handleTouchEnd}
        >
          <MeshGradientResult
            matchedEmotion={matchedEmotion}
            onShowDetail={() => setShowDetail(true)}
          />
        </MeshGradientPalette>

        <EmotionDetailSheet
          emotion={matchedEmotion}
          visible={showDetail}
          onClose={() => setShowDetail(false)}
          clusterEmotions={emotions.filter(
            (e) =>
              matchedEmotion &&
              e.energy === matchedEmotion.energy &&
              e.pleasantness === matchedEmotion.pleasantness
          )}
        />

      </Animated.View>

      {/* Footer — outside animated content so it stays pinned at bottom */}
      {matchedEmotion && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              buttonStyles.primary.container,
              (isDragging || !matchedCoord) && buttonStyles.primary.disabled,
            ]}
            onPress={handleConfirm}
            disabled={isDragging || !matchedCoord}
            activeOpacity={0.8}
          >
            <Text style={buttonStyles.primary.text}>Check In</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleReset} style={styles.resetButton}>
            <Text style={styles.resetButtonText}>Reset</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
  },
  containerCentered: {
    flex: 1,
    justifyContent: 'center',
    marginTop: -80,
  },
  heading: {
    fontSize: fontSizes['2xl'],
    fontFamily: fonts.heading,
    fontWeight: 'bold',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: PADDING,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 20,
    paddingTop: 16,
    paddingHorizontal: PADDING,
  },
  resetButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  resetButtonText: {
    color: colors.textMuted,
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.md,
  },
});
