// Centralised fire-and-forget bug reporter for the Xano `/bugs` endpoint.
// All production error telemetry (HTTP failures from the API client,
// caught exceptions via `reportError`, render errors via `ErrorBoundary`)
// funnels through `postBug()` so we have one place that enforces PII
// scrubbing before anything leaves the device.
//
// The endpoint is unauthenticated and stores reports in a non-sensitive
// table — we must never forward user emails, phone numbers, JWTs, or
// session tokens in error bodies. Anything user-identifiable gets
// replaced with a `[…]` placeholder before the POST.

const BUGS_URL = 'https://xdny-scc5-yag9.a2.xano.io/api:IRATJote/bugs';

export interface BugReport {
  /** Logical source — URL for HTTP errors, a context string for caught errors, `'react-render'` for render crashes. */
  url: string;
  /** HTTP status (for API failures) or omitted otherwise. */
  status?: number;
  /** Short category tag: `'mobile native - api'`, `'mobile native - caught'`, `'mobile native - react'`. */
  type: string;
  /** Human-readable one-liner; truncated to 500 chars. */
  description: string;
  /** Structured error body (will be serialised — nested objects are fine). */
  raw: unknown;
}

/**
 * Scrub common PII patterns from a string. Applied to the entire serialised
 * JSON body, not individual fields — safe because the patterns below don't
 * overlap with JSON structural characters (no quotes, braces, colons, etc.).
 */
export function scrubPII(input: string): string {
  return input
    // Email addresses
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, '[email]')
    // JWTs (three base64url segments separated by dots, leading `eyJ`)
    .replace(/eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '[token]')
    // Bearer tokens in header-style strings
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [token]')
    // International-looking phone numbers: optional +, then 8+ digits with
    // common separators. Run after email/token so a numeric substring of a
    // token isn't matched first.
    .replace(/\+?\d[\d\s\-().]{7,}\d/g, '[phone]');
}

export function postBug(report: BugReport): void {
  let body: string;
  try {
    body = scrubPII(JSON.stringify(report));
  } catch {
    // Circular refs etc. — fall back to a minimal shape so we still get
    // some signal.
    body = JSON.stringify({
      url: report.url,
      type: report.type,
      description: scrubPII(String(report.description).slice(0, 500)),
      raw: { message: 'unserialisable error body' },
    });
  }

  fetch(BUGS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  }).catch(() => {}); // never block the app
}
