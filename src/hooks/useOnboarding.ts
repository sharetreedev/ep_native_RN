import { onboarding as xanoOnboarding, XanoUser } from '../api';
import { useAsyncHandler } from './useAsyncHandler';

interface UseOnboardingResult {
  isLoading: boolean;
  error: string | null;
  markComplete: () => Promise<XanoUser | null>;
  markEmailVerified: () => Promise<XanoUser | null>;
  markPhoneVerified: () => Promise<XanoUser | null>;
  markIntroSlidesSeen: () => Promise<XanoUser | null>;
  markTrendCardSeen: () => Promise<XanoUser | null>;
  markCourseEnrollmentSeen: (usersId: number) => Promise<XanoUser | null>;
}

export function useOnboarding(): UseOnboardingResult {
  const { isLoading, error, wrap } = useAsyncHandler();

  return {
    isLoading,
    error,
    markComplete: () => wrap(xanoOnboarding.complete),
    markEmailVerified: () => wrap(xanoOnboarding.emailVerified),
    markPhoneVerified: () => wrap(xanoOnboarding.phoneVerified),
    markIntroSlidesSeen: () => wrap(xanoOnboarding.introSlidesSeen),
    markTrendCardSeen: () => wrap(xanoOnboarding.trendCardSeen),
    markCourseEnrollmentSeen: (usersId: number) =>
      wrap(() => xanoOnboarding.markCourseEnrollmentSeen(usersId)),
  };
}
