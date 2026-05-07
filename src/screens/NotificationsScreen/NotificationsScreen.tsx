import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, Users, Heart, Bell, Hand, X, RefreshCw, Blend } from 'lucide-react-native';
import { formatDistanceToNow } from 'date-fns';
import { colors, fonts, fontSizes, spacing, borderRadius } from '../../theme';
import { XanoNotification } from '../../api';
import { useNotifications } from '../../hooks/useNotifications';
import { usePairs } from '../../hooks/usePairs';
import { useScreenAnnouncement } from '../../hooks/useScreenAnnouncement';
import { RootStackParamList } from '../../types/navigation';
import { EMOTIONS } from '../../constants/emotions';
import { useSafeEdges } from '../../contexts/MHFRContext';

type Tab = 'action' | 'all';

const emotionNames = EMOTIONS.map(e => e.name);
const emotionPattern = new RegExp(`\\b(${emotionNames.join('|')})\\b`, 'gi');

function renderMessageWithEmotions(message: string) {
  const parts = message.split(emotionPattern);
  if (parts.length === 1) return <Text style={styles.itemMessage}>{message}</Text>;

  const emotionSet = new Set(emotionNames.map(n => n.toLowerCase()));
  return (
    <Text style={styles.itemMessage}>
      {parts.map((part, i) =>
        emotionSet.has(part.toLowerCase()) ? (
          <Text key={i} style={styles.emotionText}>{part}</Text>
        ) : (
          part
        )
      )}
    </Text>
  );
}

