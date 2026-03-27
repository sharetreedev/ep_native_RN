import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState,
  LayoutChangeEvent,
  Animated,
} from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import EmotionBadge from '../EmotionBadge';
import EmotionDetailSheet from '../EmotionDetailSheet';
import CoordinatePicker from './CoordinatePicker';
import { MappedEmotion } from '../../hooks/useEmotionStates';
import { XanoStateCoordinate } from '../../api';
import { colors, fonts, fontSizes, borderRadius, spacing } from '../../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PADDING = 20;
const PALETTE_ACTUAL = SCREEN_WIDTH - PADDING * 2;
const CURSOR_SIZE = 32;
const AXIS_FONT_SIZE = fontSizes.md;
const HAPTIC_THROTTLE_MS = 80;

interface MeshGradientSliderProps {
  emotions: MappedEmotion[];
  coordinates: XanoStateCoordinate[];
  onComplete: (emotion: MappedEmotion, coordinateId: number, needsAttention?: boolean) => void;
}

export default function MeshGradientSlider({ emotions, coordinates, onComplete }: MeshGradientSliderProps) {
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [matchedEmotion, setMatchedEmotion] = useState<MappedEmotion | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showCoordinatePicker, setShowCoordinatePicker] = useState(false);
  const paletteOriginRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastHapticRef = useRef<number>(0);
  const handleTouchRef = useRef<(x: number, y: number) => void>(() => {});
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

  const BASE_BG = '#f5f3ee';

  // Get themeColour for each quadrant from a representative emotion
  const quadrantColors = useMemo(() => {
    const pick = (energy: 'high' | 'low', pleasantness: 'high' | 'low') => {
      const match = emotions.find(
        (e) => e.energy === energy && e.pleasantness === pleasantness
      );
      return match?.themeColour || match?.emotionColour || '#CCCCCC';
    };
    return {
      topLeft: pick('high', 'low'),
      topRight: pick('high', 'high'),
      bottomLeft: pick('low', 'low'),
      bottomRight: pick('low', 'high'),
    };
  }, [emotions]);

  const findEmotionAtPosition = useCallback(
    (x: number, y: number): MappedEmotion | null => {
      const normalizedX = Math.max(0, Math.min(1, x / PALETTE_ACTUAL));
      const normalizedY = Math.max(0, Math.min(1, y / PALETTE_ACTUAL));

      const isHighEnergy = normalizedY < 0.5;
      const isPleasant = normalizedX >= 0.5;

      const quadrantEmotions = emotions.filter(
        (e) =>
          (isHighEnergy ? e.energy === 'high' : e.energy === 'low') &&
          (isPleasant ? e.pleasantness === 'high' : e.pleasantness === 'low')
      );

      if (quadrantEmotions.length === 0) return null;

      const qx = isPleasant ? (normalizedX - 0.5) * 2 : normalizedX * 2;
      const qy = isHighEnergy ? normalizedY * 2 : (normalizedY - 0.5) * 2;

      const subCol = qx >= 0.5 ? 1 : 0;
      const subRow = qy >= 0.5 ? 1 : 0;

      const sorted = [...quadrantEmotions].sort((a, b) => a.xanoId - b.xanoId);

      const index = subRow * 2 + subCol;
      return sorted[Math.min(index, sorted.length - 1)] ?? null;
    },
    [emotions]
  );

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

      const emotion = findEmotionAtPosition(clampedX, clampedY);
      if (emotion) {
        setMatchedEmotion(emotion);
      }
    },
    [findEmotionAtPosition]
  );

  handleTouchRef.current = handleTouch;

  const handlePaletteLayout = useCallback((e: LayoutChangeEvent) => {
    (e.target as any).measureInWindow((pageX: number, pageY: number) => {
      paletteOriginRef.current = { x: pageX, y: pageY };
    });
  }, []);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt: GestureResponderEvent) => {
          setIsDragging(true);
          lastHapticRef.current = 0;

          const touchX = evt.nativeEvent.pageX - paletteOriginRef.current.x;
          const touchY = evt.nativeEvent.pageY - paletteOriginRef.current.y;
          handleTouchRef.current(touchX, touchY);

          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        },
        onPanResponderMove: (evt: GestureResponderEvent, _gesture: PanResponderGestureState) => {
          const touchX = evt.nativeEvent.pageX - paletteOriginRef.current.x;
          const touchY = evt.nativeEvent.pageY - paletteOriginRef.current.y;
          handleTouchRef.current(touchX, touchY);
        },
        onPanResponderRelease: () => {
          setIsDragging(false);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        },
      }),
    []
  );

  const handleConfirm = () => {
    if (matchedEmotion) {
      setShowCoordinatePicker(true);
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
  };

  if (showCoordinatePicker && matchedEmotion) {
    return (
      <CoordinatePicker
        emotion={matchedEmotion}
        coordinates={coordinates}
        clusterEmotions={emotions.filter(
          (e) => e.energy === matchedEmotion.energy && e.pleasantness === matchedEmotion.pleasantness
        )}
        onSelect={onComplete}
        onBack={() => setShowCoordinatePicker(false)}
      />
    );
  }

  return (
    <View style={styles.outerContainer}>
    <Animated.View style={[styles.containerCentered, { opacity: fadeAnim, transform: [{ scale: scaleAnim }, { translateY: contentShiftAnim }] }]}>
      <Text style={styles.heading}>How are you feeling?</Text>

      {/* Palette wrapper — allows axis labels to overflow */}
      <View style={styles.paletteWrapper}>
        {/* Clipped gradient palette */}
        <View
          collapsable={false}
          onLayout={handlePaletteLayout}
          style={styles.palette}
          {...panResponder.panHandlers}
        >
          {/* SVG radial gradients — mirrors the web CSS radial-gradient approach */}
          <Svg
            width={PALETTE_ACTUAL}
            height={PALETTE_ACTUAL}
            style={StyleSheet.absoluteFill}
          >
            <Defs>
              <RadialGradient id="tl" cx="0%" cy="0%" r="75%">
                <Stop offset="0%" stopColor={quadrantColors.topLeft} stopOpacity={0.9} />
                <Stop offset="40%" stopColor={quadrantColors.topLeft} stopOpacity={0.5} />
                <Stop offset="70%" stopColor={quadrantColors.topLeft} stopOpacity={0.2} />
                <Stop offset="100%" stopColor={BASE_BG} stopOpacity={0} />
              </RadialGradient>
              <RadialGradient id="tr" cx="100%" cy="0%" r="75%">
                <Stop offset="0%" stopColor={quadrantColors.topRight} stopOpacity={0.9} />
                <Stop offset="40%" stopColor={quadrantColors.topRight} stopOpacity={0.5} />
                <Stop offset="70%" stopColor={quadrantColors.topRight} stopOpacity={0.2} />
                <Stop offset="100%" stopColor={BASE_BG} stopOpacity={0} />
              </RadialGradient>
              <RadialGradient id="bl" cx="0%" cy="100%" r="75%">
                <Stop offset="0%" stopColor={quadrantColors.bottomLeft} stopOpacity={0.9} />
                <Stop offset="40%" stopColor={quadrantColors.bottomLeft} stopOpacity={0.5} />
                <Stop offset="70%" stopColor={quadrantColors.bottomLeft} stopOpacity={0.2} />
                <Stop offset="100%" stopColor={BASE_BG} stopOpacity={0} />
              </RadialGradient>
              <RadialGradient id="br" cx="100%" cy="100%" r="75%">
                <Stop offset="0%" stopColor={quadrantColors.bottomRight} stopOpacity={0.9} />
                <Stop offset="40%" stopColor={quadrantColors.bottomRight} stopOpacity={0.5} />
                <Stop offset="70%" stopColor={quadrantColors.bottomRight} stopOpacity={0.2} />
                <Stop offset="100%" stopColor={BASE_BG} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            {/* Base background */}
            <Rect width="100%" height="100%" fill={BASE_BG} />
            {/* 4 radial gradient layers */}
            <Rect width="100%" height="100%" fill="url(#tl)" />
            <Rect width="100%" height="100%" fill="url(#tr)" />
            <Rect width="100%" height="100%" fill="url(#bl)" />
            <Rect width="100%" height="100%" fill="url(#br)" />
          </Svg>

          {/* Cursor */}
          {cursorPos && (
            <View
              style={[
                styles.cursor,
                {
                  left: cursorPos.x - CURSOR_SIZE / 2,
                  top: cursorPos.y - CURSOR_SIZE / 2,
                  transform: [{ scale: isDragging ? 1.2 : 1 }],
                },
              ]}
            >
              <View style={styles.cursorInner} />
            </View>
          )}
        </View>

        {/* Axis labels rendered after palette so they sit on top */}
        <Text style={[styles.axisLabel, styles.axisTop]} pointerEvents="none">High Energy</Text>
        <Text style={[styles.axisLabel, styles.axisBottom]} pointerEvents="none">Low Energy</Text>
        <Text style={[styles.axisLabel, styles.axisLeft]} pointerEvents="none">Unpleasant</Text>
        <Text style={[styles.axisLabel, styles.axisRight]} pointerEvents="none">Pleasant</Text>

        {/* Below-palette content — absolute so it doesn't shift the palette */}
        <View style={styles.belowPalette} pointerEvents="box-none">
          {!matchedEmotion && (
            <Text style={styles.hintText}>Drag anywhere on the screen</Text>
          )}

          {matchedEmotion && (
            <View style={styles.resultContainer}>
              <View style={styles.badgeRow}>
                <EmotionBadge
                  emotionName={matchedEmotion.name}
                  emotionColour={matchedEmotion.emotionColour || colors.primary}
                />
              </View>

              {matchedEmotion.description ? (
                <TouchableOpacity onPress={() => setShowDetail(true)} activeOpacity={0.7}>
                  <Text style={styles.emotionDescription} numberOfLines={1}>
                    {matchedEmotion.description}
                  </Text>
                  <Text style={styles.seeMore}>See more</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          )}
        </View>
      </View>

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
            styles.confirmButton,
            isDragging && styles.confirmButtonDisabled,
          ]}
          onPress={handleConfirm}
          disabled={isDragging}
          activeOpacity={0.8}
        >
          <Text style={styles.confirmButtonText}>Continue</Text>
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
  paletteWrapper: {
    position: 'relative',
    width: PALETTE_ACTUAL,
    height: PALETTE_ACTUAL,
    alignSelf: 'center',
    overflow: 'visible',
  },
  palette: {
    width: PALETTE_ACTUAL,
    height: PALETTE_ACTUAL,
    borderRadius: borderRadius.xl + 16,
    overflow: 'hidden',
  },
  axisLabel: {
    position: 'absolute',
    fontSize: AXIS_FONT_SIZE,
    fontFamily: fonts.bodySemiBold,
    color: 'rgba(0,0,0,0.45)',
    zIndex: 2,
  },
  axisTop: {
    top: 12,
    left: 0,
    right: 0,
    textAlign: 'center',
  },
  axisBottom: {
    bottom: 12,
    left: 0,
    right: 0,
    textAlign: 'center',
  },
  axisLeft: {
    left: 12,
    top: '50%',
    marginTop: -8,
  },
  axisRight: {
    right: 12,
    top: '50%',
    marginTop: -8,
  },
  belowPalette: {
    position: 'absolute',
    top: PALETTE_ACTUAL + 8,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  hintText: {
    fontSize: fontSizes.base,
    fontFamily: fonts.bodyMedium,
    color: 'rgba(0,0,0,0.35)',
    textAlign: 'center',
    marginTop: 8,
  },
  cursor: {
    position: 'absolute',
    width: CURSOR_SIZE,
    height: CURSOR_SIZE,
    borderRadius: CURSOR_SIZE / 2,
    backgroundColor: 'rgba(255,255,255,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cursorInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  resultContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  emotionDescription: {
    fontSize: fontSizes.base,
    fontFamily: fonts.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
  },
  seeMore: {
    fontFamily: fonts.bodyBold,
    fontWeight: '700',
    color: colors.textMuted,
    fontSize: fontSizes.md,
    textAlign: 'center',
    marginTop: 4,
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
  confirmButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.button,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.4,
  },
  confirmButtonText: {
    color: colors.textOnPrimary,
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.base,
    fontWeight: '700',
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
