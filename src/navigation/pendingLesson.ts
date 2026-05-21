import * as SecureStore from 'expo-secure-store';
import type { XanoNextLesson } from '../api/types';
import { logger } from '../lib/logger';

const STORAGE_KEY = 'pending_lesson_v1';

// In-memory mirror of the persisted value. Lets `peekPendingLesson()` and the
// navigation-state listener answer synchronously without an async SecureStore
// round-trip on every state change.
let cached: XanoNextLesson | null = null;
let hydrated = false;
let hydrationPromise: Promise<void> | null = null;

async function hydrate(): Promise<void> {
  if (hydrated) return;
  if (hydrationPromise) return hydrationPromise;
  hydrationPromise = (async () => {
    try {
      const raw = await SecureStore.getItemAsync(STORAGE_KEY);
      if (raw) cached = JSON.parse(raw) as XanoNextLesson;
    } catch (e) {
      logger.warn('[pendingLesson] hydrate failed:', e);
    } finally {
      hydrated = true;
      hydrationPromise = null;
    }
  })();
  return hydrationPromise;
}

// Eager hydration so peekPendingLesson() is accurate as soon as the navigator
// mounts. Safe to fire-and-forget; consumers that need a strict guarantee can
// still await `hydratePendingLesson()`.
hydrate();

export function hydratePendingLesson(): Promise<void> {
  return hydrate();
}

export async function setPendingLesson(lesson: XanoNextLesson | null): Promise<void> {
  cached = lesson;
  hydrated = true;
  try {
    if (lesson) {
      await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(lesson));
    } else {
      await SecureStore.deleteItemAsync(STORAGE_KEY);
    }
  } catch (e) {
    logger.warn('[pendingLesson] persist failed:', e);
  }
}

export function peekPendingLesson(): XanoNextLesson | null {
  return cached;
}

export async function consumePendingLesson(): Promise<XanoNextLesson | null> {
  await hydrate();
  const lesson = cached;
  if (!lesson) return null;
  cached = null;
  try {
    await SecureStore.deleteItemAsync(STORAGE_KEY);
  } catch (e) {
    logger.warn('[pendingLesson] clear failed:', e);
  }
  return lesson;
}
