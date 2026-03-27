import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, fonts, fontSizes } from '../theme';

const PERIODS = ['Daily', '7 Day', '30 Day', 'All Time'] as const;

interface PeriodSelectorProps {
  selected: string;
  onSelect: (period: string) => void;
}

export default function PeriodSelector({ selected, onSelect }: PeriodSelectorProps) {
  return (
    <View style={styles.row}>
      {PERIODS.map((label, i) => (
        <TouchableOpacity
          key={label}
          style={[styles.tile, i === 0 ? styles.tileActive : styles.tileInactive]}
          onPress={() => onSelect(label)}
          activeOpacity={0.8}
        >
          <View
            style={[
              styles.iconBox,
              { transform: [{ rotate: i === 0 ? '45deg' : '0deg' }] },
            ]}
          />
          <Text style={styles.label}>{label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 8,
  },
  tile: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tileActive: {
    backgroundColor: colors.profileCardPositive,
  },
  tileInactive: {
    backgroundColor: colors.profileCardNeutral,
  },
  iconBox: {
    width: 24,
    height: 24,
    borderWidth: 1,
    borderColor: colors.textSecondary,
    borderRadius: 2,
    marginBottom: 4,
  },
  label: {
    fontSize: fontSizes.xs,
    fontFamily: fonts.bodyMedium,
    color: colors.textSecondary,
  },
});