export default function NotificationsScreen() {
  useScreenAnnouncement('Notifications');
  const safeEdges = useSafeEdges(['top']);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { notifications, unreadCount, isLoading: loading, refetch, markRead, markAllRead } = useNotifications();
  const { getPairById } = usePairs();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('action');

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleNotificationPress = async (notification: XanoNotification) => {
    if (!notification.read) {
      await markRead(notification.id);
    }

    const payload = notification.payload as Record<string, unknown> | null;

    switch (notification.type) {
      case 'pair_request':
      case 'pair_accepted':
      case 'pair_type_change':
      case 'pair_check-in':
      case 'love': {
        const pairsId = payload?.pairs_id ? Number(payload.pairs_id) : undefined;
        if (pairsId) {
          const pair = await getPairById(pairsId);
          if (pair) {
            navigation.navigate('UserProfile', {
              userId: String(notification.sentFrom),
              pairsId: pair.id,
            });
          }
        } else if (notification.sentFrom) {
          navigation.navigate('UserProfile', { userId: String(notification.sentFrom) });
        }
        break;
      }

      case 'pair_rejected':
        break;

      case 'checkback':
      case 'support_request':
      case 'support_received':
      case 'support_attempted':
      case 'support_reminder':
        navigation.navigate('SupportRequests');
        break;

      case 'group_invite':
      case 'group_checkin':
      case 'group_report':
        if (payload?.groupId) {
          navigation.navigate('GroupProfile', {
            groupId: Number(payload.groupId),
            groupName: payload.groupName ? String(payload.groupName) : undefined,
          });
        }
        break;

      case 'user_reminder':
        navigation.navigate('CheckIn');
        break;
    }
  };

  const iconSize = 20;
  const pairIcon = <Blend size={iconSize} color={colors.primary} />;

  const NOTIFICATION_ICONS: Record<string, { icon: React.ReactNode; bg: string }> = {
    pair_request: { icon: pairIcon, bg: colors.primaryLight },
    pair_accepted: { icon: pairIcon, bg: colors.primaryLight },
    'pair_check-in': { icon: pairIcon, bg: colors.primaryLight },
    pair_type_change: { icon: pairIcon, bg: colors.primaryLight },
    pair_rejected: { icon: <X size={iconSize} color={colors.primary} />, bg: colors.primaryLight },
    love: { icon: <Heart size={iconSize} color={colors.primary} />, bg: colors.primaryLight },
    group_invite: { icon: <Users size={iconSize} color={colors.primary} />, bg: colors.primaryLight },
    group_checkin: { icon: <Users size={iconSize} color={colors.primary} />, bg: colors.primaryLight },
    group_report: { icon: <Users size={iconSize} color={colors.primary} />, bg: colors.primaryLight },
    support_request: { icon: <Hand size={iconSize} color={colors.primary} />, bg: colors.primaryLight },
    support_received: { icon: <Hand size={iconSize} color={colors.primary} />, bg: colors.primaryLight },
    support_attempted: { icon: <Hand size={iconSize} color={colors.primary} />, bg: colors.primaryLight },
    support_reminder: { icon: <Hand size={iconSize} color={colors.primary} />, bg: colors.primaryLight },
    checkback: { icon: <RefreshCw size={iconSize} color={colors.primary} />, bg: colors.primaryLight },
    user_reminder: { icon: <Bell size={iconSize} color={colors.primary} />, bg: colors.primaryLight },
  };

  const defaultIcon = { icon: <Bell size={iconSize} color={colors.primary} />, bg: colors.primaryLight };

  const handleMarkAllRead = useCallback(async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length > 0) await markAllRead(unreadIds);
  }, [notifications, markAllRead]);

  const filteredNotifications = notifications.filter((n) =>
    activeTab === 'action' ? n.requires_action && !n.read : true
  );

  const formatTime = (timestamp: number) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return '';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={safeEdges}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft color={colors.textPrimary} size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'action' && styles.activeTab]}
          onPress={() => setActiveTab('action')}
        >
          <Text style={[styles.tabText, activeTab === 'action' && styles.activeTabText]}>
            Action Required
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.activeTab]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
            All Notifications
          </Text>
        </TouchableOpacity>
      </View>

      {unreadCount > 0 && (
        <TouchableOpacity style={styles.markAllRow} onPress={handleMarkAllRead}>
          <Text style={styles.markAllText}>Mark all as read</Text>
        </TouchableOpacity>
      )}

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
        >
          {filteredNotifications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                No notifications to show.
              </Text>
            </View>
          ) : (
            filteredNotifications.map((notification, index) => (
              <TouchableOpacity
                key={notification.id}
                style={[
                  styles.item,
                  index === filteredNotifications.length - 1 && styles.itemLast,
                ]}
                onPress={() => handleNotificationPress(notification)}
              >
                <View style={styles.itemContent}>
                  <View style={[
                    styles.iconContainer,
                    { backgroundColor: (NOTIFICATION_ICONS[notification.type] ?? defaultIcon).bg },
                  ]}>
                    {(NOTIFICATION_ICONS[notification.type] ?? defaultIcon).icon}
                  </View>
                  <View style={styles.itemText}>
                    <Text style={[styles.itemTitle, !notification.read && styles.itemTitleUnread]}>
                      {notification.title}
                    </Text>
                    {renderMessageWithEmotions(notification.message)}
                    <Text style={styles.itemTime}>{formatTime(notification.created_at)}</Text>
                  </View>
                  {!notification.read && <View style={styles.unreadDot} />}
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.base,
  },
  backButton: { marginRight: spacing.base },
  title: {
    flex: 1,
    fontSize: fontSizes.xl,
    fontFamily: fonts.heading,
    color: colors.textPrimary,
    textAlign: 'center',
    marginRight: 24,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(48, 68, 43, 0.10)',
    marginBottom: spacing.base,
  },
  tab: {
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginRight: spacing.xl,
  },
  activeTab: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.lg,
    color: colors.textMuted,
  },
  activeTabText: {
    color: colors.primary,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  scroll: { flex: 1 },
  item: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemLast: {
    borderBottomWidth: 0,
    marginBottom: 32,
  },
  itemContent: { flexDirection: 'row', alignItems: 'flex-start' },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    marginTop: 2,
  },
  itemText: { flex: 1 },
  itemTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.base,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  itemTitleUnread: {
    fontFamily: fonts.bodyBold,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    marginLeft: spacing.sm,
    marginTop: 4,
  },
  markAllRow: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.sm,
    alignItems: 'flex-end',
  },
  markAllText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.base,
    color: colors.primary,
  },
  itemMessage: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    lineHeight: 20,
  },
  emotionText: {
    fontFamily: fonts.bodyBold,
  },
  itemTime: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.body,
    color: colors.textPlaceholder,
  },
});
