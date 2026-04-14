import React, { useState, useMemo, useRef, useEffect } from 'react';
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
import QuadrantStep from './quadrantGrid/QuadrantStep';
import EmotionStep from './quadrantGrid/EmotionStep';
import { Quadrant, QUADRANTS, MAX_EMOTION_TILES, GRID_PADDING } from './quadrantGrid/quadrantGridUtils';

type Step = 'quadrant' | 'emotion';

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
      // Pick the first coordinate for this emotion (center-ish default)
      const emotionCoords = coordinates.filter(c => c.emotion_states_id === selectedEmotion.xanoId);
      if (emotionCoords.length > 0) {
        const sorted = [...emotionCoords].sort((a, b) => {
          const ay = a.yAxis ?? 0; const by = b.yAxis ?? 0;
          if (ay !== by) return ay - by;
          return (a.xAxis ?? 0) - (b.xAxis ?? 0);
        });
        // Pick the coordinate closest to center (middle of sorted list)
        const mid = Math.floor(sorted.length / 2);
        const coord = sorted[mid];
        onComplete(selectedEmotion, coord.id);
      }
    }
  };

  const handleBack = () => {
    Haptics.selectionAsync();
    animateTransition(() => {
      contentShiftAnim.setValue(0);
      setStep('quadrant');
      setSelectedQuadrant(null);
      setSelectedEmotion(null);
      clearSelection();
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

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.centeredContent, { opacity: fadeAnim, transform: [{ translateY: contentShiftAnim }] }]}>
        {step === 'quadrant' && (
          <QuadrantStep
            tileAnims={tileAnims}
            onQuadrantPress={handleQuadrantPress}
          />
        )}

        {step === 'emotion' && selectedQuadrant && (
          <>
            <EmotionStep
              selectedQuadrant={selectedQuadrant}
              emotionRows={emotionRows}
              selectedEmotion={selectedEmotion}
              emotionTileAnims={emotionTileAnims}
              selectionAnims={selectionAnims}
              onEmotionPress={handleEmotionPress}
              onShowDetail={() => setShowDetail(true)}
            />

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

      </Animated.View>

      {/* Footer — outside animated content so it stays pinned at bottom */}
      {step === 'emotion' && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              buttonStyles.primary.container,
              !selectedEmotion && buttonStyles.primary.disabled,
            ]}
            onPress={handleConfirm}
            disabled={!selectedEmotion}
            activeOpacity={0.8}
          >
            <Text style={buttonStyles.primary.text}>Check In</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: GRID_PADDING,
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
