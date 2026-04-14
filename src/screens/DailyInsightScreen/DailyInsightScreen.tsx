import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Animated,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ChevronLeft } from 'lucide-react-native';
import { RootStackParamList } from '../../types/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { useCheckIns } from '../../hooks/useCheckIns';
import { useRunningStats } from '../../hooks/useRunningStats';
import { usePairs } from '../../hooks/usePairs';
import { useCourses } from '../../hooks/useCourses';
import { useEmotionStates } from '../../hooks/useEmotionStates';
import TimelineView from '../../components/DailyInsight/TimelineView';
import UserOutlookTab from '../UserProfileScreen/components/UserOutlookTab';
import PairsListView from '../../components/DailyInsight/PairsListView';
import { useSafeEdges } from '../../contexts/MHFRContext';
import { colors, fonts, fontSizes, spacing, buttonStyles } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'DailyInsight'>;
type InsightStep = 'timeline' | 'trends' | 'pairs';

const STEPS: InsightStep[] = ['timeline', 'trends', 'pairs'];

const STEP_TITLES: Record<InsightStep, string> = {
  timeline: 'Your Last 7 Days',
  trends: 'Your Trends',
  pairs: 'Your Pairs',
};

export default function DailyInsightScreen({ navigation }: Props) {
  const safeEdges = useSafeEdges(['top', 'bottom']);
  const { user } = useAuth();
  const checkInsHook = useCheckIns();
  const runningStatsHook = useRunningStats();
  const pairsHook = usePairs();
  const coursesHook = useCourses();
  const { emotionStates } = useEmotionStates();

  const [step, setStep] = useState<InsightStep>('timeline');
  const [dataReady, setDataReady] = useState(false);

  // Fade-slide animation
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const animateTransition = useCallback(
    (nextStep: InsightStep, direction: 'forward' | 'back') => {
      const slideOut = direction === 'forward' ? -30 : 30;
      const slideIn = direction === 'forward' ? 30 : -30;

      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: slideOut, duration: 150, useNativeDriver: true }),
      ]).start(() => {
        setStep(nextStep);
        slideAnim.setValue(slideIn);
        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
          Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        ]).start();
      });
    },
    [fadeAnim, slideAnim],
  );

  // Fetch data on mount
  useEffect(() => {
    async function loadData() {
      const promises: Promise<void>[] = [];

      // Fetch timeline from API (last 7 days) — use local dates
      const now = new Date();
      const toLocal = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const endDate = toLocal(now);
      const start = new Date(now);
      start.setDate(start.getDate() - 7);
      const startDate = toLocal(start);
      promises.push(checkInsHook.fetchTimeline(startDate, endDate).catch(() => {}));

      if (user?.runningStatsId) {
        promises.push(
          runningStatsHook.fetchById(user.runningStatsId).catch(() => {}),
        );
      }

      promises.push(pairsHook.fetchAll().catch(() => {}));
      promises.push(coursesHook.fetchEnrollment().catch(() => {}));

      await Promise.all(promises);
      setDataReady(true);
    }

    loadData();
  }, []);

  const handleSkip = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.popToTop();
    } else {
      navigation.navigate('Main' as any);
    }
  }, [navigation]);

  const handleBack = useCallback(() => {
    const currentIndex = STEPS.indexOf(step);
    if (currentIndex > 0) {
      animateTransition(STEPS[currentIndex - 1], 'back');
    }
  }, [step, animateTransition]);

  const enrollmentNextLesson = coursesHook.enrollment?.next_lesson ?? null;

  const handleContinue = useCallback(() => {
    const currentIndex = STEPS.indexOf(step);
    if (currentIndex < STEPS.length - 1) {
      animateTransition(STEPS[currentIndex + 1], 'forward');
    } else {
      if (enrollmentNextLesson) {
        navigation.replace('Lessons', { lesson: enrollmentNextLesson });
      } else {
        if (navigation.canGoBack()) {
          navigation.popToTop();
        } else {
          navigation.navigate('Main' as any);
        }
      }
    }
  }, [step, navigation, enrollmentNextLesson, animateTransition]);

  const handlePairPress = useCallback(
    (userId: string, pairsId: number) => {
      navigation.navigate('UserProfile', { userId, pairsId });
    },
    [navigation],
  );

  // Derive outlook data from running stats for the current user
  const stats = runningStatsHook.stats as any;
  const prevCheckin = stats?.prev_checkin_location;
  const currentCheckin = stats?.current_checkin_location;
  const rawLastCheckin = stats?.days_since_last_pulse || 'No data';
  const lastCheckinLabel = rawLastCheckin.charAt(0).toUpperCase() + rawLastCheckin.slice(1);
  const checkinRate = stats?.checkin_frequency
    ? `${stats.checkin_frequency.toFixed(1)}x`
    : 'N/A';
  const totalCheckins = stats?.checkInCount ?? 'N/A';
  const modeEmotion = stats?.checkInMode?.emotionText;
  const modeEmotionStatesId = stats?.checkInMode?.emotion_states_id;
  const modeEmotionColour = (() => {
    for (const period of [stats?.at, stats?.w1, stats?.m1]) {
      if (period?.emotion_states_id === modeEmotionStatesId && period?.emotion_states?.emotionColour) {
        return period.emotion_states.emotionColour;
      }
    }
    return colors.textPlaceholder;
  })();
  const allTimeEmotion = emotionStates.find(e => e.xanoId === modeEmotionStatesId);
  const outlookDirections = useMemo(() => [
    { label: 'Daily', data: stats?.direction_t_p, themeColour: currentCheckin?.colour },
    { label: '7 Day', data: stats?.direction_w1_w2, themeColour: stats?.w1?.themeColour ?? stats?.w1?.emotion_states?.themeColour },
    { label: '30 Day', data: stats?.direction_m1_m2, themeColour: stats?.m1?.themeColour ?? stats?.m1?.emotion_states?.themeColour },
    { label: 'All Time', data: stats?.direction_m1_at, themeColour: allTimeEmotion?.themeColour },
  ], [stats, currentCheckin, allTimeEmotion]);

  const stepIndex = STEPS.indexOf(step);
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === STEPS.length - 1;
  const hasNextLesson = isLastStep && !!enrollmentNextLesson;
  const continueLabel = isLastStep
    ? hasNextLesson
      ? 'Continue to Lesson'
      : 'Close'
    : 'Continue';
  const showSkip = !isLastStep || hasNextLesson;

  // Filter to trusted pairs only (DUAL type)
  const trustedPairs = useMemo(
    () => pairsHook.active.filter((p: any) => p.pairType === 'DUAL'),
    [pairsHook.active],
  );

  if (!dataReady) {
    return (
      <SafeAreaView style={styles.container} edges={safeEdges}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={safeEdges}>
      {/* Header */}
      <View style={styles.header}>
        {isFirstStep ? (
          <View style={styles.backPlaceholder} />
        ) : (
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <ChevronLeft color={colors.textSecondary} size={24} />
          </TouchableOpacity>
        )}
        <Text style={styles.title}>{STEP_TITLES[step]}</Text>
        <View style={styles.backPlaceholder} />
      </View>

      {/* Content with fade-slide animation */}
      <Animated.View
        style={[
          styles.animatedContent,
          { opacity: fadeAnim, transform: [{ translateX: slideAnim }] },
        ]}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            step === 'timeline' && styles.scrollContentCentered,
            step === 'trends' && styles.scrollContentFullWidth,
          ]}
          showsVerticalScrollIndicator={false}
        >
          {step === 'timeline' && (
            <TimelineView checkIns={checkInsHook.timeline} />
          )}
          {step === 'trends' && (
            stats ? (
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
            ) : runningStatsHook.isLoading ? (
              <ActivityIndicator size="large" color={colors.primary} />
            ) : null
          )}
          {step === 'pairs' && (
            <PairsListView
              pairs={trustedPairs}
              currentUserId={user?.id || ''}
              currentUserFirstName={user?.firstName || user?.name?.split(' ')[0]}
              onPairPress={handlePairPress}
              onSendReminder={pairsHook.sendCheckinReminder}
            />
          )}
        </ScrollView>
      </Animated.View>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[buttonStyles.primary.container, styles.continueButton]}
          onPress={handleContinue}
        >
          <Text style={buttonStyles.primary.text}>{continueLabel}</Text>
        </TouchableOpacity>
        {showSkip && (
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.base,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backPlaceholder: {
    width: 40,
    height: 40,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: fontSizes['2xl'],
    color: colors.textPrimary,
    textAlign: 'center',
    flex: 1,
  },
  animatedContent: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing['3xl'],
  },
  scrollContentCentered: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  scrollContentFullWidth: {
    paddingHorizontal: 0,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.base,
    alignItems: 'center',
  },
  continueButton: {
    width: '100%',
  },
  skipButton: {
    paddingVertical: spacing.md,
  },
  skipText: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.md,
    color: colors.textMuted,
  },
});
