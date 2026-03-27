import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import EmotionDetailSheet from '../EmotionDetailSheet';
import { MappedEmotion } from '../../hooks/useEmotionStates';
import { XanoStateCoordinate } from '../../api';
import { colors, fonts, fontSizes, borderRadius, spacing } from '../../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PADDING = 20;
const TILE_SIZE = SCREEN_WIDTH - PADDING * 2;
const TILE_RADIUS = borderRadius.xl + 20;
const AXIS_FONT_SIZE = fontSizes.md;
const LIGHT_TEXT_EMOTIONS = ['depressed', 'ecstatic', 'enraged', 'blissful'];

function getEmotionFontColor(name: string): string {
  return LIGHT_TEXT_EMOTIONS.includes(name.toLowerCase()) ? '#FFFFFF' : '#1F2937';
}

interface CoordinatePickerProps {
  emotion: MappedEmotion;
  coordinates: XanoStateCoordinate[];
  clusterEmotions?: MappedEmotion[];
  onSelect: (emotion: MappedEmotion, coordinateId: number, needsAttention?: boolean) => void;
  onBack: () => void;
}

type QuadrantKey = 'tl' | 'tr' | 'bl' | 'br';

export default function CoordinatePicker({
  emotion,
  coordinates,
  clusterEmotions = [],
  onSelect,
  onBack,
}: CoordinatePickerProps) {
  const [selectedQuadrant, setSelectedQuadrant] = useState<QuadrantKey | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;

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

  // Filter coordinates for this emotion and map to 2x2 quadrants
  const quadrantMap = useMemo(() => {
    const emotionCoords = coordinates.filter(
      (c) => c.emotion_states_id === emotion.xanoId
    );

    if (emotionCoords.length === 0) return null;

    const sorted = [...emotionCoords].sort((a, b) => {
      const ay = a.yAxis ?? 0;
      const by = b.yAxis ?? 0;
      if (ay !== by) return ay - by;
      return (a.xAxis ?? 0) - (b.xAxis ?? 0);
    });

    const map: Record<QuadrantKey, XanoStateCoordinate | null> = {
      tl: null, tr: null, bl: null, br: null,
    };

    if (sorted.length >= 4) {
      const xValues = sorted.map((c) => c.xAxis ?? 0);
      const yValues = sorted.map((c) => c.yAxis ?? 0);
      const midX = (Math.min(...xValues) + Math.max(...xValues)) / 2;
      const midY = (Math.min(...yValues) + Math.max(...yValues)) / 2;

      for (const coord of sorted) {
        const isLeft = (coord.xAxis ?? 0) < midX;
        const isTop = (coord.yAxis ?? 0) < midY;
        const key: QuadrantKey = isTop
          ? isLeft ? 'tl' : 'tr'
          : isLeft ? 'bl' : 'br';
        if (!map[key]) map[key] = coord;
      }
    } else {
      const keys: QuadrantKey[] = ['tl', 'tr', 'bl', 'br'];
      sorted.forEach((coord, i) => {
        if (i < 4) map[keys[i]] = coord;
      });
    }

    return map;
  }, [coordinates, emotion.xanoId]);

  const handleQuadrantPress = (key: QuadrantKey) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedQuadrant(key);
  };

  const handleConfirm = () => {
    if (selectedQuadrant && quadrantMap) {
      const coord = quadrantMap[selectedQuadrant];
      if (coord) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onSelect(emotion, coord.id, !!coord.needs_attention);
      }
    }
  };

  const tileColor = emotion.emotionColour || colors.primary;
  const fontColor = getEmotionFontColor(emotion.name);

  return (
    <View style={styles.outerContainer}>
      <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <Text style={styles.heading}>How intense is the emotion?</Text>
        <Text style={styles.subheading}>Tap a quadrant to pinpoint your feeling</Text>

        <View style={styles.tileWrapper}>
          {/* Single emotion tile with 4 tap zones */}
          <View style={[styles.tile, { backgroundColor: tileColor }]}>
            {/* Axis labels inside the tile */}
            <Text style={[styles.axisLabel, styles.axisTop, { color: fontColor }]}>High Energy</Text>
            <Text style={[styles.axisLabel, styles.axisBottom, { color: fontColor }]}>Low Energy</Text>
            <Text style={[styles.axisLabel, styles.axisLeft, { color: fontColor }]}>Unpleasant</Text>
            <Text style={[styles.axisLabel, styles.axisRight, { color: fontColor }]}>Pleasant</Text>

            {/* Emotion name centered */}
            <Text style={[styles.emotionName, { color: fontColor }]}>
              {emotion.name.charAt(0).toUpperCase() + emotion.name.slice(1).toLowerCase()}
            </Text>

            {/* 4 quadrant tap zones */}
            <View style={styles.quadrantGrid}>
              <View style={styles.quadrantRow}>
                <TouchableOpacity
                  style={[styles.quadrantZone, selectedQuadrant === 'tl' && styles.quadrantSelected]}
                  onPress={() => handleQuadrantPress('tl')}
                  activeOpacity={0.8}
                />
                <TouchableOpacity
                  style={[styles.quadrantZone, selectedQuadrant === 'tr' && styles.quadrantSelected]}
                  onPress={() => handleQuadrantPress('tr')}
                  activeOpacity={0.8}
                />
              </View>
              <View style={styles.quadrantRow}>
                <TouchableOpacity
                  style={[styles.quadrantZone, selectedQuadrant === 'bl' && styles.quadrantSelected]}
                  onPress={() => handleQuadrantPress('bl')}
                  activeOpacity={0.8}
                />
                <TouchableOpacity
                  style={[styles.quadrantZone, selectedQuadrant === 'br' && styles.quadrantSelected]}
                  onPress={() => handleQuadrantPress('br')}
                  activeOpacity={0.8}
                />
              </View>
            </View>

            {/* Crosshair lines */}
            <View style={styles.crosshairH} pointerEvents="none" />
            <View style={styles.crosshairV} pointerEvents="none" />
          </View>
        </View>

        {/* Description with See more */}
        {emotion.description ? (
          <TouchableOpacity onPress={() => setShowDetail(true)} activeOpacity={0.7}>
            <Text style={styles.emotionDescription} numberOfLines={1}>
              {emotion.description}
            </Text>
            <Text style={styles.seeMore}>See more</Text>
          </TouchableOpacity>
        ) : null}

        <EmotionDetailSheet
          emotion={emotion}
          visible={showDetail}
          onClose={() => setShowDetail(false)}
          clusterEmotions={clusterEmotions}
        />
      </Animated.View>

      {/* Footer — outside animated content, pinned at bottom */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.confirmButton, !selectedQuadrant && styles.confirmButtonDisabled]}
          onPress={handleConfirm}
          disabled={!selectedQuadrant}
          activeOpacity={0.8}
        >
          <Text style={styles.confirmButtonText}>Continue</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: PADDING,
  },
  heading: {
    fontSize: fontSizes['2xl'],
    fontFamily: fonts.heading,
    fontWeight: 'bold',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subheading: {
    fontSize: fontSizes.md,
    fontFamily: fonts.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 24,
  },
  tileWrapper: {
    alignSelf: 'center',
  },
  tile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderRadius: TILE_RADIUS,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emotionName: {
    fontSize: fontSizes['2xl'],
    fontFamily: fonts.headingSemiBold,
    fontWeight: '600',
    textAlign: 'center',
    zIndex: 3,
  },
  quadrantGrid: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
  },
  quadrantRow: {
    flex: 1,
    flexDirection: 'row',
  },
  quadrantZone: {
    flex: 1,
  },
  quadrantSelected: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  crosshairH: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  crosshairV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '50%',
    width: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  axisLabel: {
    position: 'absolute',
    fontSize: AXIS_FONT_SIZE,
    fontFamily: fonts.bodySemiBold,
    opacity: 0.6,
    zIndex: 4,
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
  emotionDescription: {
    fontSize: fontSizes.base,
    fontFamily: fonts.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 20,
  },
  seeMore: {
    fontFamily: fonts.bodyBold,
    fontWeight: '700',
    color: colors.textMuted,
    fontSize: fontSizes.md,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 64,
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
  backButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  backButtonText: {
    color: colors.textMuted,
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.md,
  },
});
