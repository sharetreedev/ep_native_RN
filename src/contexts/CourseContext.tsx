import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { useAsyncHandler } from '../hooks/useAsyncHandler';
import { invalidate, CACHE_KEYS } from '../lib/fetchCache';
import {
  courses as xanoCourses,
  user as xanoUser,
  XanoCourseModule,
  XanoCourseModules,
  XanoEnrollment,
  XanoLessonCompletion,
} from '../api';

interface CourseContextValue {
  enrollment: XanoEnrollment | null;
  allEnrollments: XanoEnrollment[];
  /** True once fetchEnrollment has resolved at least once in this session.
   *  Distinguishes "no enrollment" (null after load) from "not yet loaded". */
  enrollmentLoaded: boolean;
  isLoading: boolean;
  error: string | null;

  fetchEnrollment: () => Promise<void>;
  /** Imperative setter used by flows that mutate enrollment outside of a fetch
   *  (e.g. optimistic updates after `markLessonComplete`). */
  updateEnrollment: (updater: (prev: XanoEnrollment | null) => XanoEnrollment | null) => void;

  courseModules: XanoCourseModule[];
  courseModulesRaw: XanoCourseModules | null;
  nextModule: XanoCourseModule | null;
  fetchCourseModules: () => Promise<void>;
  markLessonComplete: (moduleId: number) => Promise<XanoLessonCompletion | null>;
}

const CourseContext = createContext<CourseContextValue | null>(null);

export function CourseProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { isLoading, error, wrap } = useAsyncHandler();

  const [enrollment, setEnrollment] = useState<XanoEnrollment | null>(null);
  const [allEnrollments, setAllEnrollments] = useState<XanoEnrollment[]>([]);
  const [enrollmentLoaded, setEnrollmentLoaded] = useState(false);
  const [courseModulesRaw, setCourseModulesRaw] = useState<XanoCourseModules | null>(null);

  // Reset on identity change (login, logout, account swap). The provider lives
  // for the app's lifetime, so this is the single place enrollment state is
  // cleared — no module-level cache, no per-hook-instance drift.
  useEffect(() => {
    setEnrollment(null);
    setAllEnrollments([]);
    setEnrollmentLoaded(false);
    setCourseModulesRaw(null);
  }, [user?.id]);

  const fetchEnrollment = useCallback(async () => {
    const data = await wrap(() => xanoCourses.getEnrollment());
    if (data && Array.isArray(data) && data.length > 0) {
      setAllEnrollments(data);
      const active =
        data.find((e) => e.completion_status === 'in progress') ??
        data.find((e) => e.completion_status === 'not started') ??
        data[0];
      setEnrollment(active);
    } else if (data && !Array.isArray(data)) {
      const single = data as unknown as XanoEnrollment;
      setAllEnrollments([single]);
      setEnrollment(single);
    }
    // `wrap` returns null both on a genuinely empty response and on fetch
    // failure, so we deliberately don't clear state on null — preserve the
    // last-known-good value. The next successful fetch will correct it.
    setEnrollmentLoaded(true);
  }, [wrap]);

  const updateEnrollment = useCallback(
    (updater: (prev: XanoEnrollment | null) => XanoEnrollment | null) => {
      setEnrollment((prev) => updater(prev));
    },
    [],
  );

  const fetchCourseModules = useCallback(async () => {
    const data = await wrap(() => xanoUser.courseModules());
    if (data) setCourseModulesRaw(data);
  }, [wrap]);

  const courseModules: XanoCourseModule[] = useMemo(() => {
    const raw = courseModulesRaw?.my_modules;
    let modules: XanoCourseModule[];
    if (Array.isArray(raw)) {
      modules = raw;
    } else if (typeof raw === 'string') {
      try {
        modules = JSON.parse(raw);
      } catch {
        return [];
      }
    } else {
      return [];
    }

    if (enrollment?.last_completed_module != null) {
      const lcm = enrollment.last_completed_module;
      const lastCompletedId = typeof lcm === 'object' ? lcm.id : lcm;
      const lastCompletedIdx = modules.findIndex(
        (m) => m.result1?.id === lastCompletedId,
      );

      if (lastCompletedIdx >= 0) {
        return modules.map((m, idx) => ({
          ...m,
          completed: idx <= lastCompletedIdx,
        }));
      }
    }

    return modules;
  }, [courseModulesRaw, enrollment?.last_completed_module]);

  const nextModule = useMemo(
    () => courseModules.find((m) => m.completed === false) ?? null,
    [courseModules],
  );

  const markLessonComplete = useCallback(
    async (moduleId: number): Promise<XanoLessonCompletion | null> => {
      const result = await wrap(() => xanoCourses.markLessonComplete(moduleId));

      if (result) {
        invalidate(CACHE_KEYS.ENROLLMENT);
        setCourseModulesRaw((prev) => {
          if (!prev) return prev;
          const rawModules: XanoCourseModule[] = Array.isArray(prev.my_modules)
            ? prev.my_modules
            : typeof prev.my_modules === 'string'
              ? (() => { try { return JSON.parse(prev.my_modules as string); } catch { return []; } })()
              : [];

          const updated = rawModules.map((m) =>
            m.result1?.id === moduleId ? { ...m, completed: true } : m,
          );
          return { ...prev, my_modules: updated };
        });

        if (result.course_enrollment) {
          setEnrollment((prev) =>
            prev
              ? {
                  ...prev,
                  progress_percent: result.course_enrollment.progress_percent,
                  last_completed_module: result.course_enrollment.last_completed_module,
                  completion_status: result.course_enrollment.completion_status as XanoEnrollment['completion_status'],
                }
              : prev,
          );
        }
      }

      return result;
    },
    [wrap],
  );

  const value = useMemo<CourseContextValue>(
    () => ({
      enrollment,
      allEnrollments,
      enrollmentLoaded,
      isLoading,
      error,
      fetchEnrollment,
      updateEnrollment,
      courseModules,
      courseModulesRaw,
      nextModule,
      fetchCourseModules,
      markLessonComplete,
    }),
    [
      enrollment,
      allEnrollments,
      enrollmentLoaded,
      isLoading,
      error,
      fetchEnrollment,
      updateEnrollment,
      courseModules,
      courseModulesRaw,
      nextModule,
      fetchCourseModules,
      markLessonComplete,
    ],
  );

  return <CourseContext.Provider value={value}>{children}</CourseContext.Provider>;
}

export function useCourseContext(): CourseContextValue {
  const ctx = useContext(CourseContext);
  if (!ctx) throw new Error('useCourseContext must be used within CourseProvider');
  return ctx;
}
