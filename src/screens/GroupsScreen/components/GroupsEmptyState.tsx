import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Users } from 'lucide-react-native';
import { colors, fonts, fontSizes, borderRadius } from '../../../theme';

interface GroupsEmptyStateProps {
  onCreate: () => void;
}

export default function GroupsEmptyState({ onCreate }: GroupsEmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.emptyStateContainer}>
        <View style={styles.emptyStateCard}>
          <Users color={colors.primary} size={48} style={styles.emptyStateIcon} />
          <Text style={styles.emptyStateTitle}>Create your first Group</Text>
          <Text style={styles.emptyStateSub}>
            Lead and participate more consciously by seeing how everyone is feeling without compromising confidentiality.
          </Text>
          <TouchableOpacity style={styles.emptyStateCta} onPress={onCreate}>
            <Text style={styles.emptyStateCtaText}>+ Discover Groups</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  emptyStateCard: {
    borderRadius: borderRadius.lg,
    paddingVertical: 40,
    paddingHorizontal: 32,
    alignItems: 'center',
    width: '100%',
  },
  emptyStateIcon: {
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontFamily: fonts.heading,
    fontSize: fontSizes.xl,
    color: colors.darkForest,
    textAlign: 'center',
  },
  emptyStateSub: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.darkForest,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  emptyStateCta: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.button,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 24,
  },
  emptyStateCtaText: {
    fontFamily: fonts.bodyBold,
    fontWeight: '600',
    fontSize: fontSizes.md,
    color: colors.textOnPrimary,
  },
});
