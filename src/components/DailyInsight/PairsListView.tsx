import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import EmotionBadge from '../EmotionBadge';
import Avatar from '../Avatar';
import CheckInWithUser from '../CheckInWithUser';
import { XanoPair } from '../../api';
import { colors, fonts, fontSizes, spacing } from '../../theme';

interface PairsListViewProps {
  pairs: XanoPair[];
  currentUserId: string;
  currentUserFirstName?: string;
  onPairPress: (userId: string, pairsId: number) => void;
  onSendReminder: (pairsUserId: number, message: string) => Promise<void>;
}

export default function PairsListView({
  pairs,
  currentUserId,
  currentUserFirstName,
  onPairPress,
  onSendReminder,
}: PairsListViewProps) {
  if (pairs.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No pairs yet</Text>
      </View>
    );
  }

  return (
    <View>
      {pairs.map((pair: any, index: number) => {
        const otherUser = pair.other_user;
        const firstName = otherUser?.firstName || '';
        const lastName = otherUser?.lastName || '';
        const name =
          otherUser?.fullName ||
          [firstName, lastName].filter(Boolean).join(' ') ||
          pair.invite_email ||
          `Pair #${pair.id}`;
        const avatarUrl = otherUser?.profilePic_url || null;
        const currentId = Number(currentUserId);
        const otherUserId =
          otherUser?.id ??
          (pair.pairUserIDs || []).find((uid: number) => uid !== currentId) ??
          pair.id;
        const initial = name.charAt(0).toUpperCase();
        const pairTypeLabel = 'Trusted Pair';
        const isLast = index === pairs.length - 1;

        // Check if pair has recent check-in (within 7 days)
        const lastCheckInDate = otherUser?.lastCheckInDate;
        const daysSinceCheckIn = lastCheckInDate
          ? Math.floor((Date.now() - new Date(lastCheckInDate).getTime()) / (1000 * 60 * 60 * 24))
          : null;
        const hasRecentCheckIn = daysSinceCheckIn !== null && daysSinceCheckIn <= 7;
        const lastEmotion = otherUser?.recent_checkin_emotion;

        return (
          <TouchableOpacity
            key={pair.id}
            style={[styles.item, !isLast && styles.itemBorder]}
            onPress={() => onPairPress(String(otherUserId), pair.id)}
          >
            <View style={styles.itemLeft}>
              <Avatar source={avatarUrl} name={name} style={{ marginRight: 12 }} />
              <View style={styles.nameContainer}>
                <Text style={styles.name} numberOfLines={1}>{name}</Text>
                <Text style={styles.meta}>{pairTypeLabel}</Text>
              </View>
            </View>
            {hasRecentCheckIn && lastEmotion ? (
              <EmotionBadge
                emotionName={lastEmotion.Display}
                emotionColour={lastEmotion.emotionColour}
              />
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
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 12,
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontFamily: fonts.bodyBold,
    color: colors.primary,
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
});
