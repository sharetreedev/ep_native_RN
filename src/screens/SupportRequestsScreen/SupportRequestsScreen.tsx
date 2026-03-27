import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, ChevronRight } from 'lucide-react-native';
import { formatDistanceToNow } from 'date-fns';
import { supportRequests, XanoSupportRequest } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { useMHFR } from '../../contexts/MHFRContext';
import { RootStackParamList } from '../../types/navigation';
import EmotionBadge from '../../components/EmotionBadge';
import { colors, fonts, fontSizes, borderRadius, spacing, pillTabStyles, avatarStyles } from '../../theme';

type MainTab = 'myRequests' | 'mhfr';
type StatusFilter = 'OPEN' | 'RESOLVED';

export default function SupportRequestsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();
  const { mhfrRequests, refreshMHFRRequests } = useMHFR();
  const [requests, setRequests] = useState<XanoSupportRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<MainTab>('myRequests');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('OPEN');
  const [mhfrStatusFilter, setMhfrStatusFilter] = useState<StatusFilter>('OPEN');

  const fetchRequests = useCallback(async () => {
    try {
      const data = await supportRequests.getAll();
      setRequests(data);
    } catch (err) {
      console.error('Failed to fetch support requests:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchRequests();
    }, [fetchRequests]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (activeTab === 'mhfr') {
      await refreshMHFRRequests();
    } else {
      await fetchRequests();
    }
    setRefreshing(false);
  }, [fetchRequests, refreshMHFRRequests, activeTab]);

  const filtered = requests
    .filter((r) => r.status === statusFilter)
    .sort((a, b) => (b.logged_Date ?? 0) - (a.logged_Date ?? 0));

  const filteredMHFR = mhfrRequests
    .filter((r) => r.status === mhfrStatusFilter)
    .sort((a, b) => (b.logged_Date ?? 0) - (a.logged_Date ?? 0));

  const formatTimeAgo = (ts: number | null) => {
    if (!ts) return '';
    return formatDistanceToNow(new Date(ts), { addSuffix: true });
  };

  const isOwnRequest = (item: XanoSupportRequest) =>
    user?.id != null && String(item.users_id) === String(user.id);

  const renderCard = (item: XanoSupportRequest) => {
    const triggerEmotion = item.trigger_Emotion;
    const triggerDisplay = triggerEmotion?.emotion_item?.Display ?? triggerEmotion?.emotion_name ?? '';
    const triggerColour = triggerEmotion?.emotion_item?.emotionColour ?? colors.textPlaceholder;

    const isOpen = item.status === 'OPEN';
    const isMine = isOwnRequest(item);

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('SupportRequestDetails', { supportRequest: item })}
      >
        <View style={styles.cardBody}>
          <View style={styles.mhfrCardLeft}>
            {user?.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={avatarStyles.container} />
            ) : (
              <View style={[avatarStyles.container, avatarStyles.fallback]}>
                <Text style={avatarStyles.initial}>
                  {(user?.firstName ?? '?').charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.mhfrCardInfo}>
              <Text style={styles.cardTitle}>{formatTimeAgo(item.logged_Date)}</Text>
              <Text style={styles.cardSubtext}>
                {item.contact_attempts_count} Contact Attempt{item.contact_attempts_count !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>

          {isOpen && isMine ? (
            <TouchableOpacity
              style={styles.checkinAgainBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={(e) => {
                e.stopPropagation?.();
                navigation.navigate('CheckIn', {
                  isSupportRequest: true,
                  supportRequestId: item.id,
                });
              }}
            >
              <Text style={styles.checkinAgainLabel}>Check-in Again</Text>
            </TouchableOpacity>
          ) : (
            <ChevronRight size={18} color={colors.textPlaceholder} />
          )}
        </View>

        {triggerDisplay ? (
          <View style={styles.cardBadgeRow}>
            <EmotionBadge
              emotionName={triggerDisplay}
              emotionColour={triggerColour}
            />
          </View>
        ) : null}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft color={colors.textPrimary} size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Support Requests</Text>
        <View style={{ width: 22 }} />
      </View>

      {/* Main Tabs – only show if user is an MHFR */}
      {user?.isMHFR && (
        <View style={styles.tabBar}>
          {(['myRequests', 'mhfr'] as MainTab[]).map((tab) => {
            const active = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, active && styles.tabActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                  {tab === 'myRequests' ? 'My Requests' : 'MHFR'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {activeTab === 'myRequests' ? (
        <>
          {/* Status pills */}
          <View style={styles.pillRow}>
            {(['OPEN', 'RESOLVED'] as StatusFilter[]).map((s) => {
              const active = statusFilter === s;
              return (
                <TouchableOpacity
                  key={s}
                  style={[pillTabStyles.pill, active && pillTabStyles.pillActive]}
                  onPress={() => setStatusFilter(s)}
                >
                  <Text style={[pillTabStyles.pillLabel, active && pillTabStyles.pillLabelActive]}>
                    {s === 'OPEN' ? 'Open' : 'Resolved'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {loading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <ScrollView
              style={styles.listContainer}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
              }
            >
              {filtered.length > 0 ? (
                filtered.map(renderCard)
              ) : (
                <View style={styles.emptyWrap}>
                  <Text style={styles.emptyText}>
                    No {statusFilter === 'OPEN' ? 'open' : 'resolved'} support requests.
                  </Text>
                </View>
              )}
            </ScrollView>
          )}
        </>
      ) : (
        <>
          {/* MHFR Status pills */}
          <View style={styles.pillRow}>
            {(['OPEN', 'RESOLVED'] as StatusFilter[]).map((s) => {
              const active = mhfrStatusFilter === s;
              return (
                <TouchableOpacity
                  key={s}
                  style={[pillTabStyles.pill, active && pillTabStyles.pillActive]}
                  onPress={() => setMhfrStatusFilter(s)}
                >
                  <Text style={[pillTabStyles.pillLabel, active && pillTabStyles.pillLabelActive]}>
                    {s === 'OPEN' ? 'Open' : 'Resolved'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <ScrollView
            style={styles.listContainer}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
            }
          >
            {filteredMHFR.length > 0 ? (
              filteredMHFR.map((item) => {
                const reqUser = item.requesting_user_details;
                const triggerEmotion = item.trigger_Emotion;
                const triggerDisplay = triggerEmotion?.emotion_item?.Display ?? triggerEmotion?.emotion_name ?? '';
                const triggerColour = triggerEmotion?.emotion_item?.emotionColour ?? colors.textPlaceholder;

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.card}
                    activeOpacity={0.7}
                    onPress={() => navigation.navigate('SupportRequestDetails', { supportRequest: item })}
                  >
                    <View style={styles.cardBody}>
                      <View style={styles.mhfrCardLeft}>
                        {reqUser?.profilePic_url ? (
                          <Image source={{ uri: reqUser.profilePic_url }} style={avatarStyles.container} />
                        ) : (
                          <View style={[avatarStyles.container, avatarStyles.fallback]}>
                            <Text style={avatarStyles.initial}>
                              {(reqUser?.fullName ?? '?').charAt(0).toUpperCase()}
                            </Text>
                          </View>
                        )}
                        <View style={styles.mhfrCardInfo}>
                          <Text style={styles.cardTitle}>{reqUser?.fullName ?? 'Unknown'}</Text>
                          <Text style={styles.cardSubtext}>
                            {formatTimeAgo(item.logged_Date)} {'\u2022'} {item.contact_attempts_count} Contact Attempt{item.contact_attempts_count !== 1 ? 's' : ''}
                          </Text>
                        </View>
                      </View>
                      <ChevronRight size={18} color={colors.textPlaceholder} />
                    </View>

                    {triggerDisplay ? (
                      <View style={styles.cardBadgeRow}>
                        <EmotionBadge
                          emotionName={triggerDisplay}
                          emotionColour={triggerColour}
                        />
                      </View>
                    ) : null}
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyText}>
                  No {mhfrStatusFilter === 'OPEN' ? 'open' : 'resolved'} MHFR requests.
                </Text>
              </View>
            )}
          </ScrollView>
        </>
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

  // Tabs
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.base,
  },
  tab: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginRight: spacing.xl,
  },
  tabActive: { borderBottomColor: colors.primary },
  tabLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.base,
    color: colors.textMuted,
  },
  tabLabelActive: { color: colors.primary },

  // Pills
  pillRow: {
    ...pillTabStyles.row,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.sm,
  },

  // List
  listContainer: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.sm,
    flexGrow: 0,
  },
  listContent: {},

  // Card
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.button,
    padding: spacing.base,
    marginBottom: spacing.sm,
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mhfrCardLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  mhfrCardInfo: { flex: 1 },
  cardTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.base,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  cardSubtext: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.textMuted,
  },
  cardBadgeRow: { marginTop: spacing.sm },
  checkinAgainBtn: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: borderRadius.sm,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  checkinAgainLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.sm,
    color: colors.primary,
  },

  // Empty / loading
  emptyWrap: {
    padding: spacing['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: fonts.body,
    color: colors.textPlaceholder,
    textAlign: 'center',
  },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
