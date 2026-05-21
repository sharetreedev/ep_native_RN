import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Merge, ChevronLeft } from 'lucide-react-native';
import { colors, fonts, fontSizes, spacing, borderRadius } from '../../../theme';
import { styles as baseStyles } from '../styles';

interface MergeAccountsStepProps {
  onMerge: () => void;
  onUseDifferentPhone: () => void;
  isSubmitting: boolean;
}

export default function MergeAccountsStep({
  onMerge,
  onUseDifferentPhone,
  isSubmitting,
}: MergeAccountsStepProps) {
  return (
    <SafeAreaView style={baseStyles.container}>
      <ScrollView contentContainerStyle={baseStyles.scrollContent}>
        <View style={baseStyles.headerRow}>
          <Image source={require('../../../../assets/Logo.png')} style={baseStyles.logo} />
          <Text style={baseStyles.brandName}>Emotional Pulse</Text>
        </View>

        <View style={styles.body}>
          <Text style={baseStyles.heading}>
            This number is already in use. Do you want to merge accounts?
          </Text>
          <Text style={baseStyles.body}>
            You already have an account that uses this phone number. Would you like to merge
            check-in, pair and group data for these two accounts?
          </Text>

          <TouchableOpacity
            style={[styles.iconButton, isSubmitting && styles.disabled]}
            onPress={onMerge}
            disabled={isSubmitting}
            accessibilityRole="button"
            accessibilityLabel="Merge accounts"
          >
            <Merge color={colors.textPrimary} size={18} style={styles.iconButtonLeading} />
            <Text style={styles.iconButtonText}>Merge Accounts</Text>
            <View style={styles.iconButtonTrailing}>
              {isSubmitting ? <ActivityIndicator size="small" color={colors.textPrimary} /> : null}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.iconButton, isSubmitting && styles.disabled]}
            onPress={onUseDifferentPhone}
            disabled={isSubmitting}
            accessibilityRole="button"
            accessibilityLabel="Use a different phone number"
          >
            <ChevronLeft color={colors.textPrimary} size={18} style={styles.iconButtonLeading} />
            <Text style={styles.iconButtonText}>Use Different Phone number</Text>
            <View style={styles.iconButtonTrailing} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  body: {
    alignItems: 'stretch',
  },
  iconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.lg,
    minHeight: 56,
    marginBottom: spacing.base,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  iconButtonLeading: {
    width: 18,
  },
  iconButtonTrailing: {
    width: 18,
  },
  iconButtonText: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.base,
    color: colors.textPrimary,
  },
  disabled: {
    opacity: 0.6,
  },
});
