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
