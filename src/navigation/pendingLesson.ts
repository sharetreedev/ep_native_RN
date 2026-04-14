import type { XanoNextLesson } from '../api/types';

let pendingLesson: XanoNextLesson | null = null;

export function setPendingLesson(lesson: XanoNextLesson | null) {
  pendingLesson = lesson;
}

export function consumePendingLesson(): XanoNextLesson | null {
  const lesson = pendingLesson;
  pendingLesson = null;
  return lesson;
}
