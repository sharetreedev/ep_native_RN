import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, CircleCheck, CirclePlay } from 'lucide-react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { XanoEnrollment } from '../../api';
import { getEnrollmentCourseName, getEnrollmentCourseDescription } from '../../hooks/useCourses';
import { colors, fonts, fontSizes, borderRadius, spacing } from '../../theme';

const COURSE_IMAGE = require('../../../assets/Ep - App - Imageryt.webp');

export default function EnrollmentsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'Enrollments'>>();
  const enrollments = route.params?.enrollments ?? [];

  const handleCoursePress = (enrollment: XanoEnrollment) => {
    navigation.navigate('CourseDetails', { enrollment });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft color={colors.textPrimary} size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Courses</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {enrollments.map((enrollment) => {
          const courseName = getEnrollmentCourseName(enrollment);
          const courseDescription = getEnrollmentCourseDescription(enrollment);
          const isCompleted = enrollment.completion_status === 'completed';
          const isInProgress = enrollment.completion_status === 'in progress';
          const progressPercent = Math.round(enrollment.progress_percent ?? 0);

          const statusLabel = isCompleted
            ? 'Completed'
            : isInProgress
              ? 'In Progress'
              : 'Not Started';
          const statusColor = isCompleted
            ? colors.primary
            : isInProgress
              ? colors.alert
              : colors.textMuted;

          return (
            <TouchableOpacity
              key={enrollment.id}
              style={styles.courseCard}
              onPress={() => handleCoursePress(enrollment)}
              activeOpacity={0.7}
            >
              <Image source={COURSE_IMAGE} style={styles.courseImage} />
              <View style={styles.courseInfo}>
                <Text style={styles.courseName} numberOfLines={2}>{courseName}</Text>
                {courseDescription ? (
                  <Text style={styles.courseDescription} numberOfLines={2}>{courseDescription}</Text>
                ) : null}

                <View style={styles.courseFooter}>
                  {/* Status badge */}
                  <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                    <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                    <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
                  </View>

                  {/* Progress */}
                  {(isInProgress || isCompleted) && (
                    <Text style={styles.progressText}>{progressPercent}%</Text>
                  )}
                </View>

                {/* Progress bar */}
                {isInProgress && (
                  <View style={styles.progressBarTrack}>
                    <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
                  </View>
                )}
              </View>

              {isCompleted ? (
                <CircleCheck color={colors.primary} size={22} style={styles.courseIcon} />
              ) : (
                <CirclePlay color={colors.primary} size={22} style={styles.courseIcon} />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

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

  // ── Course card ──
  courseCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    marginBottom: 12,
    overflow: 'hidden',
    minHeight: 120,
  },
  courseImage: {
    width: 100,
    height: '100%',
    resizeMode: 'cover',
  },
  courseInfo: {
    flex: 1,
    padding: 14,
    justifyContent: 'center',
  },
  courseName: {
    fontSize: fontSizes.base,
    fontFamily: fonts.heading,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  courseDescription: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 8,
  },
  courseFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: fontSizes.xs,
    fontFamily: fonts.bodySemiBold,
  },
  progressText: {
    fontSize: fontSizes.xs,
    fontFamily: fonts.bodyMedium,
    color: colors.textMuted,
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  courseIcon: {
    alignSelf: 'center',
    marginRight: 14,
  },
});
