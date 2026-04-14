import { StyleSheet } from 'react-native';
import { colors, fonts, fontSizes, borderRadius, spacing } from '../../theme';

const AVATAR_SIZE = 88;
const HEADER_HEIGHT = 156;

export { AVATAR_SIZE, HEADER_HEIGHT };

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: HEADER_HEIGHT,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    overflow: 'hidden',
  },
  safe: { flex: 1 },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
  },
  navRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  navButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: spacing.sm,
    borderRadius: borderRadius.full,
  },
  profileHeader: {
    marginHorizontal: spacing.xl,
    alignItems: 'flex-start',
    marginTop: 8,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    width: '100%',
    gap: spacing.md,
  },
  avatarImage: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: 24,
    borderWidth: 4,
    borderColor: colors.background,
  },
  avatarWrap: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    backgroundColor: colors.primary,
    borderRadius: 24,
    borderWidth: 4,
    borderColor: colors.background,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontFamily: fonts.heading,
    fontSize: fontSizes['3xl'],
    color: colors.textOnPrimary,
  },
  displayName: {
    fontSize: 28,
    fontFamily: fonts.heading,
    color: colors.textPrimary,
    marginTop: spacing.md,
    width: '100%',
  },
  tags: {
    flexDirection: 'row',
    marginTop: spacing.sm,
    gap: spacing.md,
  },
  tag: {
    backgroundColor: 'rgba(145, 162, 125, 0.25)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  tagText: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.bodyBold,
    color: colors.textSecondary,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: spacing['3xl'] },
  pulseContent: { padding: spacing.base },
  pillRowMargin: {
    marginBottom: spacing.base,
  },
  pulseGridWrap: {
    aspectRatio: 1,
    width: '100%',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.base,
  },
  statsGridTight: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 8,
    columnGap: 8,
  },

  /* Direction row */
  directionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 8,
  },
  directionTile: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
  },
  directionTileLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  directionTileIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },

  /* Daily Shift */
  dailyShiftCard: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.base,
    marginBottom: 8,
  },
  dailyShiftTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  dailyShiftBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  shiftArrow: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.base,
    color: colors.textPlaceholder,
  },
  noDataText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.textPlaceholder,
    fontStyle: 'italic',
  },

  // Members tab
  membersContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.base,
  },
  emptyText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.base,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: 24,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  memberRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    marginRight: 12,
  },
  memberAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberAvatarInitial: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.sm,
    color: colors.textOnPrimary,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.base,
    color: colors.textPrimary,
  },
  memberRole: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    marginTop: 2,
  },

  // Ellipsis menu
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  menuSheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    paddingBottom: 34,
  },
  menuItem: {
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.xl,
  },
  menuItemText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.base,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  menuCancelText: {
    color: colors.destructive,
  },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },

  // Edit name modal
  editOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
  },
  editSheet: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    marginHorizontal: spacing.xl,
    padding: spacing.xl,
  },
  editTitle: {
    fontFamily: fonts.heading,
    fontSize: fontSizes.xl,
    color: colors.textPrimary,
    marginBottom: spacing.base,
    textAlign: 'center',
  },
  editInput: {
    fontFamily: fonts.body,
    fontSize: fontSizes.base,
    color: colors.textPrimary,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    marginBottom: spacing.base,
  },
  editButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  editCancelBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  editCancelText: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.base,
    color: colors.textSecondary,
  },
  editSaveBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  editSaveText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.base,
    color: colors.textOnPrimary,
  },

  // Image picker modals
  picPreview: {
    width: 120,
    height: 120,
    borderRadius: 24,
    alignSelf: 'center',
    marginBottom: spacing.base,
  },
  picPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 24,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: spacing.base,
  },
  bannerPreview: {
    width: '100%',
    height: 120,
    borderRadius: borderRadius.md,
    marginBottom: spacing.base,
  },
  bannerPlaceholder: {
    width: '100%',
    height: 120,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  picPlaceholderText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.textPlaceholder,
  },
  pickImageBtn: {
    alignSelf: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    marginBottom: spacing.base,
  },
  pickImageBtnText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.sm,
    color: colors.primary,
  },

  // Saving overlay
  savingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  savingText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.base,
    color: colors.textOnPrimary,
    marginTop: spacing.md,
  },
});
