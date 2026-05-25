import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MappedEmotion } from '../hooks/useEmotionStates';
import { colors, fonts, fontSizes, spacing, borderRadius } from '../theme';

/**
 * Inline emotion-detail content — the body of `EmotionDetailSheet` extracted
 * so it can be rendered in both the bottom sheet AND inline beneath the
 * mesh-gradient palette when the user releases on a matched emotion.
 *
 * No headers, no close button, no scrollview — the parent decides how to
 * present and scroll this block.
 */

const LIGHT_TEXT_EMOTIONS = ['depressed', 'ecstatic', 'enraged', 'blissful'];

function getEmotionFontColor(name: string): string {
  return LIGHT_TEXT_EMOTIONS.includes(name.toLowerCase()) ? '#FFFFFF' : '#1F2937';
}

function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function getZoneLabel(energy: 'high' | 'low', pleasantness: 'high' | 'low'): string {
  const e = energy === 'high' ? 'High Energy' : 'Low Energy';
  const p = pleasantness === 'high' ? 'Pleasant' : 'Unpleasant';
  return `${e} · ${p}`;
}

interface EmotionDetailContentProps {
  emotion: MappedEmotion;
  /** Sibling emotions in the same cluster/zone (rendered as chips). */
  clusterEmotions?: MappedEmotion[];
  /** Pass false to hide the colored emotion card hero (e.g. when the
   * parent renders its own pill/badge above). Defaults to true. */
  showEmotionCard?: boolean;
}

export default function EmotionDetailContent({
  emotion,
  clusterEmotions = [],
  showEmotionCard = true,
}: EmotionDetailContentProps) {
  const emotionColor =
    emotion.emotionColour ||
    colors.emotional[emotion.id as keyof typeof colors.emotional] ||
    colors.primary;
  const zoneLabel = getZoneLabel(emotion.energy, emotion.pleasantness);
  const siblings = clusterEmotions.filter((e) => e.id !== emotion.id);

  return (
    <View>
      {showEmotionCard && (
        <View style={[styles.emotionCard, { backgroundColor: emotionColor }]}>
          <Text style={[styles.emotionCardText, { color: getEmotionFontColor(emotion.name) }]}>
            {capitalize(emotion.name)}
          </Text>
        </View>
      )}

      {/* Cluster / Zone */}
      <View style={styles.clusterSection}>
        <Text style={styles.sectionLabel}>Cluster</Text>
        <Text style={styles.zoneLabel}>{zoneLabel}</Text>
        {siblings.length > 0 && (
          <View style={styles.siblingRow}>
            {siblings.map((sib) => {
              const sibColor =
                sib.emotionColour ||
                colors.emotional[sib.id as keyof typeof colors.emotional] ||
                colors.textMuted;
              return (
                <View key={sib.id} style={[styles.siblingChip, { backgroundColor: sibColor }]}>
                  <Text style={[styles.siblingChipText, { color: getEmotionFontColor(sib.name) }]}>
                    {capitalize(sib.name)}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* Description */}
      {emotion.description ? (
        <View style={styles.descriptionSection}>
          <Text style={styles.sectionLabel}>Description</Text>
          <Text style={styles.descriptionText}>{emotion.description}</Text>
        </View>
      ) : null}

      {/* Regulation strategy */}
      {emotion.regulationStrategy ? (
        <View style={styles.strategySection}>
          <Text style={styles.strategyLabel}>How to shift state</Text>
          <Text style={styles.strategyText}>{emotion.regulationStrategy}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  emotionCard: {
    width: 106,
    height: 106,
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
    alignSelf: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  emotionCardText: {
    fontSize: fontSizes.lg - 2,
    fontFamily: fonts.heading,
    textAlign: 'center',
    paddingHorizontal: spacing.sm,
  },
  clusterSection: {
    backgroundColor: colors.surface,
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.base,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionLabel: {
    color: colors.textMuted,
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  zoneLabel: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.headingSemiBold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  siblingRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: spacing.xs,
  },
  siblingChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
  },
  siblingChipText: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.bodyMedium,
  },
  descriptionSection: {
    backgroundColor: colors.surface,
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.base,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  descriptionText: {
    fontSize: fontSizes.base,
    fontFamily: fonts.body,
    color: colors.textPrimary,
    lineHeight: 24,
  },
  strategySection: {
    backgroundColor: colors.primaryLight,
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(145,162,125,0.2)',
    marginBottom: 32,
  },
  strategyLabel: {
    color: colors.textPrimary,
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  strategyText: {
    fontSize: fontSizes.base,
    fontFamily: fonts.body,
    color: colors.textPrimary,
    lineHeight: 24,
  },
});
