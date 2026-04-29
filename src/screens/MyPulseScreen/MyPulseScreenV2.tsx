import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, StyleSheet, Animated as RNAnimated, PanResponder } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect, useRoute, RouteProp, useIsFocused } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Bell, TriangleAlert } from 'lucide-react-native';
import { RootStackParamList, MainTabParamList } from '../../types/navigation';
import Avatar from '../../components/Avatar';
import ConfettiCelebration from '../../components/ConfettiCelebration';
import PulseLoader from '../../components/PulseLoader';
import { useAuth } from '../../contexts/AuthContext';
import { useMHFR, useSafeEdges } from '../../contexts/MHFRContext';
import { useNotifications } from '../../hooks/useNotifications';
import { useCourses } from '../../hooks/useCourses';
import { useRunningStats } from '../../hooks/useRunningStats';
import { useCachedFetch } from '../../hooks/useCachedFetch';
import { CACHE_KEYS } from '../../lib/fetchCache';
import { colors, fonts, fontSizes } from '../../theme';
import type { XanoRunningStats } from '../../api/types';
import AuroraBackground, { type AuroraColors } from './v2/AuroraBackground';
import EmotionCarousel from './v2/EmotionCarousel';
import type { CarouselSlideData } from './v2/CarouselSlide';
import ThingsToDoCard from './v2/ThingsToDoCard';
import ThingsToDoSheet from './v2/ThingsToDoSheet';
import { useThingsToDo } from '../../hooks/useThingsToDo';

// Fallback aurora colors used until runningStats loads, and for new users
// who don't yet have a `prev_checkin_location`. Leaving `secondary` undefined
// tells AuroraBackground to render the moving layers transparent — a single
// soft wash of primary instead of a two-tone aurora.
const FALLBACK_AURORA_PRIMARY = '#6BB169';
const FALLBACK_AURORA: AuroraColors = {
  primary: FALLBACK_AURORA_PRIMARY,
};

