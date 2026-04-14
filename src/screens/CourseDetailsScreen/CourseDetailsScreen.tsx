import React, { useMemo, useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, CircleCheck, Lock, CirclePlay } from 'lucide-react-native';
import Markdown from 'react-native-markdown-display';

const LESSON_IMAGE = require('../../../assets/ep-app-imagery.webp');
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { useCourses, getEnrollmentCourseName, getEnrollmentCourseDescription, getEnrollmentModuleCount } from '../../hooks/useCourses';
import { XanoEnrollment, XanoNextLesson } from '../../api';
import { colors, fonts, fontSizes, borderRadius, spacing } from '../../theme';
import { useSafeEdges } from '../../contexts/MHFRContext';

type Tab = 'modules' | 'details';

/** Derived module with completion status, built from enrollment data */
interface DerivedModule {
  lesson: XanoNextLesson;
  completed: boolean;
}

export default function CourseDetailsScreen() {
  const safeEdges = useSafeEdges(['top']);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'CourseDetails'>>();
  const enrollment = route.params?.enrollment ?? null;
  const { markLessonComplete } = useCourses();
  const [activeTab, setActiveTab] = useState<Tab>('modules');

  // Build module list directly from enrollment.modules + last_completed_module
  // This replaces the separate course_modules API call entirely
  const modules: DerivedModule[] = useMemo(() => {
    const rawModules = enrollment?.modules;
    if (!rawModules || rawModules.length === 0) return [];

    const lastCompletedId = enrollment?.last_completed_module ?? 0;

    // Find the index of the last completed module by its ID
    const lastCompletedIdx = rawModules.findIndex((m) => m.id === lastCompletedId);

    return rawModules.map((lesson, idx) => ({
      lesson,
      completed: lastCompletedIdx >= 0 ? idx <= lastCompletedIdx : false,
    }));
  }, [enrollment?.modules, enrollment?.last_completed_module]);

  // Derived: first non-completed module
  const nextModule = useMemo(() => {
    return modules.find((m) => !m.completed) ?? null;
  }, [modules]);

  const courseName = getEnrollmentCourseName(enrollment);
  const courseDescription = getEnrollmentCourseDescription(enrollment);
  const courseModuleCount = getEnrollmentModuleCount(enrollment);

  const completedCount = modules.filter((m) => m.completed).length;
  const totalCount = modules.length || courseModuleCount;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <SafeAreaView style={styles.container} edges={safeEdges}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft color={colors.textPrimary} size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{courseName}</Text>
        <View style={styles.backButton} />
      </View>

      {/* Tab bar */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'modules' && styles.activeTab]}
          onPress={() => setActiveTab('modules')}
        >
          <Text style={[styles.tabText, activeTab === 'modules' && styles.activeTabText]}>Modules</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'details' && styles.activeTab]}
          onPress={() => setActiveTab('details')}
        >
          <Text style={[styles.tabText, activeTab === 'details' && styles.activeTabText]}>Details</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {activeTab === 'modules' ? (
          <ModulesTab
            modules={modules}
            nextModule={nextModule}
            navigation={navigation}
          />
        ) : (
          <DetailsTab
            enrollment={enrollment}
            courseDescription={courseDescription}
            totalCount={totalCount}
            completedCount={completedCount}
            progressPercent={progressPercent}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Modules Tab ──────────────────────────────────────────────────────────────

function ModulesTab({
  modules,
  nextModule,
  navigation,
}: {
  modules: DerivedModule[];
  nextModule: DerivedModule | null;
  navigation: NativeStackNavigationProp<RootStackParamList>;
}) {
  const nextLessonId = nextModule?.lesson.id ?? null;

  return (
    <>
      {modules.length > 0 ? (
        modules.map((mod, idx) => {
          const { lesson, completed: isCompleted } = mod;
          const isCurrentLesson = !isCompleted && lesson.id === nextLessonId;
          const isLocked = !isCompleted && !isCurrentLesson;

          const handlePress = () => {
            navigation.navigate('Lessons', { lesson });
          };

          return (
            <TouchableOpacity
              key={lesson.id}
              style={[styles.lessonRow, isCurrentLesson && styles.lessonRowCurrent]}
              onPress={handlePress}
              disabled={isLocked}
              activeOpacity={isLocked ? 1 : 0.6}
            >
              <Image source={LESSON_IMAGE} style={styles.lessonImage} />
              <View style={styles.lessonInfo}>
                <Text style={[styles.lessonTitle, isLocked && styles.lessonTitleLocked]} numberOfLines={2}>
                  {lesson.title || `Lesson ${lesson.index}`}
                </Text>
                <Text style={[styles.lessonSubtext, isLocked && styles.lessonSubtextLocked]}>
                  Lesson {lesson.index}
                  {isCurrentLesson ? '  ·  Up Next' : isCompleted ? '  ·  Completed' : ''}
                </Text>
              </View>
              {isLocked ? (
                <Lock color={colors.textPlaceholder} size={18} />
              ) : isCompleted ? (
                <CircleCheck color={colors.primary} size={22} />
              ) : (
                <CirclePlay color={isCurrentLesson ? colors.primary : colors.textSecondary} size={22} />
              )}
            </TouchableOpacity>
          );
        })
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No modules available.</Text>
        </View>
      )}
    </>
  );
}

// ── Details Tab ──────────────────────────────────────────────────────────────

function DetailsTab({
  enrollment,
  courseDescription,
  totalCount,
  completedCount,
  progressPercent,
}: {
  enrollment: XanoEnrollment | null;
  courseDescription: string;
  totalCount: number;
  completedCount: number;
  progressPercent: number;
}) {
  const courseName = getEnrollmentCourseName(enrollment);
  const status = enrollment?.completion_status ?? 'not started';
  const enrolledOn = enrollment?.enrolled_on
    ? new Date(enrollment.enrolled_on).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  const statusLabel =
    status === 'completed' ? 'Completed' : status === 'in progress' ? 'In Progress' : 'Not Started';
  const statusColor =
    status === 'completed' ? colors.primary : status === 'in progress' ? colors.alert : colors.textMuted;

  return (
    <>
      <Text style={styles.detailsCourseName}>{courseName}</Text>

      {/* Status badge */}
      <View style={styles.detailsStatusRow}>
        <View style={[styles.detailsStatusBadge, { backgroundColor: statusColor + '20' }]}>
          <View style={[styles.detailsStatusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.detailsStatusText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
        {enrolledOn && (
          <Text style={styles.detailsEnrolledDate}>Enrolled {enrolledOn}</Text>
        )}
      </View>

      {/* Stats row — above description */}
      <View style={styles.detailsStatsRow}>
        {totalCount > 0 && (
          <View style={styles.detailsStat}>
            <Text style={styles.detailsStatValue}>{totalCount}</Text>
            <Text style={styles.detailsStatLabel}>Modules</Text>
          </View>
        )}
        <View style={styles.detailsStat}>
          <Text style={styles.detailsStatValue}>{completedCount}</Text>
          <Text style={styles.detailsStatLabel}>Completed</Text>
        </View>
        <View style={styles.detailsStat}>
          <Text style={styles.detailsStatValue}>{progressPercent}%</Text>
          <Text style={styles.detailsStatLabel}>Progress</Text>
        </View>
      </View>

      {/* Progress bar — above description */}
      {totalCount > 0 && (
        <View style={styles.detailsProgressWrap}>
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
          </View>
        </View>
      )}

      {/* Course description — rendered as markdown */}
      {courseDescription ? (
        <Markdown style={markdownStyles}>{courseDescription}</Markdown>
      ) : null}
    </>
  );
}

// ── Markdown styles ─────────────────────────────────────────────────────────

const markdownStyles = StyleSheet.create({
  body: {
    fontFamily: fonts.body,
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  strong: {
    fontFamily: fonts.bodyBold,
    color: colors.textPrimary,
  },
  em: {
    fontFamily: fonts.body,
    fontStyle: 'italic',
  },
  paragraph: {
    marginBottom: 12,
  },
  bullet_list: {
    marginBottom: 12,
  },
  list_item: {
    flexDirection: 'row',
    marginBottom: 4,
  },
});

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.heading,
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  scroll: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 40,
  },

  // ── Tab bar ──
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.base,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    alignItems: 'center' as const,
    paddingVertical: spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
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

  // ── Progress bar ──
  progressBarTrack: {
    height: 6,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },

  // ── Lesson list ──
  lessonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingRight: 14,
    paddingVertical: 0,
    marginBottom: 8,
    gap: 12,
    overflow: 'hidden',
    minHeight: 80,
  },
  lessonRowCurrent: {
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  lessonImage: {
    width: 80,
    height: '100%',
    resizeMode: 'cover',
  },
  lessonInfo: {
    flex: 1,
    paddingVertical: 10,
  },
  lessonTitle: {
    fontSize: fontSizes.base,
    fontFamily: fonts.bodyMedium,
    color: colors.textPrimary,
  },
  lessonTitleLocked: {
    color: colors.textPlaceholder,
  },
  lessonSubtext: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    marginTop: 2,
  },
  lessonSubtextLocked: {
    color: colors.textPlaceholder,
  },

  // ── Empty state ──
  emptyState: {
    marginTop: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: fontSizes.base,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // ── Details tab ──
  detailsStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  detailsStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
    gap: 6,
  },
  detailsStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  detailsStatusText: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.bodySemiBold,
  },
  detailsEnrolledDate: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.body,
    color: colors.textMuted,
  },
  detailsCourseName: {
    fontSize: fontSizes['2xl'],
    fontFamily: fonts.heading,
    color: colors.textPrimary,
    marginBottom: 12,
  },
  detailsStatsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: 16,
    marginBottom: 16,
    justifyContent: 'space-around',
  },
  detailsStat: {
    alignItems: 'center',
  },
  detailsStatValue: {
    fontSize: fontSizes.xl,
    fontFamily: fonts.heading,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  detailsStatLabel: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.bodyMedium,
    color: colors.textSecondary,
  },
  detailsProgressWrap: {
    marginBottom: 20,
  },
});
