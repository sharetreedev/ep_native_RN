import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, fontSizes } from '../theme';

interface EngagementScoreProps {
  score?: number;
  delta?: number;
  deltaLabel?: string;
}

export default function EngagementScore({
  score = 85,
  delta = 5,
  deltaLabel = 'last 7 days',
}: EngagementScoreProps) {
  const fillPercent = Math.min(100, Math.max(0, score));

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View>
          <Text style={styles.label}>Engagement Score</Text>
          <Text style={styles.value}>{score}</Text>
        </View>
        <View style={styles.deltaRow}>
          <Text style={styles.delta}>+{delta}</Text>
          <Text style={styles.deltaLabel}>{deltaLabel}</Text>
        </View>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${fillPercent}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  label: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.bodyMedium,
    color: colors.textMuted,
  },
  value: {
    fontSize: fontSizes['3xl'],
    fontFamily: fonts.heading,
    color: colors.textPrimary,
    marginTop: 4,
  },
  deltaRow: { flexDirection: 'row', alignItems: 'center' },
  delta: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.sm,
    color: colors.primary,
  },
  deltaLabel: {
    fontSize: fontSizes.xs,
    fontFamily: fonts.body,
    color: colors.textPlaceholder,
    marginLeft: 4,
  },
  track: {
    height: 8,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 4,
    marginTop: 16,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
});
