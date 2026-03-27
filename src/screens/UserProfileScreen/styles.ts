import { StyleSheet, Dimensions } from 'react-native';
import { colors, fonts, fontSizes, borderRadius, spacing } from '../../theme';

export const AVATAR_SIZE = 88;
export const HEADER_HEIGHT = 192;
export const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
  navButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: spacing.sm,
    borderRadius: borderRadius.full,
  },
  profileHeader: {
    marginHorizontal: spacing.xl,
    alignItems: 'flex-start',
    marginTop: 44,
  },
  /* Avatar left-aligned with emotion badge inline, badge pushed down
     so the banner base bisects both avatar and badge equally. */
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: spacing.md,
  },
  avatarShadow: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  avatarIcon: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarIconLine: {
    width: '100%',
    height: 2,
    backgroundColor: colors.textOnPrimary,
    marginBottom: spacing.sm,
  },
  avatarIconBody: {
    width: 2,
    height: 32,
    backgroundColor: colors.textOnPrimary,
  },
  avatarIconHead: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.textOnPrimary,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: spacing.md,
  },
  nameActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  displayName: {
    fontSize: 32,
    fontFamily: fonts.heading,
    color: colors.textPrimary,
  },
  displayNamePair: {
    fontSize: 22,
    fontFamily: fonts.heading,
    color: colors.textPrimary,
  },
  tags: {
    flexDirection: 'row',
    marginTop: spacing.sm,
    gap: spacing.md,
  },
  tag: {
    backgroundColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  tagText: {
    fontSize: fontSizes.md,
    fontFamily: fonts.bodyBold,
    color: colors.textSecondary,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: spacing['3xl'] },
  pulseContent: { padding: spacing.base },

  /* ---- Direction row (horizontal) ---- */
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

  /* ---- Daily shift ---- */
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

  /* ---- Stats grid ---- */
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

  /* ---- Pulse period pills ---- */
  pillRowMargin: {
    marginBottom: spacing.base,
  },

  pairGridWrap: {
    aspectRatio: 1,
    width: '100%',
    marginBottom: spacing.base,
  },
});
