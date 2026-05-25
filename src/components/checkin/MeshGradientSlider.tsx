import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { MappedEmotion } from '../../hooks/useEmotionStates';
import { useReduceMotion } from '../../hooks/useReduceMotion';
import { XanoStateCoordinate } from '../../api';
import { colors, fonts, fontSizes, buttonStyles } from '../../theme';
import EmotionDetailContent from '../EmotionDetailContent';
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

type ViewMode = 'palette' | 'detail';

function capitalize(s: string): string {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function MeshGradientSlider({ emotions, coordinates, onComplete }: MeshGradientSliderProps) {
  const reduceMotion = useReduceMotion();
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [matchedEmotion, setMatchedEmotion] = useState<MappedEmotion | null>(null);
  const [matchedCoord, setMatchedCoord] = useState<XanoStateCoordinate | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('palette');
  const lastHapticRef = useRef<number>(0);

  // Initial mount fade/scale (palette appears) — kept from previous version.
  const fadeAnim = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;
  const scaleAnim = useRef(new Animated.Value(reduceMotion ? 1 : 0.9)).current;

  // Palette zoom-out animation when transitioning to the detail view.
  // 1 = normal palette, 2.8 = fully zoomed/scaled out (matches WeWeb).
  const paletteZoomAnim = useRef(new Animated.Value(1)).current;
  const paletteOpacityAnim = useRef(new Animated.Value(1)).current;
  // Detail card opacity — fades in slightly after the palette starts zooming.
  const detailOpacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduceMotion) {
      fadeAnim.setValue(1);
      scaleAnim.setValue(1);
      return;
    }
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
  }, [reduceMotion]);

  const quadrantColors = useMemo(() => buildQuadrantColors(emotions), [emotions]);
  const emotionGrid = useMemo(() => buildEmotionGrid(emotions), [emotions]);

  // ── Touch handlers ──────────────────────────────────────────────────
  const handleTouch = useCallback(
    (x: number, y: number) => {
      const clampedX = Math.max(0, Math.min(PALETTE_ACTUAL, x));
      const clampedY = Math.max(0, Math.min(PALETTE_ACTUAL, y));

      setCursorPos({ x: clampedX, y: clampedY });

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

  // Drag-and-release on a matched emotion → zoom out the palette and reveal
  // the inline detail view. This is the explicit user-requested flow.
  const openDetail = useCallback(() => {
    setViewMode('detail');
    if (reduceMotion) {
      paletteZoomAnim.setValue(2.8);
      paletteOpacityAnim.setValue(0);
      detailOpacityAnim.setValue(1);
      return;
    }
    Animated.parallel([
      Animated.timing(paletteZoomAnim, {
        toValue: 2.8,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(paletteOpacityAnim, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(detailOpacityAnim, {
        toValue: 1,
        duration: 350,
        delay: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, [reduceMotion]);

  const closeDetail = useCallback(() => {
    if (reduceMotion) {
      paletteZoomAnim.setValue(1);
      paletteOpacityAnim.setValue(1);
      detailOpacityAnim.setValue(0);
      setViewMode('palette');
      return;
    }
    Animated.parallel([
      Animated.timing(detailOpacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(paletteZoomAnim, {
        toValue: 1,
        duration: 450,
        delay: 100,
        useNativeDriver: true,
      }),
      Animated.timing(paletteOpacityAnim, {
        toValue: 1,
        duration: 300,
        delay: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setViewMode('palette');
    });
  }, [reduceMotion]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // If the user has landed the lens on a valid emotion, open the detail
    // view automatically. The "Pick another emotion" button in the detail
    // view brings them back to the palette to refine.
    if (matchedEmotion) {
      openDetail();
    }
  }, [matchedEmotion, openDetail]);

  const handleConfirm = () => {
    if (matchedEmotion && matchedCoord) {
      onComplete(matchedEmotion, matchedCoord.id, !!matchedCoord.needs_attention);
    }
  };

  // ── Inline detail content (the "see more" card body) ─────────────────
  const clusterEmotions = useMemo(() => {
    if (!matchedEmotion) return [];
    return emotions.filter(
      (e) =>
        e.energy === matchedEmotion.energy && e.pleasantness === matchedEmotion.pleasantness
    );
  }, [emotions, matchedEmotion]);

  return (
    <View style={styles.outerContainer}>
      {/* ── Palette layer ── */}
      <Animated.View
        pointerEvents={viewMode === 'palette' ? 'auto' : 'none'}
        style={[
          styles.paletteLayer,
          {
            opacity: Animated.multiply(fadeAnim, paletteOpacityAnim),
            transform: [{ scale: Animated.multiply(scaleAnim, paletteZoomAnim) }],
          },
        ]}
      >
        <Text style={styles.heading}>How are you feeling?</Text>

        <MeshGradientPalette
          emotionGrid={emotionGrid}
          cursorPos={cursorPos}
          isDragging={isDragging}
          quadrantColors={quadrantColors}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouch}
          onTouchEnd={handleTouchEnd}
        >
          <MeshGradientResult
            matchedEmotion={matchedEmotion}
            onShowDetail={openDetail}
          />
        </MeshGradientPalette>
      </Animated.View>

      {/* ── Detail layer (inline, replaces palette when open) ── */}
      {viewMode === 'detail' && matchedEmotion && (
        <Animated.View
          style={[styles.detailLayer, { opacity: detailOpacityAnim }]}
        >
          <ScrollView
            style={styles.detailScroll}
            contentContainerStyle={styles.detailScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <EmotionDetailContent
              emotion={matchedEmotion}
              clusterEmotions={clusterEmotions}
            />
          </ScrollView>

          <View style={styles.detailFooter}>
            <TouchableOpacity
              style={[
                buttonStyles.primary.container,
                !matchedCoord && buttonStyles.primary.disabled,
              ]}
              onPress={handleConfirm}
              disabled={!matchedCoord}
              activeOpacity={0.8}
            >
              {!matchedCoord ? (
                <ActivityIndicator color={colors.textOnPrimary} />
              ) : (
                <Text style={buttonStyles.primary.text}>
                  Check in as {capitalize(matchedEmotion.name)}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={closeDetail} style={styles.pickAnotherButton} activeOpacity={0.7}>
              <Text style={styles.pickAnotherText}>{'< Pick another emotion'}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
  },
  paletteLayer: {
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
  detailLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background,
  },
  detailScroll: {
    flex: 1,
  },
  detailScrollContent: {
    paddingHorizontal: PADDING,
    paddingTop: 24,
    paddingBottom: 8,
  },
  detailFooter: {
    paddingHorizontal: PADDING,
    paddingTop: 12,
    paddingBottom: 20,
  },
  pickAnotherButton: {
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 8,
  },
  pickAnotherText: {
    color: colors.textSecondary,
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.md,
  },
});
