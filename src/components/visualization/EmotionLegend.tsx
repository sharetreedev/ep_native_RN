import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, fontSizes } from '../../theme';

interface EmotionLegendProps {
  fromLabel: string;
  toLabel: string;
  fromColor?: string;
  toColor?: string;
}

export default function EmotionLegend({
  fromLabel,
  toLabel,
  fromColor = colors.profileFrom,
  toColor = colors.profileTo,
}: EmotionLegendProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <Text style={styles.iconText}>L</Text>
        </View>
        <Text style={styles.title}>Daily Shift:</Text>
      </View>
      <View style={styles.barRow}>
        <View style={styles.chipWrap}>
          <View style={[styles.chip, styles.chipLeft, { backgroundColor: fromColor }]}>
            <Text style={styles.chipText}>{fromLabel}</Text>
          </View>
          <View style={[styles.chipGap, { backgroundColor: fromColor, opacity: 0.6 }]} />
        </View>
        <Text style={styles.arrow}>{'>'}</Text>
        <View style={styles.chipWrap}>
          <View style={[styles.chipGap, { backgroundColor: toColor, opacity: 0.6 }]} />
          <View style={[styles.chip, styles.chipRight, { backgroundColor: toColor }]}>
            <Text style={styles.chipTextLight}>{toLabel}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceMuted,
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.textMuted,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: fontSizes.xs,
    fontFamily: fonts.bodyBold,
    color: colors.textSecondary,
  },
  title: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chipWrap: { flexDirection: 'row' },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  chipLeft: { borderTopLeftRadius: 4, borderBottomLeftRadius: 4 },
  chipRight: { borderTopRightRadius: 4, borderBottomRightRadius: 4 },
  chipGap: { width: 16 },
  chipText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.sm,
    color: colors.textOnPrimary,
  },
  chipTextLight: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
  },
  arrow: {
    fontFamily: fonts.body,
    color: colors.textPlaceholder,
    marginHorizontal: 8,
  },
});
