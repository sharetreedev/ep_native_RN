import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import EmotionDetailSheet from '../EmotionDetailSheet';
import CoordinatePicker from './CoordinatePicker';
import { MappedEmotion } from '../../hooks/useEmotionStates';
import { XanoStateCoordinate } from '../../api';
import { colors, fonts, fontSizes, borderRadius, spacing } from '../../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAX_EMOTION_TILES = 4;
const LIGHT_TEXT_EMOTIONS = ['depressed', 'ecstatic', 'enraged', 'blissful'];

function getEmotionFontColor(name: string): string {
  return LIGHT_TEXT_EMOTIONS.includes(name.toLowerCase()) ? '#FFFFFF' : '#1F2937';
}

interface Quadrant {
  key: string;
  label: string;
  energy: 'high' | 'low';
  pleasantness: 'high' | 'low';
  color: string;
  fontColor: string;
}

const QUADRANTS: Quadrant[] = [
  { key: 'high-low', label: 'High Energy\nUnpleasant', energy: 'high', pleasantness: 'low', color: '#CA501C', fontColor: '#FFFFFF' },
  { key: 'high-high', label: 'High Energy\nPleasant', energy: 'high', pleasantness: 'high', color: '#6FAD42', fontColor: '#FFFFFF' },
  { key: 'low-low', label: 'Low Energy\nUnpleasant', energy: 'low', pleasantness: 'low', color: '#9B9D93', fontColor: '#FFFFFF' },
  { key: 'low-high', label: 'Low Energy\nPleasant', energy: 'low', pleasantness: 'high', color: '#7EA8BE', fontColor: '#FFFFFF' },
];

type Step = 'quadrant' | 'emotion' | 'coordinate';

interface QuadrantGridProps {
  emotions: MappedEmotion[];
  coordinates: XanoStateCoordinate[];
  onComplete: (emotion: MappedEmotion, coordinateId: number) => void;
  onCancel?: () => void;
}

