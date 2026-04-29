/**
 * Lightweight dev-only logger.
 *
 * Use this in place of raw `console.*` calls so that debug output does not
 * leak into production builds (where `__DEV__` is `false`).
 *
 * - `logger.log` / `logger.debug` — stripped entirely in production
 * - `logger.warn` — stripped in production
 * - `logger.error` — always fires; errors should still be visible in prod crash logs
 *
 * @example
 *   import { logger } from '../lib/logger';
 *   logger.log('[Auth] token refreshed', { userId });
 */

type LogArgs = Parameters<typeof console.log>;

export const logger = {
  log: (...args: LogArgs) => {
    if (__DEV__) console.log(...args);
  },
  debug: (...args: LogArgs) => {
    if (__DEV__) console.debug(...args);
  },
  info: (...args: LogArgs) => {
    if (__DEV__) console.info(...args);
  },
  warn: (...args: LogArgs) => {
    if (__DEV__) console.warn(...args);
  },
  /** Errors are always logged (visible to crash reporters / dev tools). */
  error: (...args: LogArgs) => {
    console.error(...args);
  },
};

// ─── Caught-error reporting ───────────────────────────────────────────────────
//
// Use `reportError(context, error)` instead of a silent `.catch(() => {})`
// when a failure is expected-but-handled (e.g. a background fetch that a
// screen recovers from). Gives production visibility via the `/bugs`
// endpoint without requiring a full crash reporter. PII scrubbing happens
// inside `postBug` — see `src/lib/bugReporter.ts`.

import * as Sentry from '@sentry/react-native';
import { postBug } from './bugReporter';

// Dedupe caught-error reports per (context, message) within a short window
// so a broken dependency doesn't fan out to thousands of identical entries.
const REPORT_DEDUP_WINDOW_MS = 60_000;
const recentReports = new Map<string, number>();

function shouldReport(key: string): boolean {
  const now = Date.now();
  const last = recentReports.get(key);
  if (last && now - last < REPORT_DEDUP_WINDOW_MS) return false;
  recentReports.set(key, now);
  if (recentReports.size > 200) {
    for (const [k, t] of recentReports) {
      if (now - t > REPORT_DEDUP_WINDOW_MS) recentReports.delete(k);
    }
  }
  return true;
}

export function reportError(context: string, error: unknown): void {
  // Always log locally — dev tools, OS logs, and any future crash reporter
  // (Sentry/Bugsnag) will pick this up.
  console.error(`[${context}]`, error);

  const err = error as { name?: string; message?: string; stack?: string } | null;
  const message = err?.message ?? String(error);
  const key = `${context}:${message}`;
  if (!shouldReport(key)) return;

  Sentry.captureException(error, { tags: { context } });

  postBug({
    url: context,
    type: 'mobile native - caught',
    description: `${context}: ${message}`,
    raw: {
      name: err?.name,
      message,
      stack: err?.stack?.slice(0, 4000),
    },
  });
}
