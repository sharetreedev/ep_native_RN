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
import { useEnrollments } from './useEnrollments';
import { useCourseModules } from './useCourseModules';

// ── Re-export helpers ─────────────────────────────────────────────────────────

export { getEnrollmentCourseName, getEnrollmentCourseDescription, getEnrollmentModuleCount } from './useEnrollments';

// ── Hook ────────────────────────────────────────────────────────────────────

interface UseCoursesResult {
  enrollment: XanoEnrollment | null;
  allEnrollments: XanoEnrollment[];
  courseModules: XanoCourseModule[];
  courseModulesRaw: XanoCourseModules | null;
  nextModule: XanoCourseModule | null;
  isLoading: boolean;
  error: string | null;
  fetchEnrollment: () => Promise<void>;
  fetchCourseModules: () => Promise<void>;
  markLessonComplete: (moduleId: number) => Promise<XanoLessonCompletion | null>;
  // Legacy
  nextCourse: XanoCourse | null;
  nextLesson: XanoNextLesson | null;
  fetchNextCourse: (usersId?: number) => Promise<void>;
  fetchNextLesson: () => Promise<void>;
}

export function useCourses(): UseCoursesResult {
  const { enrollment, allEnrollments, isLoading, error, wrap, fetchEnrollment, updateEnrollment } = useEnrollments();
  const { courseModules, courseModulesRaw, nextModule, fetchCourseModules, markLessonComplete } = useCourseModules({ enrollment, wrap, updateEnrollment });

  // Legacy methods
  const [nextCourse, setNextCourse] = useState<XanoCourse | null>(null);
  const [nextLesson, setNextLesson] = useState<XanoNextLesson | null>(null);

  const fetchNextCourse = useCallback(async (usersId?: number) => {
    const data = await wrap(() => xanoCourses.getNextCourse(usersId));
    if (data) setNextCourse(data);
  }, [wrap]);

  const fetchNextLesson = useCallback(async () => {
    const data = await wrap(() => xanoCourses.getNextLesson());
    if (data && data.id && data.title) {
      setNextLesson(data);
    }
  }, [wrap]);

  return {
    enrollment,
    allEnrollments,
    courseModules,
    courseModulesRaw,
    nextModule,
    isLoading,
    error,
    fetchEnrollment,
    fetchCourseModules,
    markLessonComplete,
    nextCourse,
    nextLesson,
    fetchNextCourse,
    fetchNextLesson,
  };
}
