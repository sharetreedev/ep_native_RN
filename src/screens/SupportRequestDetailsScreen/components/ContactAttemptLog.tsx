import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, fontSizes, borderRadius, spacing } from '../../../theme';

interface ContactAttemptLogProps {
  count: number;
}

function ContactAttemptLog({ count }: ContactAttemptLogProps) {
  return (
    <View style={[styles.section, styles.statCard]}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Contact Attempts</Text>
      </View>
      <Text style={styles.bigNumber}>{count}</Text>
    </View>
  );
}

export default React.memo(ContactAttemptLog);

const styles = StyleSheet.create({
  section: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  statCard: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
  },
  bigNumber: {
    fontFamily: fonts.heading,
    fontSize: fontSizes['2xl'],
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});
