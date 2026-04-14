import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, Pressable, RefreshControl, StyleSheet, Animated as RNAnimated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, MainTabParamList } from '../../types/navigation';
import { Bell, TriangleAlert, Info, Heart, Blend } from 'lucide-react-native';
import Avatar from '../../components/Avatar';
import { useMHFR, useSafeEdges } from '../../contexts/MHFRContext';
import { useNotifications } from '../../hooks/useNotifications';
import { useAuth } from '../../contexts/AuthContext';
import LastCheckInWidget from '../../components/LastCheckInWidget';
import { useCourses } from '../../hooks/useCourses';
import QuickLinkCard from '../../components/QuickLinkCard';
import NextLessonCard from '../../components/NextLessonCard';
import ConfettiCelebration from '../../components/ConfettiCelebration';
import { colors, fonts, fontSizes, borderRadius } from '../../theme';
import PulseLoader from '../../components/PulseLoader';
import OnboardingProgress from '../../components/OnboardingProgress';
import { useCachedFetch } from '../../hooks/useCachedFetch';
import { CACHE_KEYS } from '../../lib/fetchCache';

export default function MyPulseScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<MainTabParamList, 'MyPulse'>>();
  const { user, refreshUser } = useAuth();
  const { enrollment, allEnrollments, fetchEnrollment } = useCourses();
  const [refreshing, setRefreshing] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showSuggestedTip, setShowSuggestedTip] = useState(false);
  const sheetBackdropAnim = useRef(new RNAnimated.Value(0)).current;
  const sheetSlideAnim = useRef(new RNAnimated.Value(300)).current;

  const openSheet = useCallback(() => {
    setShowSuggestedTip(true);
    sheetBackdropAnim.setValue(0);
    sheetSlideAnim.setValue(300);
    RNAnimated.parallel([
      RNAnimated.timing(sheetBackdropAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      RNAnimated.spring(sheetSlideAnim, { toValue: 0, tension: 65, friction: 10, useNativeDriver: true }),
    ]).start();
  }, [sheetBackdropAnim, sheetSlideAnim]);

  const closeSheet = useCallback(() => {
    RNAnimated.parallel([
      RNAnimated.timing(sheetBackdropAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      RNAnimated.timing(sheetSlideAnim, { toValue: 300, duration: 200, useNativeDriver: true }),
    ]).start(() => setShowSuggestedTip(false));
  }, [sheetBackdropAnim, sheetSlideAnim]);
  const [completedCourseName, setCompletedCourseName] = useState('');

  const { fetch: cachedRefreshUser, forceFetch: forceRefreshUser } = useCachedFetch(CACHE_KEYS.USER, refreshUser);
  const { fetch: cachedFetchEnrollment, forceFetch: forceFetchEnrollment } = useCachedFetch(CACHE_KEYS.ENROLLMENT, fetchEnrollment);

  useFocusEffect(
    React.useCallback(() => {
      cachedRefreshUser();
      cachedFetchEnrollment();

      // Show confetti if navigated here after completing the final lesson of a course
      if (route.params?.courseCompleted) {
        setCompletedCourseName(route.params.courseName || '');
        setShowConfetti(true);
        // Clear the param so it doesn't re-trigger
        navigation.setParams({ courseCompleted: undefined, courseName: undefined } as any);
      }
    }, [cachedRefreshUser, cachedFetchEnrollment, route.params?.courseCompleted, navigation])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([forceRefreshUser(), forceFetchEnrollment()]);
    setRefreshing(false);
  }, [forceRefreshUser, forceFetchEnrollment]);

  // Derive next lesson title from enrollment data
  // last_completed_module is the ID of the last completed module
  // The next lesson is the first module whose ID > last_completed_module
  const lastCompletedModuleId =
    typeof enrollment?.last_completed_module === 'number'
      ? enrollment.last_completed_module
      : enrollment?.last_completed_module?.id ?? 0;
  const nextLessonFromModules = enrollment?.modules?.find(
    (m) => m.id > lastCompletedModuleId,
  );
  const lessonTitle = enrollment?.next_lesson_title ?? nextLessonFromModules?.title ?? null;
  const courseTitle = enrollment?.course?.name || enrollment?.course?.title || enrollment?.course_name || null;

  const handleLessonCardPress = useCallback(() => {
    const allCompleted = allEnrollments.length > 0 && allEnrollments.every((e) => e.completion_status === 'completed');

    if (allCompleted && allEnrollments.length > 1) {
      // All courses completed & more than 1 → show enrollments list
      navigation.navigate('Enrollments', { enrollments: allEnrollments });
    } else {
      // Has incomplete course OR only 1 enrollment (completed or not) → go to course details
      navigation.navigate('CourseDetails', { enrollment: enrollment ?? undefined });
    }
  }, [allEnrollments, enrollment, navigation]);

  const isEnrolled = !!enrollment;

  const handleEnrollCourse = useCallback(() => {
    navigation.navigate('CourseEnroll');
  }, [navigation]);

  const safeEdges = useSafeEdges(['top']);
  const { hasOpenMHFRRequest } = useMHFR();
  const { unreadCount } = useNotifications();

  // Pulsing animation for notification dots
  const pulseAnim = useRef(new RNAnimated.Value(1)).current;
  useEffect(() => {
    const loop = RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(pulseAnim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
        RNAnimated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  if (!user) return <PulseLoader />;

  // Course progress for avatar ring (0–1)
  const courseProgress = enrollment ? (enrollment.progress_percent ?? 0) / 100 : 0;

  // Onboarding checklist completion (for Get Started cards visibility)
  const onboardingAllComplete =
    !!user.avatarUrl &&
    (!!user.reminderFrequency && user.reminderFrequency !== 'NONE') &&
    (user.pairs?.length ?? 0) > 0 &&
    !!enrollment &&
    (user.last7CheckIns?.length ?? 0) >= 7 &&
    (user.groups?.length ?? 0) > 0;

  // Filter pairs that need a check-in, tagged with reason
  const suggestedPairs = useMemo(() => {
    if (!user?.pairs?.length) return [];
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return user.pairs.reduce<{ pair: any; reason: 'needs_attention' | 'inactive'; emotionColour?: string }[]>((acc, pair: any) => {
      const pairUser = pair._pair_user || pair._user || pair.other_user;
      if (!pairUser) return acc;

      // Check if their recent coordinate has needs_attention
      const needsAttention = pairUser._recent_coordinate?.needs_attention
        || pairUser.recentCoordinate?.needs_attention;
      if (needsAttention) {
        const colour = pairUser._recent_emotion?.emotionColour
          || pairUser.recentEmotion?.emotionColour
          || pairUser._emotion_states?.emotionColour;
        acc.push({ pair, reason: 'needs_attention', emotionColour: colour });
        return acc;
      }

      // Check if they haven't checked in within 7 days
      const lastCheckin = pairUser.lastCheckInDate;
      if (!lastCheckin) {
        acc.push({ pair, reason: 'inactive' });
        return acc;
      }
      const lastDate = new Date(typeof lastCheckin === 'number' ? lastCheckin : lastCheckin);
      if (lastDate < sevenDaysAgo) {
        acc.push({ pair, reason: 'inactive' });
      }
      return acc;
    }, []);
  }, [user?.pairs]);

  return (
    <SafeAreaView style={styles.container} edges={safeEdges}>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>My Pulse</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity onPress={() => navigation.navigate('SupportRequests')} style={styles.iconWrap}>
            <TriangleAlert color={colors.textSecondary} size={26} strokeWidth={2} />
            {hasOpenMHFRRequest && (
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
        {/* Last Check In — always show if user has recent emotion data */}
        <LastCheckInWidget
          recentEmotion={user?.recentCheckInEmotion}
          last7CheckIns={user?.last7CheckIns}
          onTrendsPress={() => navigation.navigate('UserProfile', { userId: 'current-user', isNotPair: true })}
        >
          {/* When onboarding is incomplete, show progress cards instead of the chart */}
          {!onboardingAllComplete ? (
            <OnboardingProgress
              user={user}
              enrollment={enrollment}
              onNavigate={(screen, params) => navigation.navigate(screen as any, params)}
              onEnrollCourse={handleEnrollCourse}
            />
          ) : undefined}
        </LastCheckInWidget>

        {/* Suggested Check Ins — filtered pairs needing attention */}
        {suggestedPairs.length > 0 && (
          <>
            <View style={styles.suggestedTitleRow}>
              <Text style={styles.sectionTitle}>Suggested Check Ins</Text>
              <TouchableOpacity onPress={openSheet}>
                <Info color={colors.textPlaceholder} size={16} />
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.suggestedAvatarRow}
              style={styles.suggestedScrollBleed}
            >
              {suggestedPairs.map(({ pair, reason, emotionColour }) => {
                const pairUser = pair._pair_user || pair._user || pair.other_user;
                const name = pairUser?.fullName || pairUser?.firstName || 'Pair';
                const isInactive = reason === 'inactive';
                const borderColor = isInactive ? colors.warning : (emotionColour || colors.primary);

                return (
                  <TouchableOpacity
                    key={pair.id}
                    onPress={() => navigation.navigate('UserProfile', { userId: String(pair.pair_user_id), pairsId: pair.id })}
                    activeOpacity={0.7}
                  >
                    <Avatar
                      source={pairUser?.profilePic_url}
                      name={name}
                      size={46}
                      border={borderColor}
                      opacity={isInactive ? 0.5 : 1}
                    />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </>
        )}

        {/* Quick Actions */}
        <View style={[styles.gridRow, styles.gridRowLast]}>
          <QuickLinkCard
            variant="checkIn"
            title="Check In"
            onPress={() => navigation.navigate('CheckIn')}
            icon={<Heart color="rgba(255,255,255,0.9)" size={18} />}
          />
          <QuickLinkCard
            variant="pairs"
            title="My Pairs"
            onPress={() => navigation.navigate('Main' as any, { screen: 'Pulse', params: { screen: 'MyPairs' } })}
            icon={<Blend color="rgba(255,255,255,0.9)" size={18} />}
          />
        </View>

        {/* Next Lesson / Next Course — only show if enrolled */}
        {isEnrolled && (
          <NextLessonCard
            title={lessonTitle || courseTitle}
            subtitle={lessonTitle ? 'Next Lesson' : courseTitle ? 'Next Course' : undefined}
            onPress={handleLessonCardPress}
            onShowCourse={handleLessonCardPress}
          />
        )}
      </ScrollView>

      {/* Suggested Check Ins info sheet */}
      <Modal
        visible={showSuggestedTip}
        transparent
        animationType="none"
        onRequestClose={closeSheet}
      >
        <View style={styles.sheetContainer}>
          <RNAnimated.View style={[styles.sheetBackdrop, { opacity: sheetBackdropAnim }]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={closeSheet} />
          </RNAnimated.View>
          <RNAnimated.View style={[styles.sheetCard, { transform: [{ translateY: sheetSlideAnim }] }]}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Suggested Check Ins</Text>
            <Text style={styles.sheetBody}>
              These are pairs who haven't checked in within 7 days, or have checked in a state that might need attention.
            </Text>
            <TouchableOpacity style={styles.sheetButton} onPress={closeSheet}>
              <Text style={styles.sheetButtonText}>Got it</Text>
            </TouchableOpacity>
          </RNAnimated.View>
        </View>
      </Modal>

      <ConfettiCelebration
        visible={showConfetti}
        courseName={completedCourseName}
        onComplete={() => setShowConfetti(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background,
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

  // ── Quick Actions grid ──
  gridRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
    marginBottom: 4,
  },
  gridRowLast: {
    marginTop: 8,
    marginBottom: 8,
  },

  // ── Sections ──
  sectionTitle: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.heading,
    color: colors.textPrimary,
    marginBottom: 0,
    marginRight: 6,
  },
  suggestedTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  sheetContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  sheetCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 36,
    alignItems: 'center',
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: 16,
  },
  sheetTitle: {
    fontFamily: fonts.heading,
    fontSize: fontSizes.lg,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  sheetBody: {
    fontFamily: fonts.body,
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  sheetButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.button,
    paddingVertical: 12,
    paddingHorizontal: 40,
  },
  sheetButtonText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.base,
    color: colors.textOnPrimary,
  },
  suggestedScrollBleed: {
    marginHorizontal: -16,
  },
  suggestedAvatarRow: {
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },

});
