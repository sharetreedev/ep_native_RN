import React, { useState, useCallback } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, Modal, TouchableWithoutFeedback, RefreshControl, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, MainTabParamList } from '../../types/navigation';
import { Bell, TriangleAlert, Info, User, Hand, Heart } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import LastCheckInWidget from '../../components/LastCheckInWidget';
import { useCourses } from '../../hooks/useCourses';
import QuickLinkCard from '../../components/QuickLinkCard';
import NextLessonCard from '../../components/NextLessonCard';
import AIMHFRCard from '../../components/AIMHFRCard';
import ConfettiCelebration from '../../components/ConfettiCelebration';
import { colors, fonts, fontSizes, borderRadius, buttonStyles } from '../../theme';
import PulseLoader from '../../components/PulseLoader';
import { useCachedFetch } from '../../hooks/useCachedFetch';
import { CACHE_KEYS } from '../../lib/fetchCache';

export default function MyPulseScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<MainTabParamList, 'MyPulse'>>();
  const [modalVisible, setModalVisible] = useState(false);
  const { user, refreshUser } = useAuth();
  const { enrollment, allEnrollments, fetchEnrollment } = useCourses();
  const [refreshing, setRefreshing] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
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
  const nextLessonFromModules = enrollment?.modules?.find(
    (m) => m.id > (enrollment?.last_completed_module ?? 0),
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

  if (!user) return <PulseLoader />;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>My Pulse</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity onPress={() => navigation.navigate('SupportRequests')}>
            <TriangleAlert color={colors.textSecondary} size={24} strokeWidth={2} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
            <Bell color={colors.textSecondary} size={24} strokeWidth={2} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Account')}>
            <User color={colors.textSecondary} size={24} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Last Check In */}
        <LastCheckInWidget
          recentEmotion={user?.recentCheckInEmotion}
          last7CheckIns={user?.last7CheckIns}
          onTrendsPress={() => navigation.navigate('UserProfile', { userId: 'current-user', isNotPair: true })}
        />

        {/* AI Mental Health First Responder */}
        <AIMHFRCard onPress={() => navigation.navigate('AIMHFR')} />

        {/* Suggested Check Ins — only show if pairs exist */}
        {user?.pairs && user.pairs.length > 0 && (
          <>
            <View style={styles.suggestedRow}>
              <Text style={styles.sectionTitle}>Suggested Check Ins</Text>
              <TouchableOpacity onPress={() => setModalVisible(true)}>
                <Info color={colors.textPlaceholder} size={16} />
              </TouchableOpacity>
            </View>
            {user.pairs.slice(0, 3).map((pair: any) => {
              const pairUser = pair._pair_user || pair._user;
              const name = pairUser?.fullName || pairUser?.firstName || 'Pair';
              const pairAvatarUrl = pairUser?.profilePic_url || pairUser?.avatar?.url;
              return (
                <TouchableOpacity
                  key={pair.id}
                  style={styles.pairRow}
                  onPress={() => navigation.navigate('UserProfile', { userId: String(pair.pair_user_id), isNotPair: false })}
                >
                  {pairAvatarUrl ? (
                    <Image source={{ uri: pairAvatarUrl }} style={styles.pairAvatar} />
                  ) : (
                    <View style={styles.pairAvatarPlaceholder}>
                      <User color={colors.textOnPrimary} size={14} />
                    </View>
                  )}
                  <Text style={styles.pairName}>{name}</Text>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity style={styles.viewPairsButton} onPress={() => navigation.navigate('Main' as any, { screen: 'MyPairs' })}>
              <Text style={styles.viewPairsText}>View My Pairs</Text>
            </TouchableOpacity>
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
            variant="support"
            title="Get Support"
            onPress={() => navigation.navigate('EmergencyServices')}
            icon={<Hand color="rgba(255,255,255,0.9)" size={18} />}
          />
        </View>

        {/* Next Lesson / Next Course */}
        <NextLessonCard
          title={lessonTitle || courseTitle}
          subtitle={lessonTitle ? 'Next Lesson' : courseTitle ? 'Next Course' : undefined}
          onPress={handleLessonCardPress}
          onShowCourse={handleLessonCardPress}
        />
      </ScrollView>

      <Modal
        animationType="fade"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <TouchableWithoutFeedback>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>About Check Ins</Text>
              <Text style={styles.modalBody}>
                Here are your Pairs who have checked in within the last 7 days.
              </Text>
              <TouchableOpacity
                style={[buttonStyles.secondary.container, { marginTop: 24 }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={buttonStyles.secondary.text}>Got it</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </TouchableOpacity>
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
  suggestedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  viewPairsButton: {
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: borderRadius.full,
    marginBottom: 28,
    alignSelf: 'center',
  },
  viewPairsText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  pairRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    marginBottom: 2,
  },
  pairAvatar: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pairAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pairName: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.base,
    color: colors.textPrimary,
    flex: 1,
  },

  // ── Modal ──
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.overlay,
  },
  modalCard: {
    backgroundColor: colors.surface,
    margin: 24,
    padding: 24,
    borderRadius: 16,
    width: '80%',
    maxWidth: 400,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.heading,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  modalBody: {
    fontFamily: fonts.body,
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    lineHeight: 22,
  },
});
