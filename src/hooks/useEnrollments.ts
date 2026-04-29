import { XanoEnrollment } from '../api';

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
