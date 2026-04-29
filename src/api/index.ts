// Barrel re-export for all API modules
export { tokenStore, XanoError, setOnAuthExpired } from './client';
export { auth } from './auth';
export { checkIns } from './checkins';
export { courses } from './courses';
export { emotions, staticData } from './emotions';
export { group, groups } from './groups';
export { notification } from './notifications';
export { onesignal } from './onesignal';
export { onboarding } from './onboarding';
export { pair, pairInvite, pairs } from './pairs';
export { runningStats } from './runningStats';
export { supportRequests } from './support';
export { user, users } from './users';

// Re-export all types
export type {
  XanoRecentCheckInEmotion,
  XanoLast7CheckIn,
  XanoUser,
  XanoAuthResponse,
  XanoTimelineCheckIn,
  XanoCheckInCreateResponse,
  XanoGlobalPulse,
  XanoEmotionState,
  XanoStateCoordinate,
  XanoGroup,
  XanoUserGroup,
  XanoForestMapEntry,
  XanoGroupsResponse,
  XanoPair,
  XanoPairsResponse,
  XanoPairCheckin,
  XanoNotification,
  XanoNotificationList,
  XanoDirection,
  XanoShift,
  XanoRunningStats,
  XanoCourse,
  XanoEnrollmentCourse,
  XanoEnrollment,
  XanoCourseModule,
  XanoCourseModules,
  XanoNextLessonAudio,
  XanoNextLesson,
  XanoLessonCompletionCourse,
  XanoLessonCompletionEnrollment,
  XanoLessonCompletion,
  XanoEmotionItem,
  XanoTriggerEmotion,
  XanoResolvedEmotion,
  XanoUpdatedEmotion,
  XanoSupportRequestUser,
  XanoSupportRequest,
} from './types';
