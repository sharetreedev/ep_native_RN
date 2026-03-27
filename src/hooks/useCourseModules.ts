import { useState, useCallback, useMemo } from 'react';
import {
  courses as xanoCourses,
  user as xanoUser,
  XanoEnrollment,
  XanoCourseModule,
  XanoCourseModules,
  XanoLessonCompletion,
} from '../api';
import { invalidate, CACHE_KEYS } from '../lib/fetchCache';

interface UseCourseModulesOptions {
  enrollment: XanoEnrollment | null;
  wrap: <T>(fn: () => Promise<T>) => Promise<T | null>;
  updateEnrollment: (updater: (prev: XanoEnrollment | null) => XanoEnrollment | null) => void;
}

export function useCourseModules({ enrollment, wrap, updateEnrollment }: UseCourseModulesOptions) {
  const [courseModulesRaw, setCourseModulesRaw] = useState<XanoCourseModules | null>(null);

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

  const nextModule = useMemo(() => {
    return courseModules.find((m) => m.completed === false) ?? null;
  }, [courseModules]);

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
          updateEnrollment((prev) =>
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
    [wrap, updateEnrollment],
  );

  return {
    courseModules,
    courseModulesRaw,
    nextModule,
    fetchCourseModules,
    markLessonComplete,
  };
}
