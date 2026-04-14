import { request } from './client';
import type {
  XanoCourse,
  XanoEnrollment,
  XanoNextLesson,
  XanoLessonCompletion,
} from './types';

export const courses = {
  getCourses: () =>
    request<XanoCourse>('GET', '/courses/get_courses'),

  getEnrollment: () =>
    request<XanoEnrollment[]>('GET', '/courses/get_enrollment'),

  getCurrentModules: (usersId?: number) =>
    request<{ result1: string; current_enrolment: string }>(
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
    request<XanoEnrollment>('POST', '/course/enroll', {
      users_id: usersId,
      courses_id: coursesId,
    }),
};
