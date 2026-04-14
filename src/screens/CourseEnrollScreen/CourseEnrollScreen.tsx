import React, { useEffect, useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { useCourses } from '../../hooks/useCourses';
import { courses as xanoCourses } from '../../api';
import { invalidate, CACHE_KEYS } from '../../lib/fetchCache';
import CourseEnrollmentStep from '../OnboardingScreen/steps/CourseEnrollmentStep';

export default function CourseEnrollScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, refreshUser } = useAuth();
  const { nextCourse, fetchNextCourse, fetchEnrollment, isLoading } = useCourses();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchNextCourse(Number(user?.id));
  }, []);

  const handleEnroll = useCallback(async () => {
    setIsSubmitting(true);
    try {
      const courseId = nextCourse?.id ?? (nextCourse as any)?.courses_id;
      if (courseId) {
        await xanoCourses.enroll(Number(user?.id), Number(courseId));
      }
      invalidate(CACHE_KEYS.ENROLLMENT);
      await fetchEnrollment();
      await refreshUser();
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Failed to enroll. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [nextCourse, user?.id, fetchEnrollment, refreshUser, navigation]);

  const handleSkip = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  return (
    <CourseEnrollmentStep
      nextCourse={nextCourse}
      onEnroll={handleEnroll}
      onSkip={handleSkip}
      isSubmitting={isSubmitting}
      isLoading={isLoading}
    />
  );
}
