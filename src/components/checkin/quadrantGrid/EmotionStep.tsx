import React from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { MappedEmotion } from '../../../hooks/useEmotionStates';
import { colors, fonts, fontSizes, borderRadius, spacing } from '../../../theme';
import { Quadrant, TILE_SIZE, DESC_TRUNCATE, getEmotionFontColor } from './quadrantGridUtils';

interface EmotionStepProps {
  selectedQuadrant: Quadrant;
  emotionRows: MappedEmotion[][];
  selectedEmotion: MappedEmotion | null;
  emotionTileAnims: Animated.Value[];
  selectionAnims: Animated.Value[];
  onEmotionPress: (emotion: MappedEmotion, flatIndex: number) => void;
  onShowDetail: () => void;
}

export default function EmotionStep({
  selectedQuadrant,
  emotionRows,
  selectedEmotion,
  emotionTileAnims,
  selectionAnims,
  onEmotionPress,
  onShowDetail,
}: EmotionStepProps) {
  let emotionFlatIdx = 0;

  return (
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
                      onPress={() => onEmotionPress(emotion, idx)}
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
            <TouchableOpacity onPress={onShowDetail} activeOpacity={0.7}>
              <Text style={styles.descriptionLine}>
                {selectedEmotion.description.length > DESC_TRUNCATE
                  ? selectedEmotion.description.slice(0, DESC_TRUNCATE).trimEnd() + '…'
                  : selectedEmotion.description}
                {'  '}
                <Text style={styles.seeMoreInline}>See more</Text>
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
      <View style={styles.centeringSpacer} />
    </>
  );
}

const styles = StyleSheet.create({
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
  descriptionLine: {
    fontSize: fontSizes.base,
    fontFamily: fonts.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 20,
  },
  seeMoreInline: {
    fontFamily: fonts.bodyBold,
    fontWeight: '700',
    color: colors.textMuted,
    fontSize: fontSizes.md,
  },
  centeringSpacer: {
    height: 28,
  },
});
