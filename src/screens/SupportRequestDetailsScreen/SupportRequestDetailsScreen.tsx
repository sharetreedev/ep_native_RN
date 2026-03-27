import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, Phone, Users, ArrowRight } from 'lucide-react-native';
import { formatDistanceToNow } from 'date-fns';
import { RootStackParamList } from '../../types/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { useMHFR } from '../../contexts/MHFRContext';
import { useGroups } from '../../hooks/useGroups';
import { supportRequests as xanoSupportRequests } from '../../api';
import EmotionBadge from '../../components/EmotionBadge';
import { colors, fonts, fontSizes, borderRadius, spacing, avatarStyles } from '../../theme';

type DetailsRouteProp = RouteProp<RootStackParamList, 'SupportRequestDetails'>;
type DetailsNavProp = NativeStackNavigationProp<RootStackParamList, 'SupportRequestDetails'>;

const LIFT_ITEMS = [
  { letter: 'L', text: 'Listen with attention and intention' },
  { letter: 'I', text: 'Inquire to discover a person\u2019s needs' },
  { letter: 'F', text: 'Find a way to support needs' },
  { letter: 'T', text: 'Thank & acknowledge their character strength' },
];

export default function SupportRequestDetailsScreen() {
  const navigation = useNavigation<DetailsNavProp>();
  const route = useRoute<DetailsRouteProp>();
  const { supportRequest: sr } = route.params;
  const { user } = useAuth();
  const { refreshMHFRRequests } = useMHFR();
  const { activeGroups, fetchAll } = useGroups();
  const [contactCount, setContactCount] = useState(sr.contact_attempts_count);
  const [loggingContact, setLoggingContact] = useState(false);

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
      console.error('Failed to log contact attempt:', e);
      setLoggingContact(false);
    }
  }, [sr.id, contactCount, loggingContact, refreshMHFRRequests, navigation]);

  // Trigger emotion
  const triggerName =
    sr.trigger_Emotion?.emotion_item?.Display ?? sr.trigger_Emotion?.emotion_name ?? '';
  const triggerColour =
    sr.trigger_Emotion?.emotion_item?.emotionColour ?? colors.textPlaceholder;

  // Full emotion timeline: trigger + updates + resolved
  const emotionTimeline: { name: string; colour: string; timestamp: number | null }[] = [];

  if (triggerName) {
    emotionTimeline.push({
      name: triggerName,
      colour: triggerColour,
      timestamp: sr.logged_Date,
    });
  }

  (sr.updated_Emotions_List ?? []).forEach((e) => {
    if (e.Display) {
      emotionTimeline.push({
        name: e.Display,
        colour: e.emotionColour ?? colors.textPlaceholder,
        timestamp: e.timestamp,
      });
    }
  });

  if (sr.resolved_Emotion?.Display) {
    emotionTimeline.push({
      name: sr.resolved_Emotion.Display,
      colour: sr.resolved_Emotion.emotionColour ?? colors.textPlaceholder,
      timestamp: sr.resolved_Date,
    });
  }

  // Most recent first
  emotionTimeline.sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0));

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
  const displayName = requestUser?.fullName ?? 'This person';
  const emotionLabel = triggerName ? triggerName.toUpperCase() : 'distressed';
  const actionText =
    sr.support_Action ||
    `${displayName} is feeling ${emotionLabel} and would like someone to get in touch with them.`;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
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
            {requestUser?.profilePic_url ? (
              <Image source={{ uri: requestUser.profilePic_url }} style={[avatarStyles.container, { width: 48, height: 48 }]} />
            ) : (
              <View style={[avatarStyles.container, avatarStyles.fallback, { width: 48, height: 48 }]}>
                <Text style={avatarStyles.initial}>
                  {(requestUser?.fullName ?? '?').charAt(0).toUpperCase()}
                </Text>
              </View>
            )}

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

          <View style={[styles.section, styles.statCard]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Contact Attempts</Text>
            </View>
            <Text style={styles.bigNumber}>{contactCount}</Text>
          </View>
        </View>

        {/* ── Checkin History ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Checkin History</Text>
          </View>

          {emotionTimeline.length > 0 ? (
            <View style={styles.timeline}>
              {emotionTimeline.map((entry, idx) => {
                const isLast = idx === emotionTimeline.length - 1;
                return (
                  <View key={`${entry.name}-${idx}`} style={styles.timelineEntry}>
                    <View style={styles.timelineTrack}>
                      <View style={[styles.timelineDot, { backgroundColor: entry.colour }]} />
                      {!isLast && <View style={styles.timelineLine} />}
                    </View>

                    <View style={styles.timelineContent}>
                      <EmotionBadge
                        emotionName={entry.name}
                        emotionColour={entry.colour}
                      />
                      {entry.timestamp ? (
                        <Text style={styles.timelineTs}>{formatTimeAgo(entry.timestamp)}</Text>
                      ) : null}
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <Text style={styles.emptyLabel}>No emotions recorded</Text>
          )}
        </View>

        {/* ── Support Guide (MHFR view only) ── */}
        {isMHFR && (
          <>
            {/* Action + LIFT card */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Support Guide</Text>
              <Text style={[styles.actionTitle, { marginTop: spacing.sm }]}>Action</Text>
              <Text style={styles.actionBody}>{actionText}</Text>
              <View style={{ borderTopWidth: 1, borderTopColor: colors.border, marginTop: spacing.md }}>
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
              onPress={() => Linking.openURL('https://weweb-production.s3.amazonaws.com/designs/d40d63f2-ae0c-4e43-afd2-4047cb3a7a9c/files/6.00_MHFR_CheatSheets_compressed.pdf')}
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
        )}
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
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
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

  // ── Contact count ──
  bigNumber: {
    fontFamily: fonts.heading,
    fontSize: fontSizes['2xl'],
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },

  // ── Timeline ──
  timeline: { gap: 0 },
  timelineEntry: {
    flexDirection: 'row',
  },
  timelineTrack: {
    width: 24,
    alignItems: 'center',
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 8,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: spacing.base,
    gap: 4,
  },
  timelineTs: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.textPlaceholder,
    marginLeft: 2,
  },

  // ── Support Guide (MHFR) ──
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

  // LIFT
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

  // MHFR Resources button
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

  // Emergency button
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

  // ── Empty ──
  emptyLabel: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.textPlaceholder,
  },
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