function capitalize(s: string | undefined | null): string {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function buildCarouselSlides(stats: XanoRunningStats | null): CarouselSlideData[] {
  if (!stats) return [];

  const slides: CarouselSlideData[] = [];

  // Aurora is driven by the user's last check-in emotion only — both layers
  // get the same colour so the wash reads as a single tone across all slides.
  const current = stats.current_checkin_location;
  const lastCheckinColor = current?.colour ?? FALLBACK_AURORA_PRIMARY;
  const dailyAurora: AuroraColors = {
    primary: lastCheckinColor,
    secondary: lastCheckinColor,
  };
  const mode = stats.checkInMode;
  const modeEmotion = capitalize(mode?.emotionText);
  const modeEmotionColor =
    mode?.themeColour ?? mode?.emotion_states?.themeColour ?? mode?.emotionColour;
  slides.push({
    id: 'today',
    title: 'Today',
    prefix: "I'm feeling,",
    emotion: capitalize(current?.emotion_name) || 'Unknown',
    emotionColor: current?.themeColour ?? current?.colour ?? colors.primary,
    sublinePrefix: modeEmotion ? "I'm often," : undefined,
    sublineEmotion: modeEmotion || undefined,
    sublineEmotionColor: modeEmotionColor,
    directionLabel: stats.direction_t_p?.directionLabel,
    auroraColors: dailyAurora,
    shiftSignificance: stats.shift_t_at?.significance,
  });

  // Slide 2 — Last 7 Days
  const w2 = stats.w2;
  const w1 = stats.w1;
  if (w2?.emotion_states && w1?.emotion_states) {
    const w1Emotion = capitalize(w1.emotion_states.Display);
    slides.push({
      id: '7days',
      title: 'Over the last 7 days',
      prefix: "I've been feeling,",
      emotion: capitalize(w2.emotion_states.Display) || 'Unknown',
      emotionColor: w2.emotion_states.themeColour ?? w2.emotion_states.emotionColour ?? colors.primary,
      sublinePrefix: w1Emotion ? 'previously I was,' : undefined,
      sublineEmotion: w1Emotion || undefined,
      sublineEmotionColor: w1.emotion_states.themeColour ?? w1.emotion_states.emotionColour,
      directionLabel: stats.direction_w1_w2?.directionLabel,
      auroraColors: dailyAurora,
      emotionOnNewLine: true,
      shiftSignificance: stats.shift_w1_w2?.significance,
    });
  } else {
    slides.push({
      id: 'empty-7days',
      title: 'Over the last 7 days',
      prefix: '',
      emotion: '',
      emotionColor: colors.textSecondary,
      isEmpty: true,
      emptyMessage: 'Check in for 7 days to see your trends',
      auroraColors: dailyAurora,
    });
  }

  // Slide 3 — Last 30 Days
  const m2 = stats.m2;
  const m1 = stats.m1;
  if (m2?.emotion_states && m1?.emotion_states) {
    const m1Emotion = capitalize(m1.emotion_states.Display);
    slides.push({
      id: '30days',
      title: 'Over the last 30 days',
      prefix: "I've been feeling,",
      emotion: capitalize(m2.emotion_states.Display) || 'Unknown',
      emotionColor: m2.emotion_states.themeColour ?? m2.emotion_states.emotionColour ?? colors.primary,
      sublinePrefix: m1Emotion ? 'previously I was,' : undefined,
      sublineEmotion: m1Emotion || undefined,
      sublineEmotionColor: m1.emotion_states.themeColour ?? m1.emotion_states.emotionColour,
      directionLabel: stats.direction_m1_m2?.directionLabel,
      auroraColors: dailyAurora,
      emotionOnNewLine: true,
      shiftSignificance: stats.shift_m1_m2?.significance,
    });
  } else {
    slides.push({
      id: 'empty-30days',
      title: 'Over the last 30 days',
      prefix: '',
      emotion: '',
      emotionColor: colors.textSecondary,
      isEmpty: true,
      emptyMessage: 'Check in for 30 days to see your trends',
      auroraColors: dailyAurora,
    });
  }

  return slides;
}

export default function MyPulseScreenV2() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<MainTabParamList, 'MyPulse'>>();
  const { user, refreshUser } = useAuth();
  const { enrollment, fetchEnrollment } = useCourses();
  const { stats, fetchById: fetchRunningStatsById } = useRunningStats();
  const { hasOpenSupportItem, refreshAllSupportRequests } = useMHFR();
  const { unreadCount, refetch: refetchNotifications } = useNotifications();
  const safeEdges = useSafeEdges(['top']);
  // Pause per-frame animations (aurora, pulsing dot) when the screen isn't
  // visible. The tab navigator keeps MyPulse mounted after first visit, so
  // without this, the aurora keeps burning UI-thread frames while the user
  // is on Pulse or Get Support.
  const isFocused = useIsFocused();

  const [refreshing, setRefreshing] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [completedCourseName, setCompletedCourseName] = useState('');

  const { fetch: cachedRefreshUser, forceFetch: forceRefreshUser } = useCachedFetch(CACHE_KEYS.USER, refreshUser);
  const { fetch: cachedFetchEnrollment, forceFetch: forceFetchEnrollment } = useCachedFetch(CACHE_KEYS.ENROLLMENT, fetchEnrollment);

  const fetchRunningStats = useCallback(async () => {
    if (user?.runningStatsId) await fetchRunningStatsById(user.runningStatsId);
  }, [user?.runningStatsId, fetchRunningStatsById]);
  const { fetch: cachedFetchRunningStats, forceFetch: forceFetchRunningStats } =
    useCachedFetch(CACHE_KEYS.RUNNING_STATS, fetchRunningStats);

  useFocusEffect(
    useCallback(() => {
      cachedRefreshUser();
      cachedFetchEnrollment();
      cachedFetchRunningStats();
      // Header dot data lives in shared contexts and updates synchronously
      // when the user marks-read or resolves in-app, but a background refresh
      // on focus catches anything changed via push / another device.
      refetchNotifications();
      refreshAllSupportRequests();

      if (route.params?.courseCompleted) {
        setCompletedCourseName(route.params.courseName || '');
        setShowConfetti(true);
        navigation.setParams({ courseCompleted: undefined, courseName: undefined } as any);
      }
    }, [
      cachedRefreshUser,
      cachedFetchEnrollment,
      cachedFetchRunningStats,
      refetchNotifications,
      refreshAllSupportRequests,
      route.params?.courseCompleted,
      route.params?.courseName,
      navigation,
    ]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      forceRefreshUser(),
      forceFetchEnrollment(),
      forceFetchRunningStats(),
      refreshAllSupportRequests(),
      refetchNotifications(),
    ]);
    setRefreshing(false);
  }, [
    forceRefreshUser,
    forceFetchEnrollment,
    forceFetchRunningStats,
    refreshAllSupportRequests,
    refetchNotifications,
  ]);

  const pulseAnim = useRef(new RNAnimated.Value(1)).current;
  useEffect(() => {
    if (!isFocused) return; // skip the loop entirely when the screen isn't visible
    const loop = RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(pulseAnim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
        RNAnimated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim, isFocused]);

  const slides = useMemo(() => buildCarouselSlides(stats), [stats]);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  const { actions: thingsToDoActions } = useThingsToDo();
  const [thingsToDoOpen, setThingsToDoOpen] = useState(false);

  // Swipe-up-to-open on the ThingsToDoCard. We keep the card's own tap handler
  // intact by not claiming the responder on start — only once upward movement
  // crosses a small threshold do we capture and open the sheet. The sheet's
  // own enter animation handles the visual reveal, so the card itself doesn't
  // need to move.
  const thingsToDoPan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onStartShouldSetPanResponderCapture: () => false,
        onMoveShouldSetPanResponder: (_, gs) => gs.dy < -6 && Math.abs(gs.dy) > Math.abs(gs.dx),
        // Capture variant is what actually wins the gesture from the
        // TouchableOpacity inside the card — without it, the child grabs
        // the responder on touch-down and the parent never sees the move.
        onMoveShouldSetPanResponderCapture: (_, gs) =>
          gs.dy < -6 && Math.abs(gs.dy) > Math.abs(gs.dx),
        onPanResponderRelease: (_, gs) => {
          if (thingsToDoActions.length === 0) return;
          if (gs.dy < -40 || gs.vy < -0.4) setThingsToDoOpen(true);
        },
      }),
    [thingsToDoActions.length],
  );

  if (!user) return <PulseLoader />;

  const courseProgress = enrollment ? (enrollment.progress_percent ?? 0) / 100 : 0;

  // Aurora colors follow the currently-active carousel slide.
  const auroraColors: AuroraColors = slides[activeSlideIndex]?.auroraColors ?? FALLBACK_AURORA;

  return (
    <View style={styles.container}>
      <AuroraBackground colors={auroraColors} paused={!isFocused} />
      <SafeAreaView style={styles.safeArea} edges={safeEdges}>
        <View style={styles.header}>
        <Text style={styles.screenTitle}>My Pulse</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity onPress={() => navigation.navigate('SupportRequests')} style={styles.iconWrap}>
            <TriangleAlert color={colors.textSecondary} size={26} strokeWidth={2} />
            {hasOpenSupportItem && (
              <RNAnimated.View style={[styles.pulsingDot, { opacity: pulseAnim }]} />
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Notifications')} style={styles.iconWrap}>
            <Bell color={colors.textSecondary} size={26} strokeWidth={2} />
            {unreadCount > 0 && (
              <RNAnimated.View style={[styles.pulsingDot, { opacity: pulseAnim }]} />
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Account')}>
            <Avatar
              source={user?.avatarUrl}
              name={user?.name}
              hexColour={user?.profileHexColour}
              size={32}
              progress={courseProgress}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {slides.length > 0 ? (
          <View style={styles.carouselWrap}>
            <EmotionCarousel slides={slides} onActiveSlideChange={setActiveSlideIndex} />
            <TouchableOpacity
              onPress={() => navigation.navigate('UserProfile', { userId: 'current-user', isNotPair: true })}
              style={styles.trendsLink}
              activeOpacity={0.7}
              accessibilityRole="link"
              accessibilityLabel="View my trends"
            >
              <Text style={styles.trendsLinkText}>Explore My Trends →</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderBody}>Loading your pulse…</Text>
          </View>
        )}
      </ScrollView>

        <View style={styles.checkInWrap}>
          <TouchableOpacity
            style={styles.checkInButton}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('CheckIn')}
            accessibilityRole="button"
            accessibilityLabel="Check in"
          >
            <Text style={styles.checkInButtonText}>Check In</Text>
          </TouchableOpacity>
        </View>

        <View {...thingsToDoPan.panHandlers}>
          <ThingsToDoCard
            count={thingsToDoActions.length}
            topAction={thingsToDoActions[0]}
            onPress={() => setThingsToDoOpen(true)}
          />
        </View>

        <ThingsToDoSheet
          visible={thingsToDoOpen}
          actions={thingsToDoActions}
          onClose={() => setThingsToDoOpen(false)}
        />

        <ConfettiCelebration
          visible={showConfetti}
          courseName={completedCourseName}
          onComplete={() => setShowConfetti(false)}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  safeArea: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  screenTitle: {
    fontSize: fontSizes['3xl'],
    fontFamily: fonts.heading,
    color: colors.textPrimary,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  iconWrap: {
    position: 'relative',
  },
  pulsingDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
    borderWidth: 1.5,
    borderColor: colors.background,
  },
  scroll: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  carouselWrap: {
    marginTop: 24,
    // Escape the scroll's 16px horizontal padding so the carousel (and the
    // frost band rendered inside each slide) can extend to the screen edges.
    marginHorizontal: -16,
  },
  trendsLink: {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 8,
  },
  trendsLinkText: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.base,
    color: colors.textPrimary,
  },
  checkInWrap: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  checkInButton: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  checkInButtonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.base,
    color: colors.textOnPrimary,
  },
  placeholder: {
    marginTop: 48,
    alignItems: 'center',
  },
  placeholderBody: {
    fontFamily: fonts.body,
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
