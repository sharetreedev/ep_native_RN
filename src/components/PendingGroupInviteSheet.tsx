import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import LoadingAnimation from './LoadingAnimation';
import BottomSheet from './BottomSheet';
import Avatar from './Avatar';
import { useAuth } from '../contexts/AuthContext';
import { useGroupData } from '../hooks/useGroupData';
import { colors, fonts, fontSizes, spacing, borderRadius } from '../theme';

const inviteGroupName = (invite: any): string =>
  invite?.forest?.group?.groupName ??
  invite?.group?.groupName ??
  invite?.groupName ??
  `Group #${invite?.forest?.groupId ?? invite?.groupId ?? invite?.group_id ?? ''}`.trim();

const inviteImageUrl = (invite: any): string | undefined =>
  invite?.forest?.group?.imageKey ?? invite?.group?.imageKey ?? invite?.imageKey ?? undefined;

const inviteForestMapId = (invite: any): number | undefined =>
  invite?.forest?.id ?? invite?.id;

interface PendingGroupInviteSheetProps {
  /** Used as a per-mount key so accepting/dismissing in one app launch
   *  doesn't reopen until the user signs in again or re-launches. */
  sessionKey?: string;
}

export default function PendingGroupInviteSheet({ sessionKey }: PendingGroupInviteSheetProps) {
  const { user, refreshUser } = useAuth();
  const { acceptInvite, declineInvite } = useGroupData();
  // Local working copy so accept/decline removes the row immediately without
  // waiting for the AuthContext round-trip.
  const [invites, setInvites] = useState<any[]>(user?.pendingGroupInvites ?? []);
  const [visible, setVisible] = useState(false);
  const [dismissedThisSession, setDismissedThisSession] = useState(false);
  const [pendingId, setPendingId] = useState<number | null>(null);

  // Re-sync from AuthContext whenever user.pendingGroupInvites changes — but
  // don't reopen once the user has dismissed for this session.
  useEffect(() => {
    const next = user?.pendingGroupInvites ?? [];
    setInvites(next);
    if (next.length > 0 && !dismissedThisSession) {
      setVisible(true);
    }
    if (next.length === 0) {
      setVisible(false);
    }
  }, [user?.pendingGroupInvites, dismissedThisSession, sessionKey]);

  const handleDismiss = () => {
    setVisible(false);
    setDismissedThisSession(true);
  };

  const handleAccept = async (invite: any) => {
    const id = inviteForestMapId(invite);
    if (id == null) return;
    setPendingId(id);
    try {
      const result = await acceptInvite(id);
      if (result) {
        setInvites((prev) => {
          const next = prev.filter((i) => inviteForestMapId(i) !== id);
          if (next.length === 0) setVisible(false);
          return next;
        });
        // Refresh AuthContext so the new group shows up in user.groups
        // without waiting for the next /auth/me cycle.
        refreshUser().catch(() => {});
      }
    } finally {
      setPendingId(null);
    }
  };

  const handleDecline = async (invite: any) => {
    const id = inviteForestMapId(invite);
    if (id == null) return;
    setPendingId(id);
    try {
      const result = await declineInvite(id);
      if (result) {
        setInvites((prev) => {
          const next = prev.filter((i) => inviteForestMapId(i) !== id);
          if (next.length === 0) setVisible(false);
          return next;
        });
        refreshUser().catch(() => {});
      }
    } finally {
      setPendingId(null);
    }
  };

  if (invites.length === 0) return null;

  const isSingle = invites.length === 1;

  return (
    <BottomSheet visible={visible} onDismiss={handleDismiss} title="Group Invite">
      {isSingle ? (
        <SingleInvite
          invite={invites[0]}
          busy={pendingId === inviteForestMapId(invites[0])}
          onAccept={() => handleAccept(invites[0])}
          onDecline={() => handleDecline(invites[0])}
        />
      ) : (
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {invites.map((invite, index) => {
            const id = inviteForestMapId(invite);
            const isLast = index === invites.length - 1;
            return (
              <InviteRow
                key={`pending-${id ?? index}`}
                invite={invite}
                busy={pendingId === id}
                isLast={isLast}
                onAccept={() => handleAccept(invite)}
                onDecline={() => handleDecline(invite)}
              />
            );
          })}
        </ScrollView>
      )}
    </BottomSheet>
  );
}

