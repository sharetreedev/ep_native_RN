import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import EmotionBadge from '../EmotionBadge';
import Avatar from '../Avatar';
import CheckInWithUser from '../CheckInWithUser';
import PairsEmptyState from '../../screens/MyPairsScreen/components/PairsEmptyState';
import { XanoPair } from '../../api';
import { colors, fonts, fontSizes, spacing } from '../../theme';
import { getDirectionIcon } from '../../utils/getDirectionIcon';

interface PairsListViewProps {
  pairs: XanoPair[];
  currentUserId: string;
  currentUserFirstName?: string;
  onPairPress: (userId: string, pairsId: number) => void;
  onSendReminder: (pairsUserId: number, message: string) => Promise<void>;
  onInvitePress?: () => void;
}

function formatLastCheckIn(date: string | number | null | undefined): string | null {
  if (!date) return null;
  const t = new Date(typeof date === 'number' ? date : date).getTime();
  if (Number.isNaN(t)) return null;
  const ms = Date.now() - t;
  const mins = Math.floor(ms / (1000 * 60));
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

function PairsListView({
  pairs,
  currentUserId,
  currentUserFirstName,
  onPairPress,
  onSendReminder,
  onInvitePress,
}: PairsListViewProps) {
  if (pairs.length === 0) {
    return <PairsEmptyState onInvitePress={onInvitePress ?? (() => {})} />;
  }

  return (
    <View>
      {pairs.map((pair: any, index: number) => {
        const otherUser = pair.other_user;
        const firstName = otherUser?.firstName || otherUser?.first_name || '';
        const lastName = otherUser?.lastName || otherUser?.last_name || '';
        const name =
          otherUser?.fullName ||
          otherUser?.full_name ||
          [firstName, lastName].filter(Boolean).join(' ') ||
          pair.invite_email ||
          `Pair #${pair.id}`;
        const avatarUrl = otherUser?.profilePic_url || null;
        const currentId = Number(currentUserId);
        const otherUserId =
          otherUser?.id ??
          (pair.pairUserIDs || []).find((uid: number) => uid !== currentId) ??
          pair.id;
        const isLast = index === pairs.length - 1;

        const lastCheckInDate =
          otherUser?.lastCheckInDate || otherUser?.last_check_in_date;
        const daysSinceCheckIn = lastCheckInDate
          ? Math.floor(
              (Date.now() - new Date(lastCheckInDate).getTime()) /
                (1000 * 60 * 60 * 24),
            )
          : null;
        const hasRecentCheckIn =
          daysSinceCheckIn !== null && daysSinceCheckIn <= 7;
        const lastEmotion =
          otherUser?.recent_checkin_emotion ||
          pair._last_emotion ||
          (otherUser?.Display
            ? { Display: otherUser.Display, emotionColour: otherUser.emotionColour }
            : null);
        const lastCheckInLabel = formatLastCheckIn(lastCheckInDate);

        const runningStats = otherUser?.running_stats;
        const directionLabel = runningStats?.direction_t_p?.directionLabel;

        const metaText =
          hasRecentCheckIn && lastCheckInLabel
            ? `Trusted Pair · ${lastCheckInLabel}`
            : 'Trusted Pair';

        return (
          <TouchableOpacity
            key={pair.id}
            style={[styles.item, !isLast && styles.itemBorder]}
            onPress={() => onPairPress(String(otherUserId), pair.id)}
          >
            <View style={styles.itemLeft}>
              <Avatar source={avatarUrl} name={name} hexColour={otherUser?.profile_hex_colour} style={{ marginRight: 12 }} />
              <View style={styles.nameContainer}>
                <Text style={styles.name} numberOfLines={1}>{name}</Text>
                <Text style={styles.meta}>{metaText}</Text>
              </View>
            </View>
            {hasRecentCheckIn && lastEmotion ? (
              <View style={styles.rightGroup}>
                <EmotionBadge
                  emotionName={lastEmotion.Display}
                  emotionColour={lastEmotion.emotionColour}
                  size="small"
                />
                {directionLabel ? (
                  <View style={styles.trendIcon}>
                    {getDirectionIcon(directionLabel, 22)}
                  </View>
                ) : null}
              </View>
            ) : (
              <CheckInWithUser
                firstName={firstName || name.split(' ')[0]}
                fullName={name}
                currentUserFirstName={currentUserFirstName}
                pairsUserId={otherUserId}
                onSendReminder={onSendReminder}
              />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.base,
    color: colors.textMuted,
    textAlign: 'center',
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  itemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  nameContainer: {
    flex: 1,
    marginRight: 8,
  },
  name: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.lg,
    color: colors.textPrimary,
  },
  meta: {
    fontSize: fontSizes.md,
    fontFamily: fonts.body,
    color: colors.textMuted,
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trendIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default React.memo(PairsListView);