export default function QuadrantGrid({ emotions, coordinates, onComplete, onCancel }: QuadrantGridProps) {
  const [step, setStep] = useState<Step>('quadrant');
  const [selectedQuadrant, setSelectedQuadrant] = useState<Quadrant | null>(null);
  const [selectedEmotion, setSelectedEmotion] = useState<MappedEmotion | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const tileAnims = useRef(QUADRANTS.map(() => new Animated.Value(0))).current;
  const emotionTileAnims = useRef(
    Array.from({ length: MAX_EMOTION_TILES }, () => new Animated.Value(0))
  ).current;
  const selectionAnims = useRef(
    Array.from({ length: MAX_EMOTION_TILES }, () => new Animated.Value(1))
  ).current;
  const contentShiftAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(
      80,
      tileAnims.map((anim) =>
        Animated.spring(anim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 50,
          friction: 8,
        })
      )
    ).start();
  }, []);

  const playEmotionEntrance = () => {
    emotionTileAnims.forEach((a) => a.setValue(0));
    Animated.stagger(
      80,
      emotionTileAnims.map((anim) =>
        Animated.spring(anim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 50,
          friction: 8,
        })
      )
    ).start();
  };

  // selectionAnims: 0 = no selection, 1 = this is selected, -1 = another is selected
  const animateSelection = (selectedIdx: number) => {
    const allEmotions = emotionRows.flat();
    allEmotions.forEach((_, i) => {
      Animated.spring(selectionAnims[i], {
        toValue: i === selectedIdx ? 1 : -1,
        useNativeDriver: true,
        tension: 60,
        friction: 8,
      }).start();
    });
  };

  const clearSelection = () => {
    selectionAnims.forEach((anim) => {
      anim.setValue(0);
    });
  };

  const emotionsByQuadrant = useMemo(() => {
    const map: Record<string, MappedEmotion[]> = {};
    for (const q of QUADRANTS) {
      map[q.key] = emotions.filter(
        (e) => e.energy === q.energy && e.pleasantness === q.pleasantness
      );
    }
    return map;
  }, [emotions]);

  const animateTransition = (callback: () => void) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      callback();
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleQuadrantPress = (quadrant: Quadrant) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    contentShiftAnim.setValue(0);
    animateTransition(() => {
      setSelectedQuadrant(quadrant);
      setSelectedEmotion(null);
      clearSelection();
      setStep('emotion');
      setTimeout(playEmotionEntrance, 50);
    });
  };

  const handleEmotionPress = (emotion: MappedEmotion, flatIndex: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedEmotion(emotion);
    animateSelection(flatIndex);
    Animated.spring(contentShiftAnim, {
      toValue: -60,
      useNativeDriver: true,
      tension: 50,
      friction: 10,
    }).start();
  };

  const handleConfirm = () => {
    if (selectedEmotion) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      contentShiftAnim.setValue(0);
      animateTransition(() => {
        setStep('coordinate');
      });
    }
  };

  const handleBack = () => {
    Haptics.selectionAsync();
    animateTransition(() => {
      if (step === 'coordinate') {
        setStep('emotion');
      } else if (step === 'emotion') {
        contentShiftAnim.setValue(0);
        setStep('quadrant');
        setSelectedQuadrant(null);
        setSelectedEmotion(null);
        clearSelection();
      }
    });
  };

  // Build 2x2 emotion grid from the 4 emotions in the selected quadrant
  const emotionRows = useMemo(() => {
    if (!selectedQuadrant) return [];
    const quadEmotions = emotionsByQuadrant[selectedQuadrant.key] ?? [];
    const sorted = [...quadEmotions].sort((a, b) =>
      a.row === b.row ? a.col - b.col : a.row - b.row
    );
    const rows: MappedEmotion[][] = [];
    for (let i = 0; i < sorted.length; i += 2) {
      rows.push(sorted.slice(i, i + 2));
    }
    return rows;
  }, [selectedQuadrant, emotionsByQuadrant]);

  let emotionFlatIdx = 0;

  return (
    <View style={styles.container}>
      <Animated.View style={[step === 'coordinate' ? styles.container : styles.centeredContent, { opacity: fadeAnim, transform: [{ translateY: contentShiftAnim }] }]}>
        {step === 'quadrant' && (
          <>
            <Text style={styles.heading}>How are you feeling?</Text>
            <View style={styles.grid}>
              <View style={styles.gridRow}>
                {QUADRANTS.slice(0, 2).map((q, i) => (
                  <Animated.View
                    key={q.key}
                    style={{
                      opacity: tileAnims[i],
                      transform: [{ scale: tileAnims[i].interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) }],
                    }}
                  >
                    <TouchableOpacity
                      style={[styles.quadrantTile, { backgroundColor: q.color }]}
                      onPress={() => handleQuadrantPress(q)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.quadrantLabel, { color: q.fontColor }]}>
                        {q.label}
                      </Text>
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </View>
              <View style={styles.gridRow}>
                {QUADRANTS.slice(2, 4).map((q, i) => (
                  <Animated.View
                    key={q.key}
                    style={{
                      opacity: tileAnims[i + 2],
                      transform: [{ scale: tileAnims[i + 2].interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) }],
                    }}
                  >
                    <TouchableOpacity
                      style={[styles.quadrantTile, { backgroundColor: q.color }]}
                      onPress={() => handleQuadrantPress(q)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.quadrantLabel, { color: q.fontColor }]}>
                        {q.label}
                      </Text>
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </View>
            </View>
            <View style={styles.centeringSpacer} />
          </>
        )}

        {step === 'emotion' && selectedQuadrant && (
          <>
            <Text style={styles.heading}>What emotion fits best?</Text>
            <Text style={[styles.subheading, { color: selectedQuadrant.color }]}>
              {selectedQuadrant.label.replace('\n', ' · ')}
            </Text>

            <View style={styles.emotionGridWrapper}>
              <View style={styles.emotionGrid}>
                {emotionRows.map((row, rowIdx) => (
                  <View key={rowIdx} style={styles.emotionGridRow}>
                    {row.map((emotion) => {
                      const idx = emotionFlatIdx++;
                      const isSelected = selectedEmotion?.id === emotion.id;
                      const entranceAnim = emotionTileAnims[idx] ?? new Animated.Value(1);
                      const selAnim = selectionAnims[idx] ?? new Animated.Value(0);
                      return (
                        <Animated.View
                          key={emotion.id}
                          style={{
                            zIndex: isSelected ? 2 : 1,
                            opacity: Animated.multiply(
                              entranceAnim,
                              selAnim.interpolate({
                                inputRange: [-1, 0, 1],
                                outputRange: [0.45, 1, 1],
                              })
                            ),
                            transform: [
                              {
                                scale: Animated.multiply(
                                  entranceAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0.7, 1],
                                  }),
                                  selAnim.interpolate({
                                    inputRange: [-1, 0, 1],
                                    outputRange: [1, 1, 1.1],
                                  })
                                ),
                              },
                              {
                                rotate: selAnim.interpolate({
                                  inputRange: [-1, 0, 1],
                                  outputRange: ['0deg', '0deg', '2deg'],
                                }),
                              },
                            ],
                          }}
                        >
                          <TouchableOpacity
                            style={[
                              styles.emotionTile,
                              { backgroundColor: emotion.emotionColour || selectedQuadrant.color },
                            ]}
                            onPress={() => handleEmotionPress(emotion, idx)}
                            activeOpacity={0.8}
                          >
                            <Text
                              style={[
                                styles.emotionLabel,
                                { color: getEmotionFontColor(emotion.name) },
                              ]}
                            >
                              {emotion.name.charAt(0).toUpperCase() + emotion.name.slice(1).toLowerCase()}
                            </Text>
                          </TouchableOpacity>
                        </Animated.View>
                      );
                    })}
                  </View>
                ))}
              </View>

              {selectedEmotion?.description ? (
                <View style={styles.belowGrid} pointerEvents="box-none">
                  <TouchableOpacity onPress={() => setShowDetail(true)} activeOpacity={0.7}>
                    <Text style={styles.emotionDescription} numberOfLines={1}>
                      {selectedEmotion.description}
                    </Text>
                    <Text style={styles.seeMore}>See more</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
            <View style={styles.centeringSpacer} />

            <EmotionDetailSheet
              emotion={selectedEmotion}
              visible={showDetail}
              onClose={() => setShowDetail(false)}
              clusterEmotions={emotions.filter(
                (e) =>
                  selectedEmotion &&
                  e.energy === selectedEmotion.energy &&
                  e.pleasantness === selectedEmotion.pleasantness
              )}
            />

          </>
        )}

        {step === 'coordinate' && selectedEmotion && (
          <CoordinatePicker
            emotion={selectedEmotion}
            coordinates={coordinates}
            clusterEmotions={emotions.filter(
              (e) => e.energy === selectedEmotion.energy && e.pleasantness === selectedEmotion.pleasantness
            )}
            onSelect={onComplete}
            onBack={handleBack}
          />
        )}
      </Animated.View>

      {/* Footer — outside animated content so it stays pinned at bottom */}
      {step === 'emotion' && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.confirmButton,
              !selectedEmotion && styles.confirmButtonDisabled,
            ]}
            onPress={handleConfirm}
            disabled={!selectedEmotion}
            activeOpacity={0.8}
          >
            <Text style={styles.confirmButtonText}>Continue</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const GRID_PADDING = 20;
const TILE_SIZE = (SCREEN_WIDTH - GRID_PADDING * 2) / 2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: GRID_PADDING,
  },
  centeringSpacer: {
    height: 28,
  },
  heading: {
    fontSize: fontSizes['2xl'],
    fontFamily: fonts.heading,
    fontWeight: 'bold',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 32,
  },
  subheading: {
    fontSize: fontSizes.md,
    fontFamily: fonts.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: -20,
    marginBottom: 24,
  },
  grid: {
    // no gap — tiles flush against each other
  },
  gridRow: {
    flexDirection: 'row',
  },
  quadrantTile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderRadius: borderRadius.xl + 12,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.base,
  },
  quadrantLabel: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.headingSemiBold,
    textAlign: 'center',
    lineHeight: 24,
  },
  emotionGridWrapper: {
    overflow: 'visible',
  },
  emotionGrid: {
    // no gap — tiles flush
  },
  belowGrid: {
    position: 'absolute',
    top: TILE_SIZE * 2 + 8,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  emotionGridRow: {
    flexDirection: 'row',
  },
  emotionTile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderRadius: borderRadius.xl + 12,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.base,
  },
  emotionLabel: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.headingSemiBold,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 1,
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
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 20,
    paddingTop: 16,
    paddingHorizontal: GRID_PADDING,
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
