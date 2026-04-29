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
import { getSuggestedPairs } from '../../lib/suggestedPairs';

export default function MyPulseScreenV1() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<MainTabParamList, 'MyPulse'>>();
  const { user, refreshUser } = useAuth();
  const { enrollment, enrollmentLoaded, allEnrollments, fetchEnrollment } = useCourses();
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

  const initialLoadDone = useRef(false);
  const [cardReady, setCardReady] = useState(false);

  const { fetch: cachedRefreshUser, forceFetch: forceRefreshUser } = useCachedFetch(CACHE_KEYS.USER, refreshUser);
  const { fetch: cachedFetchEnrollment, forceFetch: forceFetchEnrollment } = useCachedFetch(CACHE_KEYS.ENROLLMENT, fetchEnrollment);
  const { hasOpenMHFRRequest, refreshMHFRRequests } = useMHFR();
  const { unreadCount, refetch: refetchNotifications } = useNotifications();
  const safeEdges = useSafeEdges(['top']);

  useFocusEffect(
    React.useCallback(() => {
      // On first focus, always force-fetch (bypass the timestamp cache) — the
      // timestamp cache only tracks freshness, not data. A cache-fresh hit
      // against an empty local state would leave `enrollment` null and cause
      // us to render OnboardingProgress instead of the chart for users who
      // are actually enrolled. Forcing the fetch guarantees local state is
      // populated before `cardReady` flips true.
      if (!initialLoadDone.current) {
        Promise.all([forceRefreshUser(), forceFetchEnrollment()]).then(() => {
          // Allow one render cycle for hook state to propagate
          requestAnimationFrame(() => {
            initialLoadDone.current = true;
            setCardReady(true);
          });
        });
      } else {
        cachedRefreshUser();
        cachedFetchEnrollment();
      }

      // Show confetti if navigated here after completing the final lesson of a course
      if (route.params?.courseCompleted) {
        setCompletedCourseName(route.params.courseName || '');
        setShowConfetti(true);
        // Clear the param so it doesn't re-trigger
        navigation.setParams({ courseCompleted: undefined, courseName: undefined } as any);
      }
    }, [cachedRefreshUser, cachedFetchEnrollment, forceRefreshUser, forceFetchEnrollment, route.params?.courseCompleted, navigation])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      forceRefreshUser(),
      forceFetchEnrollment(),
      refreshMHFRRequests(),
      refetchNotifications(),
    ]);
    setRefreshing(false);
  }, [forceRefreshUser, forceFetchEnrollment, refreshMHFRRequests, refetchNotifications]);

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

  // Onboarding checklist completion (for Get Started cards visibility).
  // Gate the `!!enrollment` check on `enrollmentLoaded` — before the first
  // fetchEnrollment resolves, `enrollment` is null not because the user lacks
  // an enrollment but because we haven't fetched yet. Treating that as
  // "not enrolled" flickers OnboardingProgress over the chart. If we haven't
  // confirmed the enrollment state yet, optimistically assume it's satisfied
  // so the chart stays visible for returning users.
  const enrollmentSatisfied = enrollmentLoaded ? !!enrollment : true;
  const onboardingAllComplete =
    !!user.avatarUrl &&
    (!!user.reminderFrequency && user.reminderFrequency !== 'NONE') &&
    (user.pairs?.length ?? 0) > 0 &&
    enrollmentSatisfied &&
    (user.last7CheckIns?.length ?? 0) >= 7 &&
    (user.groups?.length ?? 0) > 0;

  // Filter pairs that need a check-in, tagged with reason
  const suggestedPairs = useMemo(() => getSuggestedPairs(user), [user]);

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
        {!cardReady ? (
          <>
            {/* Skeleton: Last Check In */}
            <View style={styles.skeletonCard}>
              <View style={styles.skeletonLine} />
              <View style={[styles.skeletonLine, { width: '60%' }]} />
              <View style={styles.skeletonBlock} />
            </View>
            {/* Skeleton: Quick Actions */}
            <View style={styles.skeletonRow}>
              <View style={styles.skeletonTile} />
              <View style={styles.skeletonTile} />
            </View>
            {/* Skeleton: Course */}
            <View style={styles.skeletonCard}>
              <View style={styles.skeletonLine} />
              <View style={[styles.skeletonLine, { width: '50%' }]} />
            </View>
          </>
        ) : (
          <>
            {/* Last Check In */}
            <LastCheckInWidget
              recentEmotion={user?.recentCheckInEmotion}
              last7CheckIns={user?.last7CheckIns}
              onTrendsPress={() => navigation.navigate('UserProfile', { userId: 'current-user', isNotPair: true })}
            >
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
                          hexColour={pairUser?.profile_hex_colour}
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
          </>
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
  skeletonCard: {
    borderRadius: borderRadius.lg,
    padding: 20,
    gap: 12,
    marginBottom: 16,
  },
  skeletonLine: {
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(0,0,0,0.06)',
    width: '40%',
  },
  skeletonBlock: {
    height: 100,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(0,0,0,0.04)',
    marginTop: 4,
  },
  skeletonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  skeletonTile: {
    flex: 1,
    height: 80,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(0,0,0,0.04)',
  },

});
