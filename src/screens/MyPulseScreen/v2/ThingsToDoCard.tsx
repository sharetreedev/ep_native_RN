import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import {
  ChevronRight,
  User,
  AlertTriangle,
  GraduationCap,
  Camera,
  Bell,
  Blend,
  Activity,
  UsersRound,
} from 'lucide-react-native';
import Avatar from '../../../components/Avatar';
import { colors, fonts, fontSizes, borderRadius } from '../../../theme';
import type { ThingsToDoAction, ThingsToDoIcon } from '../../../hooks/useThingsToDo';

// Temporarily hidden while we evaluate the card without the preview row.
const SHOW_TOP_ACTION_PREVIEW = false;

const ICON_FOR: Record<ThingsToDoIcon, React.ComponentType<any>> = {
  user: User,
  alert: AlertTriangle,
  graduation: GraduationCap,
  camera: Camera,
  bell: Bell,
  blend: Blend,
  activity: Activity,
  group: UsersRound,
};

type Props = {
  count: number;
  topAction?: ThingsToDoAction;
};

// The card is presentational. Tap and swipe-up are owned by the wrapping
// PanResponder in MyPulseScreenV2 — nesting a TouchableOpacity here caused
// the child to win the touch on press-down so the parent's swipe gesture
// never fired.
export default function ThingsToDoCard({ count, topAction }: Props) {
  const isEmpty = count === 0;
  const Icon = topAction ? ICON_FOR[topAction.icon] : null;

  return (
    <View
      style={styles.card}
      accessible
      accessibilityRole="button"
      accessibilityState={{ disabled: isEmpty }}
      accessibilityLabel={
        isEmpty
          ? "Safety Checklist, you're all caught up"
          : `Safety Checklist, ${count} ${count === 1 ? 'item' : 'items'}, opens list`
      }
    >
      <View style={styles.headerRow}>
        <View style={styles.titleWrap}>
          <Text style={styles.title}>SAFETY CHECKLIST</Text>
          {!isEmpty && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{count}</Text>
            </View>
          )}
        </View>
        <View style={styles.actionWrap}>
          <Text style={styles.action}>
            {isEmpty ? "You're all caught up" : 'View all'}
          </Text>
          {!isEmpty && (
            <ChevronRight size={16} color={colors.textSecondary} strokeWidth={2} />
          )}
        </View>
      </View>

      {SHOW_TOP_ACTION_PREVIEW && topAction && (Icon || topAction.avatar) && (
        <View style={styles.preview}>
          {topAction.avatar ? (
            <Avatar
              source={topAction.avatar.source}
              name={topAction.avatar.name}
              hexColour={topAction.avatar.hexColour}
              size={44}
              borderRadius={16}
            />
          ) : Icon ? (
            <View style={[styles.iconAvatar, { backgroundColor: topAction.bgColor }]}>
              <Icon size={22} color="white" strokeWidth={2} />
            </View>
          ) : null}
          <View style={styles.previewText}>
            <Text style={styles.previewMain} numberOfLines={1}>
              {topAction.mainText}
            </Text>
            <Text style={styles.previewSub} numberOfLines={1}>
              {topAction.subText}
            </Text>
          </View>
          <ChevronRight size={22} color={colors.textPrimary} strokeWidth={2.5} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginHorizontal: 16,
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 22,
    // iOS gets a soft upward shadow to lift the card off the aurora.
    // Android's `elevation` produces a hard Material drop shadow that
    // reads blocky under this soft aesthetic — drop it entirely there.
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: Platform.OS === 'ios' ? 8 : 0,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
    letterSpacing: 1.6,
  },
  countBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    backgroundColor: '#1F2937',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.xs,
    color: '#FFFFFF',
    // Strip Android's extra font padding so the digit centers on the same
    // baseline as iOS inside the 22px badge — otherwise it drifts a px or
    // two below center.
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  actionWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    opacity: 0.6,
  },
  action: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  // Mirrors the row style used inside ThingsToDoSheet so the preview reads
  // as a sample of the list.
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 16,
    backgroundColor: 'white',
    borderRadius: borderRadius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: Platform.OS === 'ios' ? 1 : 0,
  },
  iconAvatar: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewText: { flex: 1 },
  previewMain: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.base,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  previewSub: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
});
