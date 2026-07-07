/**
 * Timezone-aware date helpers.
 *
 * All bucketing / "what calendar day is this?" decisions in the app go through
 * here so they consistently use the user's stored IANA timezone (from
 * AuthContext) rather than the device's local timezone — which can differ when
 * a user travels. If a timezone isn't supplied the device default is used.
 *
 * Prefer the epoch-ms overloads (`userDateOf(timestamp, tz)`) over string
 * overloads. A bare `YYYY-MM-DD` date string carries no time-of-day and is
 * returned unchanged: in that case we trust the caller's framing.
 */

type DateInput = Date | number | string;

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

function makeFormatter(timezone: string | null | undefined, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  try {
    return new Intl.DateTimeFormat('en-CA', { ...options, timeZone: timezone || undefined });
  } catch {
    return new Intl.DateTimeFormat('en-CA', options);
  }
}

function toDate(input: DateInput): Date | null {
  if (input instanceof Date) return isNaN(input.getTime()) ? null : input;
  if (typeof input === 'number') {
    const d = new Date(input);
    return isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(input);
  return isNaN(d.getTime()) ? null : d;
}

/** YYYY-MM-DD for the given moment in the given timezone. */
export function userDateOf(input: DateInput, timezone?: string | null): string {
  if (typeof input === 'string' && DATE_ONLY_RE.test(input)) return input;
  const d = toDate(input);
  if (!d) return typeof input === 'string' ? input.slice(0, 10) : '';
  return makeFormatter(timezone, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

/** YYYY-MM-DD for today in the given timezone. */
export function userToday(timezone?: string | null): string {
  return userDateOf(new Date(), timezone);
}

/**
 * YYYY-MM-DD for N days before today in the given timezone. Uses 24h-step
 * arithmetic so DST drift can't accumulate past ~1h on any leg; for the small
 * N values we use (≤30) this lands on the correct calendar day every time.
 */
export function userDaysAgo(daysAgo: number, timezone?: string | null): string {
  return userDateOf(Date.now() - daysAgo * 24 * 60 * 60 * 1000, timezone);
}

/**
 * Human "last check-in" label — "Today" / "Yesterday" / "N days ago" — for a
 * check-in date, evaluated in the user's timezone. Accepts a `YYYY-MM-DD`
 * string, an ISO datetime, or epoch ms (anything `userDateOf` understands).
 * The check-in day and today are both compared at UTC midnight so the result
 * is an exact count of calendar days. Returns null for missing/unparseable
 * input (callers typically render "No data").
 */
export function lastCheckInLabel(input: DateInput | null | undefined, timezone?: string | null): string | null {
  if (input === null || input === undefined || input === '') return null;
  const day = userDateOf(input, timezone);
  const then = Date.parse(`${day}T00:00:00Z`);
  const now = Date.parse(`${userToday(timezone)}T00:00:00Z`);
  if (isNaN(then) || isNaN(now)) return null;
  const days = Math.round((now - then) / 86_400_000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}
