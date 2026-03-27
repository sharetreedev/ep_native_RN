import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Emotion } from '../constants/emotions';
import { getEmotionLabelContrast } from '../lib/emotionUtils';
import { colors, fonts, fontSizes, spacing, borderRadius } from '../theme';

interface EmotionDetailViewProps {
  emotion: Emotion;
}

export default function EmotionDetailView({ emotion }: EmotionDetailViewProps) {
  const contrast = getEmotionLabelContrast(emotion.id);
  const emotionColor = colors.emotional[emotion.id as keyof typeof colors.emotional] || colors.primary;

  return (
    <View style={styles.container}>
      {/* Emotion Card */}
      <View style={[styles.emotionCard, { backgroundColor: emotionColor }]}>
        <Text style={[
          styles.emotionCardText,
          { color: contrast === 'light' ? colors.textOnPrimary : colors.textPrimary }
        ]}>
          {emotion.name}
        </Text>
      </View>

      <Text style={styles.title}>
        {emotion.name}
      </Text>

      <View style={styles.descriptionSection}>
        <Text style={styles.sectionLabel}>Description</Text>
        <Text style={styles.descriptionText}>
          {emotion.description}
        </Text>
      </View>

      <View style={styles.strategySection}>
        <Text style={styles.strategyLabel}>How to shift state</Text>
        <Text style={styles.strategyText}>
          {emotion.regulationStrategy}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing['4xl'],
  },
  emotionCard: {
    width: 128,
    height: 128,
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing['2xl'],
    alignSelf: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  emotionCardText: {
    fontSize: fontSizes.xl,
    fontFamily: fonts.heading,
    textAlign: 'center',
    paddingHorizontal: spacing.sm,
  },
  title: {
    fontSize: fontSizes['3xl'],
    fontFamily: fonts.heading,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.base,
  },
  descriptionSection: {
    backgroundColor: colors.surface,
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.xl,
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
    marginBottom: spacing.sm,
  },
  descriptionText: {
    fontSize: fontSizes.xl,
    fontFamily: fonts.body,
    color: colors.textPrimary,
    lineHeight: 28,
  },
  strategySection: {
    backgroundColor: colors.primaryLight,
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(145,162,125,0.2)',
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
    fontSize: fontSizes.lg,
    fontFamily: fonts.body,
    color: colors.textPrimary,
    lineHeight: 24,
  },
});
