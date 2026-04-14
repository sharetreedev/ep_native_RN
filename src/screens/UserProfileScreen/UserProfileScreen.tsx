import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { usePairs } from '../../hooks/usePairs';
import { user as xanoUser, XanoUser, runningStats as xanoRunningStats } from '../../api';
import { ArrowLeft } from 'lucide-react-native';
import { RootStackParamList } from '../../types/navigation';
import CheckInWithUser from '../../components/CheckInWithUser';
import ProfileTabs from '../../components/ProfileTabs';
import EmotionBadge from '../../components/EmotionBadge';
import PulseGrid from '../../components/visualization/PulseGrid';
import CoordinatesGrid from '../../components/visualization/CoordinatesGrid';
import PairsAvatarOverlay, { CoordinateUsers } from '../../components/visualization/PairsAvatarOverlay';
import TimelineView from '../../components/DailyInsight/TimelineView';
import { useCheckIns } from '../../hooks/useCheckIns';
import { useStateCoordinates } from '../../hooks/useStateCoordinates';
import { useCoordinateMapping } from '../../hooks/useCoordinateMapping';
import { useEmotionStates } from '../../hooks/useEmotionStates';
import { CheckInConfirmModal } from '../../components/checkin/CheckInOverlay';
import { useQuickCheckIn } from '../../hooks/useQuickCheckIn';
import { colors, pillTabStyles } from '../../theme';
import PulseLoader from '../../components/PulseLoader';
import Avatar from '../../components/Avatar';
import UserOutlookTab from './components/UserOutlookTab';
import { styles, AVATAR_SIZE, HEADER_HEIGHT } from './styles';
import { logger } from '../../lib/logger';

// Local banner image
const bannerImage = require('../../../assets/ep-app-imagery.webp');

type UserProfileScreenRouteProp = RouteProp<RootStackParamList, 'UserProfile'>;

