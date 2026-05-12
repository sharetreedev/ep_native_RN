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
import { resetAndReload } from '../../lib/resetRuntime';
import { MappedEmotion } from '../../hooks/useEmotionStates';
import EmailVerificationStep from './steps/EmailVerificationStep';
import PhoneEntryStep from './steps/PhoneEntryStep';
import PhoneVerificationStep from './steps/PhoneVerificationStep';
import MergeAccountsStep from './steps/MergeAccountsStep';
import IntroSlidesStep from './steps/IntroSlidesStep';
import FirstCheckInStep from './steps/FirstCheckInStep';
import CourseEnrollmentStep from './steps/CourseEnrollmentStep';
import { useToast } from '../../contexts/ToastContext';

type OnboardingStep =
  | 'email_verification'
  | 'phone_entry'
  | 'phone_verification'
  | 'merge_accounts'
  | 'intro_slides'
  | 'first_checkin'
  | 'course_enrollment';

export default function OnboardingScreen() {
  const { user, refreshUser, logout } = useAuth();
  const { markCheckedInToday } = useCheckIn();
  const onboarding = useOnboarding();
  const { emotionStates } = useEmotionStates();
  const { createCheckIn } = useCheckIns();
  const coursesHook = useCourses();
  const { showToast } = useToast();

  // Determine starting step based on user state
  const getInitialStep = (): OnboardingStep => {
    if (!user?.emailVerified) return 'email_verification';
    if (!user?.phoneVerified) return 'phone_entry';
    if (user?.introSlidesSeen) return 'first_checkin';
    return 'intro_slides';
  };

  const [step, setStep] = useState<OnboardingStep>(getInitialStep);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // If `/user/update_phone_number` reports the number belongs to another
  // account, we capture that account's id here. After OTP verification we
  // route the user to the merge-accounts step instead of completing phone
  // verification on the new account — the merge endpoint consolidates the
  // two records and the existing account becomes the user's source of truth.
  const [mergeExistingUserId, setMergeExistingUserId] = useState<number | null>(null);
  // True if the user reached intro_slides via the merge path. The merged-into
  // account is typically already past first check-in / course enrollment, so
  // after the slides we exit straight to the main app instead of continuing
  // the rest of the onboarding chain.
  const [cameFromMerge, setCameFromMerge] = useState(false);

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
      const result = await xanoUser.updatePhoneNumber(fullPhone, countryIso);
      // Xano sometimes returns booleans as native booleans and sometimes as
      // strings ("true"/"1"); accept either, and require a parseable
      // existing_user_id before queuing the merge step.
      const rawIsExisting = result.is_existing_user as unknown;
      const isExisting =
        rawIsExisting === true ||
        rawIsExisting === 'true' ||
        rawIsExisting === '1' ||
        rawIsExisting === 1;
      const existingId = Number(result.existing_user_id);
      setMergeExistingUserId(isExisting && existingId > 0 ? existingId : null);
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
    // If a merge is pending, hand off to the merge step *without* marking
    // the phone as verified on this account — the merge endpoint will fold
    // this signup into the existing account, which is where verification
    // status needs to live.
    if (mergeExistingUserId) {
      setStep('merge_accounts');
      return;
    }
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
  }, [onboarding, refreshUser, mergeExistingUserId]);

  // ── Merge Accounts ──────────────────────────────────────────────────
  const handleMergeAccounts = useCallback(async () => {
    if (!mergeExistingUserId) return;
    setIsSubmitting(true);
    try {
      await xanoAuth.mergeAccounts(mergeExistingUserId);
      showToast('Accounts merged', { variant: 'success' });
      setMergeExistingUserId(null);
      // Show the 4 intro slides as a "welcome" after merge. We deliberately
      // skip `refreshUser()` here: the merged-into account is past onboarding
      // on the server, so refreshing would flip `onboardingComplete` to true
      // and AppNavigator would immediately unmount this screen before the
      // slides can render. We refresh in `handleIntroComplete` instead.
      setCameFromMerge(true);
      setStep('intro_slides');
    } catch {
      Alert.alert('Error', 'Failed to merge accounts. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [mergeExistingUserId, showToast]);

  const handleUseDifferentPhone = useCallback(() => {
    setMergeExistingUserId(null);
    setStep('phone_entry');
  }, []);

  // ── Intro Slides ────────────────────────────────────────────────────
  const handleIntroComplete = useCallback(async () => {
    if (cameFromMerge) {
      // Merged-into account is already past onboarding. Restart the JS
      // runtime to guarantee no module-scope state or in-memory cache from
      // the pre-merge identity leaks into the merged-into session — on
      // relaunch the auth token (still valid, now server-bound to the
      // merged account) bootstraps a clean session into MyPulse. The token
      // is intentionally preserved so the user doesn't need to sign in again.
      try {
        await resetAndReload({
          message: 'Setting up your account…',
          clearAuthToken: false,
          onesignalLogout: false,
        });
      } catch {
        // Reload unavailable — fall back to the soft handoff: refresh user
        // so AppNavigator drops us out of the Onboarding stack.
        await refreshUser();
      }
      return;
    }
    await onboarding.markIntroSlidesSeen();
    setStep('first_checkin');
  }, [cameFromMerge, onboarding, refreshUser]);

  // ── First Check-In ──────────────────────────────────────────────────
  const handleCheckInComplete = useCallback(async (emotion: MappedEmotion, coordinateId: number, checkinView: 'slider' | 'grid') => {
    Alert.alert('Check In', `Do you want to check in as ${emotion.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          try {
            await createCheckIn(emotion, coordinateId, checkinView);
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
    }
  }, [step]);

  const handleEnroll = useCallback(async () => {
    setIsSubmitting(true);
    try {
      // /course/enroll returns `next_lesson` atomically with the enrollment
      // row, so we get the first lesson in a single round-trip. Persist it
      // BEFORE markComplete/refreshUser — refreshUser flips `onboardingComplete`
      // and AppNavigator immediately swaps stacks and consumes pendingLesson,
      // so the SecureStore write must be durable by then.
      const courseId = coursesHook.nextCourse?.id ?? coursesHook.nextCourse?.courses_id;
      if (courseId) {
        const { next_lesson } = await xanoCourses.enroll(Number(user?.id), Number(courseId));
        if (next_lesson) await setPendingLesson(next_lesson);
      }
      await onboarding.markCourseEnrollmentSeen(Number(user?.id));
      await onboarding.markComplete();
      await refreshUser();
    } catch {
      Alert.alert('Error', 'Failed to complete enrollment.');
    } finally {
      setIsSubmitting(false);
    }
  }, [onboarding, user?.id, refreshUser, coursesHook.nextCourse]);

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
        onBack={logout}
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

  if (step === 'merge_accounts') {
    return (
      <MergeAccountsStep
        onMerge={handleMergeAccounts}
        onUseDifferentPhone={handleUseDifferentPhone}
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
