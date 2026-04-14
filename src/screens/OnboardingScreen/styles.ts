import { StyleSheet, Dimensions } from 'react-native';
import { colors, fonts, fontSizes, borderRadius, spacing } from '../../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing['3xl'],
    gap: spacing.sm,
  },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 12,
  },
  brandName: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.headingSemiBold,
    color: colors.textPrimary,
  },
  heading: {
    fontSize: fontSizes['2xl'],
    fontFamily: fonts.heading,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  body: {
    fontSize: fontSizes.base,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  bold: {
    fontFamily: fonts.bodySemiBold,
    color: colors.textPrimary,
  },
  otpWrapper: {
    marginBottom: spacing.xl,
  },
  spinner: {
    marginVertical: spacing.base,
  },
  resendButton: {
    marginTop: spacing.base,
  },
  phoneWrapper: {
    marginBottom: spacing.xl,
  },
  primaryButton: {
    marginBottom: spacing.base,
  },

  // ── Intro slides ──────────────────────────────────────────────────
  slideImageContainer: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.xl,
    alignSelf: 'center',
    width: SCREEN_WIDTH - spacing.xl * 2,
    height: (SCREEN_WIDTH - spacing.xl * 2) * 0.75,
  },
  slideImage: {
    width: '100%',
    height: '100%',
  },
  slideTitle: {
    fontSize: fontSizes.xl,
    fontFamily: fonts.heading,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  slideDescription: {
    fontSize: fontSizes.base,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing['3xl'],
  },
  slideButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.base,
  },
  bottomButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.base,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    paddingTop: spacing.base,
  },
  slideButton: {
    flex: 1,
  },

  // ── Check-in step ─────────────────────────────────────────────────
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.base,
    paddingBottom: spacing.sm,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: fontSizes['2xl'],
    fontFamily: fonts.heading,
    color: colors.textPrimary,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: spacing.base,
  },
  tabBar: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  viewContainer: {
    flex: 1,
  },
  hidden: {
    display: 'none',
  },

  // ── Course enrollment ─────────────────────────────────────────────
  courseCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  courseTitle: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.heading,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  courseDescription: {
    fontSize: fontSizes.md,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  skipButton: {
    marginTop: spacing.sm,
  },
});
