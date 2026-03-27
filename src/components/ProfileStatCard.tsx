import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, fontSizes } from '../theme';

interface ProfileStatCardProps {
  label: string;
  value: string | React.ReactNode;
  icon?: React.ReactNode;
}

export default function ProfileStatCard({ label, value, icon }: ProfileStatCardProps) {
  return (
    <View style={styles.card}>
      {icon ? (
        <View style={styles.iconRow}>
          {icon}
          <Text style={[styles.label, styles.labelWithIcon]}>{label}</Text>
        </View>
      ) : (
        <Text style={styles.label}>{label}</Text>
      )}
      <View style={styles.valueWrap}>
        {typeof value === 'string' ? <Text style={styles.value}>{value}</Text> : value}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surfaceMuted,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: fontSizes.xs,
    fontFamily: fonts.bodyBold,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  labelWithIcon: { marginLeft: 8 },
  valueWrap: {
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.base,
    color: colors.textPrimary,
    textAlign: 'center',
  },
});