function SingleInvite({
  invite,
  busy,
  onAccept,
  onDecline,
}: {
  invite: any;
  busy: boolean;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const name = inviteGroupName(invite);
  const imageUrl = inviteImageUrl(invite);
  const initial = name.charAt(0).toUpperCase();
  return (
    <View style={styles.singleWrap}>
      <Avatar source={imageUrl} initials={initial} size="2xl" style={{ marginBottom: spacing.base }} />
      <Text style={styles.headline}>
        You've been invited to join <Text style={styles.headlineEmphasis}>{name}</Text>
      </Text>
      {busy ? (
        <LoadingAnimation size={60} style={{ marginTop: spacing.base }} />
      ) : (
        <View style={styles.singleActions}>
          <TouchableOpacity style={[styles.btn, styles.declineBtn]} onPress={onDecline} activeOpacity={0.7}>
            <Text style={styles.declineBtnText}>Decline</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.acceptBtn]} onPress={onAccept} activeOpacity={0.7}>
            <Text style={styles.acceptBtnText}>Accept</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function InviteRow({
  invite,
  busy,
  isLast,
  onAccept,
  onDecline,
}: {
  invite: any;
  busy: boolean;
  isLast: boolean;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const name = inviteGroupName(invite);
  const imageUrl = inviteImageUrl(invite);
  const initial = name.charAt(0).toUpperCase();
  return (
    <View style={[styles.row, !isLast && styles.rowBorder]}>
      <View style={styles.rowLeft}>
        <Avatar source={imageUrl} initials={initial} size="md" style={{ marginRight: 12 }} />
        <View style={{ flexShrink: 1, flex: 1 }}>
          <Text style={styles.rowName} numberOfLines={1}>{name}</Text>
          <Text style={styles.rowMeta}>Invitation pending</Text>
        </View>
      </View>
      {busy ? (
        <LoadingAnimation size={60} />
      ) : (
        <View style={styles.rowActions}>
          <TouchableOpacity style={[styles.btn, styles.btnSm, styles.declineBtn]} onPress={onDecline} activeOpacity={0.7}>
            <Text style={styles.declineBtnText}>Decline</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.btnSm, styles.acceptBtn]} onPress={onAccept} activeOpacity={0.7}>
            <Text style={styles.acceptBtnText}>Accept</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  singleWrap: {
    alignItems: 'center',
    paddingVertical: spacing.base,
  },
  headline: {
    fontFamily: fonts.heading,
    fontSize: fontSizes.lg,
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 26,
    marginTop: spacing.sm,
    marginBottom: spacing.base,
    paddingHorizontal: spacing.base,
  },
  headlineEmphasis: {
    fontFamily: fonts.heading,
    color: colors.primary,
  },
  singleActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.base,
    width: '100%',
  },
  list: {
    maxHeight: 420,
  },
  listContent: {
    paddingHorizontal: 0,
    paddingBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
  },
  rowName: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.base,
    color: colors.textPrimary,
  },
  rowMeta: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  btn: {
    paddingHorizontal: spacing.base,
    paddingVertical: 10,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    flex: 1,
    alignItems: 'center',
  },
  btnSm: {
    flex: 0,
    paddingVertical: 8,
  },
  declineBtn: {
    backgroundColor: 'transparent',
    borderColor: colors.border,
  },
  declineBtnText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  acceptBtn: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  acceptBtnText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.sm,
    color: colors.textOnPrimary,
  },
});
