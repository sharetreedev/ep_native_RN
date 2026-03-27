import { useState, useCallback } from 'react';
import { courses as xanoCourses, XanoEnrollment } from '../api';
import { useAsyncHandler } from './useAsyncHandler';

// ── Helpers to read course info from enrollment (nested `course` or flat) ────

export function getEnrollmentCourseName(e: XanoEnrollment | null): string {
  if (!e) return 'Current Course';
  return e.course?.name || e.course?.title || e.course_name || 'Current Course';
}

export function getEnrollmentCourseDescription(e: XanoEnrollment | null): string {
  if (!e) return '';
  return e.course?.description || e.course_description || '';
}

export function getEnrollmentModuleCount(e: XanoEnrollment | null): number {
  if (!e) return 0;
  return e.course?.module_count ?? e.module_count ?? 0;
}

// ── Hook ────────────────────────────────────────────────────────────────────

export function useEnrollments() {
  const [allEnrollments, setAllEnrollments] = useState<XanoEnrollment[]>([]);
  const [enrollment, setEnrollment] = useState<XanoEnrollment | null>(null);
  const { isLoading, error, wrap } = useAsyncHandler();

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
  }, [wrap]);

  const updateEnrollment = useCallback((updater: (prev: XanoEnrollment | null) => XanoEnrollment | null) => {
    setEnrollment(updater);
  }, []);

  return {
    enrollment,
    allEnrollments,
    isLoading,
    error,
    wrap,
    fetchEnrollment,
    updateEnrollment,
  };
}
