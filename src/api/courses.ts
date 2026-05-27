import { request } from './client';
import type {
  XanoCourse,
  XanoEnrollment,
  XanoEnrollResponse,
  XanoNextLesson,
  XanoLessonCompletion,
} from './types';
import type { Body } from './schema';

// SPEC NOTE: most course endpoints' swagger responses are under-documented
// (deep nested joins on modules/lessons/audio aren't expressed). Hand-rolled
// types in src/api/types.ts model the real shape. When the spec catches up,
// swap each hand-rolled type for `Body<'…|GET'>` below.
export const courses = {
  getCourses: () =>
    request<XanoCourse>('GET', '/courses/get_courses'),

  getEnrollment: () =>
    request<XanoEnrollment[]>('GET', '/courses/get_enrollment'),

  getCurrentModules: (usersId?: number) =>
    request<Body<'api/courses/get_current_modules|GET'>>(
      'GET', '/courses/get_current_modules', usersId !== undefined ? { users_id: usersId } : undefined,
    ),

  getNextCourse: (usersId?: number) =>
    request<XanoCourse>(
      'GET', '/courses/get_next_course', usersId !== undefined ? { users_id: usersId } : undefined,
    ),

  getNextLesson: () =>
    request<XanoNextLesson>('GET', '/courses/get_next_lesson'),

  markLessonComplete: (moduleId: number) =>
    request<XanoLessonCompletion>('POST', '/courses/mark_lesson_complete', { module_id: moduleId }),

  enroll: (usersId: number, coursesId: number) =>
    request<XanoEnrollResponse>('POST', '/course/enroll', {
      users_id: usersId,
      courses_id: coursesId,
    }),
};
