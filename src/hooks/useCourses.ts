import { useState, useCallback } from 'react';
import {
  courses as xanoCourses,
  XanoEnrollment,
  XanoCourse,
  XanoCourseModule,
  XanoCourseModules,
  XanoLessonCompletion,
  XanoNextLesson,
} from '../api';
import { useCourseContext } from '../contexts/CourseContext';
import { useAsyncHandler } from './useAsyncHandler';

// ── Re-export helpers ─────────────────────────────────────────────────────────

export { getEnrollmentCourseName, getEnrollmentCourseDescription, getEnrollmentModuleCount } from './useEnrollments';

// ── Hook ────────────────────────────────────────────────────────────────────

interface UseCoursesResult {
  enrollment: XanoEnrollment | null;
  allEnrollments: XanoEnrollment[];
  enrollmentLoaded: boolean;
  courseModules: XanoCourseModule[];
  courseModulesRaw: XanoCourseModules | null;
  nextModule: XanoCourseModule | null;
  isLoading: boolean;
  error: string | null;
  fetchEnrollment: () => Promise<void>;
  fetchCourseModules: () => Promise<void>;
  markLessonComplete: (moduleId: number) => Promise<XanoLessonCompletion | null>;
  // Legacy per-screen transient state (not shared across consumers)
  nextCourse: XanoCourse | null;
  nextLesson: XanoNextLesson | null;
  fetchNextCourse: (usersId?: number) => Promise<void>;
  fetchNextLesson: () => Promise<void>;
}

export function useCourses(): UseCoursesResult {
  const {
    enrollment,
    allEnrollments,
    enrollmentLoaded,
    isLoading: contextLoading,
    error: contextError,
    fetchEnrollment,
    courseModules,
    courseModulesRaw,
    nextModule,
    fetchCourseModules,
    markLessonComplete,
  } = useCourseContext();

  // Per-screen transient state: nextCourse / nextLesson are fetched by
  // specific flows (onboarding, course-enroll) and don't need cross-screen
  // sharing. Keeping them local avoids re-fetching them globally when only
  // one screen cares.
  const [nextCourse, setNextCourse] = useState<XanoCourse | null>(null);
  const [nextLesson, setNextLesson] = useState<XanoNextLesson | null>(null);
  const { isLoading: localLoading, error: localError, wrap } = useAsyncHandler();

  const fetchNextCourse = useCallback(async (usersId?: number) => {
    const data = await wrap(() => xanoCourses.getNextCourse(usersId));
    if (data) setNextCourse(data);
  }, [wrap]);

  const fetchNextLesson = useCallback(async () => {
    const data = await wrap(() => xanoCourses.getNextLesson());
    if (data && data.id && data.title) setNextLesson(data);
  }, [wrap]);

  return {
    enrollment,
    allEnrollments,
    enrollmentLoaded,
    courseModules,
    courseModulesRaw,
    nextModule,
    isLoading: contextLoading || localLoading,
    error: contextError ?? localError,
    fetchEnrollment,
    fetchCourseModules,
    markLessonComplete,
    nextCourse,
    nextLesson,
    fetchNextCourse,
    fetchNextLesson,
  };
}
