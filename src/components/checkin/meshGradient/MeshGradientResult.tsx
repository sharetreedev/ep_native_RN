import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import EmotionBadge from '../../EmotionBadge';
import { MappedEmotion } from '../../../hooks/useEmotionStates';
import { colors, fonts, fontSizes } from '../../../theme';
import { PALETTE_ACTUAL, DESC_TRUNCATE } from './meshGradientUtils';

interface MeshGradientResultProps {
  matchedEmotion: MappedEmotion | null;
  onShowDetail: () => void;
}

export default function MeshGradientResult({ matchedEmotion, onShowDetail }: MeshGradientResultProps) {
  return (
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
            <TouchableOpacity onPress={onShowDetail} activeOpacity={0.7}>
              <Text style={styles.descriptionLine}>
                {matchedEmotion.description.length > DESC_TRUNCATE
                  ? matchedEmotion.description.slice(0, DESC_TRUNCATE).trimEnd() + '…'
                  : matchedEmotion.description}
                {'  '}
                <Text style={styles.seeMoreInline}>See more</Text>
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
  descriptionLine: {
    fontSize: fontSizes.base,
    fontFamily: fonts.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
  },
  seeMoreInline: {
    fontFamily: fonts.bodyBold,
    fontWeight: '700',
    color: colors.textMuted,
    fontSize: fontSizes.md,
  },
});
