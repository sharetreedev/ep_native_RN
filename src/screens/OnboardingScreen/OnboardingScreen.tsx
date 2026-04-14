import React, { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useCheckIn } from '../../contexts/CheckInContext';
import { useOnboarding } from '../../hooks/useOnboarding';
import { useCourses } from '../../hooks/useCourses';
import { useCheckIns } from '../../hooks/useCheckIns';
import { useEmotionStates } from '../../hooks/useEmotionStates';
import { auth as xanoAuth, user as xanoUser, courses as xanoCourses } from '../../api';
import { setPendingLesson } from '../../navigation/pendingLesson';
import { MappedEmotion } from '../../hooks/useEmotionStates';
import EmailVerificationStep from './steps/EmailVerificationStep';
import PhoneEntryStep from './steps/PhoneEntryStep';
import PhoneVerificationStep from './steps/PhoneVerificationStep';
import IntroSlidesStep from './steps/IntroSlidesStep';
import FirstCheckInStep from './steps/FirstCheckInStep';
import CourseEnrollmentStep from './steps/CourseEnrollmentStep';

type OnboardingStep =
  | 'email_verification'
  | 'phone_entry'
  | 'phone_verification'
  | 'intro_slides'
  | 'first_checkin'
  | 'course_enrollment';

export default function OnboardingScreen() {
  const { user, refreshUser } = useAuth();
  const { markCheckedInToday } = useCheckIn();
  const onboarding = useOnboarding();
  const { emotionStates } = useEmotionStates();
  const { createCheckIn } = useCheckIns(undefined, emotionStates);
  const coursesHook = useCourses();

  // Determine starting step based on user state
  const getInitialStep = (): OnboardingStep => {
    if (!user?.emailVerified) return 'email_verification';
    if (!user?.phoneVerified) return 'phone_entry';
    if (user?.introSlidesSeen) return 'first_checkin';
    return 'intro_slides';
  };

  const [step, setStep] = useState<OnboardingStep>(getInitialStep);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Email Verification ──────────────────────────────────────────────
  const handleEmailVerified = useCallback(async () => {
    setIsSubmitting(true);
    try {
      await onboarding.markEmailVerified();
      await refreshUser();
      setStep('phone_entry');
    } catch {
      Alert.alert('Error', 'Verification failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [onboarding, refreshUser]);

  // ── Phone Entry ─────────────────────────────────────────────────────
  const handlePhoneSubmit = useCallback(async (phone: string, countryCode: string, countryIso: string) => {
    setIsSubmitting(true);
    try {
      const fullPhone = `${countryCode}${phone.replace(/\s/g, '')}`;
      await xanoUser.updatePhoneNumber(fullPhone, countryIso);
      await xanoAuth.generateCode('phone');
      setStep('phone_verification');
    } catch {
      Alert.alert('Error', 'Failed to submit phone number. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  // ── Phone Verification ──────────────────────────────────────────────
  const handlePhoneVerified = useCallback(async () => {
    setIsSubmitting(true);
    try {
      await onboarding.markPhoneVerified();
      await refreshUser();
      setStep('intro_slides');
    } catch {
      Alert.alert('Error', 'Verification failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [onboarding, refreshUser]);

  // ── Intro Slides ────────────────────────────────────────────────────
  const handleIntroComplete = useCallback(async () => {
    await onboarding.markIntroSlidesSeen();
    setStep('first_checkin');
  }, [onboarding]);

  // ── First Check-In ──────────────────────────────────────────────────
  const handleCheckInComplete = useCallback(async (emotion: MappedEmotion, coordinateId: number, checkinView: 'slider' | 'grid') => {
    Alert.alert('Check In', `Do you want to check in as ${emotion.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          try {
            await createCheckIn(emotion, coordinateId, undefined, checkinView);
            markCheckedInToday();
          } catch {
            // Non-fatal
          }
          await refreshUser();
          setStep('course_enrollment');
        },
      },
    ]);
  }, [createCheckIn, refreshUser, markCheckedInToday]);

  // ── Course Enrollment ───────────────────────────────────────────────
  useEffect(() => {
    if (step === 'course_enrollment') {
      coursesHook.fetchNextCourse(Number(user?.id));
      coursesHook.fetchNextLesson();
    }
  }, [step]);

  const handleEnroll = useCallback(async () => {
    setIsSubmitting(true);
    try {
      // Create the enrollment record
      const courseId = coursesHook.nextCourse?.id ?? coursesHook.nextCourse?.courses_id;
      if (courseId) {
        await xanoCourses.enroll(Number(user?.id), Number(courseId));
      }
      // Set pending lesson so AppNavigator navigates after onboarding completes
      if (coursesHook.nextLesson) {
        setPendingLesson(coursesHook.nextLesson);
      }
      await onboarding.markCourseEnrollmentSeen(Number(user?.id));
      await onboarding.markComplete();
      await refreshUser();
    } catch {
      Alert.alert('Error', 'Failed to complete enrollment.');
    } finally {
      setIsSubmitting(false);
    }
  }, [onboarding, user?.id, refreshUser, coursesHook.nextLesson, coursesHook.nextCourse]);

  const handleSkipCourse = useCallback(async () => {
    setIsSubmitting(true);
    try {
      await onboarding.markCourseEnrollmentSeen(Number(user?.id));
      await onboarding.markComplete();
      await refreshUser();
    } catch {
      Alert.alert('Error', 'Failed to complete onboarding.');
    } finally {
      setIsSubmitting(false);
    }
  }, [onboarding, user?.id, refreshUser]);

  // ── Render ──────────────────────────────────────────────────────────

  if (step === 'email_verification') {
    return (
      <EmailVerificationStep
        email={user?.email ?? ''}
        onComplete={handleEmailVerified}
        isSubmitting={isSubmitting}
      />
    );
  }

  if (step === 'phone_entry') {
    return (
      <PhoneEntryStep
        onSubmit={handlePhoneSubmit}
        isSubmitting={isSubmitting}
      />
    );
  }

  if (step === 'phone_verification') {
    return (
      <PhoneVerificationStep
        onComplete={handlePhoneVerified}
        isSubmitting={isSubmitting}
      />
    );
  }

  if (step === 'intro_slides') {
    return <IntroSlidesStep onComplete={handleIntroComplete} />;
  }

  if (step === 'first_checkin') {
    return (
      <FirstCheckInStep
        onComplete={handleCheckInComplete}
        emotionStates={emotionStates}
      />
    );
  }

  if (step === 'course_enrollment') {
    return (
      <CourseEnrollmentStep
        nextCourse={coursesHook.nextCourse}
        onEnroll={handleEnroll}
        onSkip={handleSkipCourse}
        isSubmitting={isSubmitting}
        isLoading={coursesHook.isLoading}
      />
    );
  }

  return null;
}