export default function UserProfileScreen() {
  const navigation = useNavigation();
  const route = useRoute<UserProfileScreenRouteProp>();
  const [activeTab, setActiveTab] = useState<'Pulse' | 'Outlook' | 'Last 7 days'>('Pulse');
  const [pulsePeriod, setPulsePeriod] = useState<'7 Days' | '30 Days' | 'All Time'>('7 Days');

  const { user: currentUser } = useAuth();
  const { emotionStates } = useEmotionStates();
  const { getPairById, isLoading: pairLoading, sendCheckinReminder } = usePairs();
  const userId = route.params?.userId;
  const pairsId = route.params?.pairsId;

  const [pairData, setPairData] = useState<any>(null);
  const [selfRunningStats, setSelfRunningStats] = useState<any>(null);
  const { timeline, fetchTimeline } = useCheckIns(currentUser?.id);
  const { coordinates } = useStateCoordinates();

  // Note: For now we'll assume isPair if userId is provided and not the current user
  const isPair = !route.params?.isNotPair && userId && currentUser && userId !== currentUser.id;

  useEffect(() => {
    if (pairsId) {
      getPairById(pairsId).then((data) => {
        if (data) setPairData(data);
      });
    }
  }, [pairsId, getPairById]);

  // Fetch current user's running stats for self-profile
  useEffect(() => {
    if (!isPair && currentUser?.runningStatsId) {
      xanoRunningStats.getById(currentUser.runningStatsId).then((data) => {
        if (data) setSelfRunningStats(data);
      }).catch(() => {});
    }
  }, [isPair, currentUser?.runningStatsId]);

  // Fetch last 7 days of check-ins for the timeline tab
  useEffect(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 6);
    fetchTimeline(start.toISOString().slice(0, 10), end.toISOString().slice(0, 10));
  }, [fetchTimeline]);

  // Pull pair user data from other_user in the pairs response
  const otherUser = pairData?.other_user;
  const pairDisplayName = otherUser?.fullName || pairData?.invite_email || 'Pair User';
  const pairFirstName = otherUser?.fullName?.split(' ')[0] || pairDisplayName;
  const pairAvatarUrl = otherUser?.profilePic_url || null;
  const pairPhone = otherUser?.phoneNumber;
  const pairTypeLabel = pairData?.pairType === 'DUAL' ? 'Trusted Pair' : pairData?.pairType === 'PULL' ? 'Support Pair' : 'Pair';

  // Running stats — from pair's other_user or current user's own stats
  const runningStats = isPair ? otherUser?.running_stats : selfRunningStats;

  // Extract direction data
  const directionDaily = runningStats?.direction_t_p;
  const directionWeekly = runningStats?.direction_w1_w2;
  const directionMonthly = runningStats?.direction_m1_m2;
  const directionAllTime = runningStats?.direction_m1_at;

  // Extract checkin location data for daily shift
  const prevCheckin = runningStats?.prev_checkin_location;
  const currentCheckin = runningStats?.current_checkin_location;

  // Extract stats
  const rawLastCheckin = runningStats?.days_since_last_pulse || 'No data';
  const lastCheckinLabel = rawLastCheckin.charAt(0).toUpperCase() + rawLastCheckin.slice(1);
  const checkinRate = runningStats?.checkin_frequency
    ? `${runningStats.checkin_frequency.toFixed(1)}x`
    : 'N/A';
  const totalCheckins = runningStats?.checkInCount ?? 'N/A';
  const modeEmotion = runningStats?.checkInMode?.emotionText;
  const modeEmotionStatesId = runningStats?.checkInMode?.emotion_states_id;
  const allTimeEmotion = emotionStates.find(e => e.xanoId === modeEmotionStatesId);
  const modeEmotionColour = (() => {
    for (const period of [runningStats?.at, runningStats?.w1, runningStats?.m1]) {
      if (period?.emotion_states_id === modeEmotionStatesId && period?.emotion_states?.emotionColour) {
        return period.emotion_states.emotionColour;
      }
    }
    return colors.textPlaceholder;
  })();

  const rawCheckinData = useMemo(() => {
    if (pulsePeriod === '7 Days') return runningStats?.checkins_7day ?? [];
    if (pulsePeriod === '30 Days') return runningStats?.checkins30day ?? [];
    return runningStats?.checkins_all_time ?? runningStats?.checkins30day ?? [];
  }, [pulsePeriod, runningStats]);

  const { coordMap, densityData } = useCoordinateMapping(coordinates, rawCheckinData);

  // ── Avatar overlay — show user at their current check-in coordinate ──
  const avatarPoints = useMemo(() => {
    const points: CoordinateUsers[] = [];

    if (isPair) {
      // Pair: use recentStateCoordinates from the pair's other_user
      const rawCoord = otherUser?.recentStateCoordinates;
      const coordId = Number(typeof rawCoord === 'object' && rawCoord !== null ? rawCoord.id : rawCoord);
      if (coordId && !isNaN(coordId) && coordMap.has(coordId)) {
        const pos = coordMap.get(coordId)!;
        points.push({
          row: pos.row,
          col: pos.col,
          users: [{
            id: `pair-${pairsId}`,
            userId: String(userId),
            name: pairDisplayName,
            avatarUrl: pairAvatarUrl,
          }],
        });
      }
    } else if (currentUser) {
      // Self: use recentStateCoordinates (same as pairs use for other_user)
      const rawCoord = currentUser.recentStateCoordinates;
      const coordId = Number(typeof rawCoord === 'object' && rawCoord !== null ? rawCoord.id : rawCoord) || undefined;
      if (coordId && coordMap.has(coordId)) {
        const pos = coordMap.get(coordId)!;
        points.push({
          row: pos.row,
          col: pos.col,
          users: [{
            id: `self-${currentUser.id}`,
            userId: currentUser.id,
            name: currentUser.name,
            avatarUrl: currentUser.avatarUrl || null,
            isCurrentUser: true,
          }],
        });
      }
    }

    return points;
  }, [isPair, otherUser, pairsId, userId, pairDisplayName, pairAvatarUrl, currentUser, coordMap]);

  // Debug
  if (__DEV__) {
    logger.log('[UserProfile Pulse]', {
      isPair: !!isPair,
      coordMapSize: coordMap.size,
      rawCheckinDataLen: rawCheckinData.length,
      densityPoints: densityData.length,
      avatarPoints: avatarPoints.length,
      pulsePeriod,
      runningStatsKeys: runningStats ? Object.keys(runningStats) : 'null',
      selfLast7Len: currentUser?.last7CheckIns?.length ?? 0,
      pairRecentCoord: isPair ? otherUser?.recentStateCoordinates : 'n/a',
    });
  }

  const handleOverlayUserPress = useCallback(() => {
    // Already on this profile, no-op
  }, []);

  const { pendingCheckIn, handleCellPress, confirmCheckIn, cancelCheckIn } = useQuickCheckIn(
    () => (navigation as any).navigate('DailyInsight')
  );

  // Outlook tab directions array
  const outlookDirections = useMemo(() => [
    { label: 'Daily', data: directionDaily, themeColour: currentCheckin?.colour },
    { label: '7 Day', data: directionWeekly, themeColour: runningStats?.w1?.themeColour ?? runningStats?.w1?.emotion_states?.themeColour },
    { label: '30 Day', data: directionMonthly, themeColour: runningStats?.m1?.themeColour ?? runningStats?.m1?.emotion_states?.themeColour },
    { label: 'All Time', data: directionAllTime, themeColour: allTimeEmotion?.themeColour },
  ], [directionDaily, directionWeekly, directionMonthly, directionAllTime, currentCheckin, runningStats, allTimeEmotion]);

  const renderPulseTab = () => (
    <View style={styles.pulseContent}>
      {/* Period pill tabs */}
      <View style={[pillTabStyles.row, styles.pillRowMargin]}>
        {(['7 Days', '30 Days', 'All Time'] as const).map((period) => (
          <TouchableOpacity
            key={period}
            style={[pillTabStyles.pill, pulsePeriod === period && pillTabStyles.pillActive]}
            onPress={() => setPulsePeriod(period)}
          >
            <Text style={[pillTabStyles.pillLabel, pulsePeriod === period && pillTabStyles.pillLabelActive]}>
              {period}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.pairGridWrap}>
        <PulseGrid mode="pairs" isInteractive={false}>
          <CoordinatesGrid
            visualizationMode="group"
            densityData={densityData}
          />
          <PairsAvatarOverlay
            points={avatarPoints}
            onUserPress={handleOverlayUserPress}
            onCellPress={handleCellPress}
          />
        </PulseGrid>
      </View>
    </View>
  );

  const renderLast7Days = () => (
    <View style={styles.pulseContent}>
      <TimelineView checkIns={timeline} />
    </View>
  );

  if (isPair && pairLoading && !pairData) return <PulseLoader />;

  return (
    <View style={styles.container}>
      <ImageBackground
        source={bannerImage}
        style={styles.headerBg}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.1)']}
          style={StyleSheet.absoluteFill}
        />
      </ImageBackground>

      <SafeAreaView style={styles.safe}>
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navButton}>
            <ArrowLeft color={colors.textOnPrimary} size={24} />
          </TouchableOpacity>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.profileHeader}>
          {/* Avatar row – avatar left, emotion badge aligned horizontally */}
          <View style={styles.avatarRow}>
            <Avatar
              source={isPair ? pairAvatarUrl : currentUser?.avatarUrl}
              name={isPair ? (otherUser?.fullName || '?') : (currentUser?.name || '?')}
              size={AVATAR_SIZE}
              borderRadius={24}
              border={{ width: 4, color: colors.background }}
              shadow="md"
            />
            {currentCheckin?.emotion_name && (
              <View style={{ marginTop: 8 }}>
                <EmotionBadge
                  emotionName={currentCheckin.emotion_name}
                  emotionColour={currentCheckin.colour || colors.textPlaceholder}
                />
              </View>
            )}
          </View>

          <View style={styles.nameRow}>
            <Text style={isPair ? styles.displayNamePair : styles.displayName} numberOfLines={1}>
              {isPair ? (!otherUser && !pairData ? '...' : pairDisplayName) : (currentUser?.name || 'Current User')}
            </Text>
            {isPair && (
              <View style={styles.nameActions}>
                {pairData?._last_emotion && (
                  <EmotionBadge
                    emotionName={pairData._last_emotion.Display || pairData._last_emotion.name}
                    emotionColour={pairData._last_emotion.emotionColour || pairData._last_emotion.emotion_colour}
                  />
                )}
                <CheckInWithUser
                  firstName={pairFirstName}
                  fullName={pairDisplayName}
                  currentUserFirstName={currentUser?.firstName || currentUser?.name?.split(' ')[0]}
                  pairsUserId={Number(userId)}
                  onSendReminder={sendCheckinReminder}
                />
              </View>
            )}
          </View>

          <View style={styles.tags}>
            {isPair && pairPhone ? (
              <View style={styles.tag}>
                <Text style={styles.tagText}>{pairPhone}</Text>
              </View>
            ) : !isPair ? (
              <View style={styles.tag}>
                <Text style={styles.tagText}>{currentUser?.phoneNumber || '+1 555-0100'}</Text>
              </View>
            ) : null}
            {isPair && (
              <View style={styles.tag}>
                <Text style={styles.tagText}>{pairTypeLabel}</Text>
              </View>
            )}
          </View>
        </View>

        <ProfileTabs
          tabs={['Pulse', 'Outlook', 'Last 7 days'] as const}
          activeTab={activeTab}
          onTabChange={(tab) => setActiveTab(tab)}
        />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {activeTab === 'Pulse' && renderPulseTab()}
          {activeTab === 'Last 7 days' && renderLast7Days()}
          {activeTab === 'Outlook' && (
            runningStats ? (
              <UserOutlookTab
                directions={outlookDirections}
                prevCheckin={prevCheckin}
                currentCheckin={currentCheckin}
                lastCheckinLabel={lastCheckinLabel}
                checkinRate={checkinRate}
                totalCheckins={totalCheckins}
                modeEmotion={modeEmotion}
                modeEmotionColour={modeEmotionColour}
              />
            ) : (
              <View style={styles.pulseContent}>
                <Text style={styles.noDataText}>No outlook data available yet. Check in to start tracking!</Text>
              </View>
            )
          )}
        </ScrollView>
      </SafeAreaView>

      {pendingCheckIn && (
        <CheckInConfirmModal
          emotion={pendingCheckIn.emotion}
          onConfirm={confirmCheckIn}
          onCancel={cancelCheckIn}
        />
      )}
    </View>
  );
}
