import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, Phone, Users } from 'lucide-react-native';
import { formatDistanceToNow } from 'date-fns';
import { RootStackParamList } from '../../types/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { useMHFR, useSafeEdges } from '../../contexts/MHFRContext';
import { useGroups } from '../../hooks/useGroups';
import { useScreenAnnouncement } from '../../hooks/useScreenAnnouncement';
import { supportRequests as xanoSupportRequests, XanoSupportRequest } from '../../api';
import Avatar from '../../components/Avatar';
import { colors, fonts, fontSizes, borderRadius, spacing } from '../../theme';
import { logger } from '../../lib/logger';
import EmotionTimeline from './components/EmotionTimeline';
import MHFRActionSection from './components/MHFRActionSection';
import ContactAttemptLog from './components/ContactAttemptLog';

type DetailsRouteProp = RouteProp<RootStackParamList, 'SupportRequestDetails'>;
type DetailsNavProp = NativeStackNavigationProp<RootStackParamList, 'SupportRequestDetails'>;

export default function SupportRequestDetailsScreen() {
  useScreenAnnouncement('Support request details');
  const safeEdges = useSafeEdges(['top', 'bottom']);
  const navigation = useNavigation<DetailsNavProp>();
  const route = useRoute<DetailsRouteProp>();
  const { user } = useAuth();
  const { refreshMHFRRequests, mhfrRequests, ownRequests } = useMHFR();
  const { activeGroups, fetchAll } = useGroups();

  // Track sr in local state so we can pick up cache updates pushed by other
  // screens (e.g. RiskAssessment marking the request Resolved). Initial value
  // comes from route params; subsequent updates come from MHFRContext.
  const [sr, setSr] = useState<XanoSupportRequest>(route.params.supportRequest);
  const [contactCount, setContactCount] = useState(sr.contact_attempts_count);
  const [loggingContact, setLoggingContact] = useState(false);

  // Re-sync sr whenever the cached lists change — covers both the optimistic
  // patch-response merge and any background refresh.
  useEffect(() => {
    const fresh =
      mhfrRequests.find((r) => r.id === sr.id) ??
      ownRequests.find((r) => r.id === sr.id);
    if (fresh && fresh !== sr) setSr(fresh);
  }, [mhfrRequests, ownRequests, sr]);

  useFocusEffect(
    useCallback(() => {
      fetchAll();
    }, [fetchAll]),
  );

  const requestUser = sr.requesting_user_details;
  const isOpen = sr.status === 'OPEN';
  const isOwner = user?.id != null && String(sr.users_id) === String(user.id);
  const canCheckIn = isOpen && isOwner;
  const isMHFR = !isOwner;
  const showMHFRActions = isMHFR && isOpen;

  const handleLogContactAttempt = useCallback(async () => {
    if (loggingContact) return;
    setLoggingContact(true);
    try {
      const newCount = contactCount + 1;
      await xanoSupportRequests.patch(sr.id, {
        contact_attempts_count: newCount,
        old_contact_attempt_count: contactCount,
      });
      await refreshMHFRRequests();
      navigation.goBack();
    } catch (e) {
      logger.error('Failed to log contact attempt:', e);
      setLoggingContact(false);
    }
  }, [sr.id, contactCount, loggingContact, refreshMHFRRequests, navigation]);

  const formatTimeAgo = (ts: number | null) => {
    if (!ts) return '';
    return formatDistanceToNow(new Date(ts), { addSuffix: true });
  };

  // Match groups_notified IDs to active groups
  const notifiedGroups = (sr.groups_notified ?? [])
    .map((gId) => {
      const match = activeGroups.find((g: any) => (g.groupId ?? g.id) === gId);
      if (!match) return null;
      const name =
        (match as any).forest?.group?.groupName ??
        (match as any).groupName ??
        `Group #${gId}`;
      return { id: gId, name };
    })
    .filter(Boolean) as { id: number; name: string }[];

  // Action text for MHFR support guide
  const triggerName =
    sr.trigger_Emotion?.emotion_item?.Display ?? sr.trigger_Emotion?.emotion_name ?? '';
  const displayName = requestUser?.fullName ?? 'This person';
  const emotionLabel = triggerName ? triggerName.toUpperCase() : 'distressed';
  const actionText =
    sr.support_Action ||
    `${displayName} is feeling ${emotionLabel} and would like someone to get in touch with them.`;

  return (
    <SafeAreaView style={styles.safe} edges={safeEdges}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft color={colors.textPrimary} size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Support Request</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          canCheckIn && { paddingBottom: spacing.sm },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── User card ── */}
        <View style={styles.userCard}>
          <View style={styles.userRow}>
            <Avatar source={requestUser?.profilePic_url} name={requestUser?.fullName} hexColour={requestUser?.profile_hex_colour} size="lg" />

            <View style={styles.userInfo}>
              <Text style={styles.userName}>{requestUser?.fullName ?? 'Unknown'}</Text>
              <Text style={styles.timeLabel}>{formatTimeAgo(sr.logged_Date)}</Text>
            </View>

            <View style={[styles.statusPill, isOpen ? styles.statusOpen : styles.statusResolved]}>
              <Text
                style={[
                  styles.statusLabel,
                  { color: isOpen ? colors.alert : colors.primary },
                ]}
              >
                {isOpen ? 'Open' : 'Resolved'}
              </Text>
            </View>
          </View>

        </View>

        {/* ── Call button (MHFR view only) ── */}
        {isMHFR && requestUser?.phoneNumber ? (
          <TouchableOpacity
            style={styles.callBtn}
            activeOpacity={0.8}
            onPress={() => Linking.openURL(`tel:${requestUser.phoneNumber}`)}
          >
            <Phone size={18} color={colors.textOnPrimary} />
            <Text style={styles.callBtnLabel}>{requestUser.phoneNumber}</Text>
          </TouchableOpacity>
        ) : null}

        {/* ── Stats row: MHFR + Contact Attempts ── */}
        <View style={styles.statRow}>
          <View style={[styles.section, styles.statCard]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>MHFR Notified In</Text>
            </View>
            {notifiedGroups.length > 0 ? (
              notifiedGroups.map((g) => (
                <View key={g.id} style={styles.groupRow}>
                  <View style={styles.groupBubble}>
                    <Users size={13} color={colors.primary} />
                  </View>
                  <Text style={styles.groupLabel}>{g.name}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyLabelCentered}>None</Text>
            )}
          </View>

          <ContactAttemptLog count={contactCount} />
        </View>

        {/* ── Checkin History ── */}
        <EmotionTimeline supportRequest={sr} />

        {/* ── Support Guide (MHFR view only) ── */}
        {isMHFR && <MHFRActionSection actionText={actionText} />}
      </ScrollView>

      {/* ── Bottom CTA (owner only) ── */}
      {canCheckIn && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.checkinBtn}
            activeOpacity={0.8}
            onPress={() =>
              navigation.navigate('CheckIn', {
                isSupportRequest: true,
                supportRequestId: sr.id,
              })
            }
          >
            <Text style={styles.checkinBtnLabel}>Update How I Feel</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Bottom MHFR actions (MHFR + open + not owner) ── */}
      {showMHFRActions && (
        <View style={styles.bottomBar}>
          <View style={styles.mhfrActionRow}>
            <TouchableOpacity
              style={styles.logContactBtn}
              activeOpacity={0.8}
              disabled={loggingContact}
              onPress={handleLogContactAttempt}
            >
              <Text style={styles.logContactBtnLabel}>
                {loggingContact ? 'Logging...' : 'Log Contact Attempt'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.spokeBtn}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('RiskAssessment', { supportRequest: sr })}
            >
              <Text style={styles.spokeBtnLabel}>I Spoke With Them</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

/* ─── Styles ──────────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.base,
  },
  backBtn: { padding: 2 },
  headerTitle: {
    fontSize: fontSizes.xl,
    fontFamily: fonts.heading,
    color: colors.textPrimary,
  },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing['2xl'],
  },

  // ── User card ──
  userCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  userName: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.base,
    color: colors.textPrimary,
  },
  timeLabel: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    marginTop: 1,
  },
  statusPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    marginLeft: spacing.sm,
  },
  statusOpen: {
    backgroundColor: colors.alertLight,
    borderColor: colors.alert,
  },
  statusResolved: {
    backgroundColor: 'rgba(145, 162, 125, 0.15)',
    borderColor: colors.primary,
  },
  statusLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.xs,
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: spacing.md + 2,
    marginBottom: spacing.sm,
  },
  callBtnLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.base,
    color: colors.textOnPrimary,
  },

  // ── Sections ──
  section: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
  },

  // ── Stats row ──
  statRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  statCard: {
    flex: 1,
  },

  // ── Groups ──
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.sm,
  },
  groupBubble: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
    flexShrink: 1,
  },

  // ── Empty ──
  emptyLabelCentered: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.textPlaceholder,
    textAlign: 'center',
  },

  // ── Bottom CTA ──
  bottomBar: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  checkinBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.button,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkinBtnLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.base,
    color: colors.textOnPrimary,
  },

  // ── MHFR Action buttons ──
  mhfrActionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  spokeBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 16,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spokeBtnLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.md,
    color: colors.textOnPrimary,
  },
  logContactBtn: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 16,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logContactBtnLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.md,
    color: colors.primary,
  },
});
