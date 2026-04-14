import React from 'react';
import { View, Text, TouchableOpacity, Linking, StyleSheet } from 'react-native';
import { Phone, ArrowRight } from 'lucide-react-native';
import { colors, fonts, fontSizes, borderRadius, spacing } from '../../../theme';

interface MHFRActionSectionProps {
  actionText: string;
}

const LIFT_ITEMS = [
  { letter: 'L', text: 'Listen with attention and intention' },
  { letter: 'I', text: 'Inquire to discover a person\u2019s needs' },
  { letter: 'F', text: 'Find a way to support needs' },
  { letter: 'T', text: 'Thank & acknowledge their character strength' },
];

const MHFR_RESOURCES_URL =
  'https://weweb-production.s3.amazonaws.com/designs/d40d63f2-ae0c-4e43-afd2-4047cb3a7a9c/files/6.00_MHFR_CheatSheets_compressed.pdf';

function MHFRActionSection({ actionText }: MHFRActionSectionProps) {
  return (
    <>
      {/* Action + LIFT card */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support Guide</Text>
        <Text style={[styles.actionTitle, { marginTop: spacing.sm }]}>Action</Text>
        <Text style={styles.actionBody}>{actionText}</Text>
        <View style={styles.liftDivider}>
          {LIFT_ITEMS.map((item, idx) => (
            <View
              key={item.letter}
              style={[styles.liftRow, idx < LIFT_ITEMS.length - 1 && styles.liftRowBorder]}
            >
              <Text style={styles.liftLetter}>{item.letter}</Text>
              <Text style={styles.liftText}>{item.text}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Open MHFR Resources */}
      <TouchableOpacity
        style={styles.mhfrBtn}
        activeOpacity={0.8}
        onPress={() => Linking.openURL(MHFR_RESOURCES_URL)}
      >
        <Text style={styles.mhfrBtnLabel}>Open MHFR Resources</Text>
        <ArrowRight size={18} color={colors.textOnPrimary} />
      </TouchableOpacity>

      {/* Emergency Services */}
      <TouchableOpacity
        style={styles.emergencyBtn}
        activeOpacity={0.8}
        onPress={() => Linking.openURL('tel:000')}
      >
        <Text style={styles.emergencyBtnLabel}>Emergency Services - Call 000</Text>
        <Phone size={18} color={colors.textOnPrimary} />
      </TouchableOpacity>
    </>
  );
}

export default React.memo(MHFRActionSection);

const styles = StyleSheet.create({
  section: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
  },
  actionTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.base,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  actionBody: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  liftDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.md,
  },
  liftRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.md,
    gap: spacing.base,
  },
  liftRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  liftLetter: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.base,
    color: colors.textPrimary,
    width: 20,
  },
  liftText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  mhfrBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.button,
    minHeight: 48,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  mhfrBtnLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.base,
    color: colors.textOnPrimary,
  },
  emergencyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.destructive,
    borderRadius: borderRadius.button,
    minHeight: 48,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.base,
  },
  emergencyBtnLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.base,
    color: colors.textOnPrimary,
  },
});
