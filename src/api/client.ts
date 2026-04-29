// Xano HTTP client
// Instance: xdny-scc5-yag9  |  Workspace: Emotional Pulse
// All endpoints go through the Mobile Native API (canonical: LmTnxskw).
//
// Two independent axes route requests to the correct backend:
//
// 1. Data source (header `x-data-source`) — driven by EXPO_PUBLIC_XANO_DATA_SOURCE,
//    which MUST be set via EAS environment variables for builds/OTAs:
//      production  → live
//      preview     → staging
//      development → test
//    Local dev reads the value from .env.local (or .env). There is NO default —
//    a missing or invalid value throws at module-load time so a misconfigured
//    build can never silently talk to the wrong backend.
//
// 2. API branch (URL suffix, e.g. `:LmTnxskw:staging`) — driven by __DEV__:
//      dev (Expo Go + EAS `development` channel) → `:staging` branch
//      preview + production builds               → main branch (no suffix)
//    Branches hold in-progress API changes; hard-routing dev to the staging
//    branch lets the backend team iterate without impacting preview/prod.
import * as SecureStore from 'expo-secure-store';
import { logger } from '../lib/logger';
import { postBug } from '../lib/bugReporter';

const INSTANCE = 'xdny-scc5-yag9';
const CANONICAL = 'LmTnxskw';

type XanoDataSource = 'live' | 'staging' | 'test';
const VALID_DATA_SOURCES: readonly XanoDataSource[] = ['live', 'staging', 'test'] as const;

const rawDataSource = process.env.EXPO_PUBLIC_XANO_DATA_SOURCE;

if (!rawDataSource) {
  throw new Error(
    '[Xano] EXPO_PUBLIC_XANO_DATA_SOURCE is not set. ' +
    'Local dev: add it to .env.local. ' +
    'Builds/OTAs: must be pushed via `npm run ota:production` / `ota:preview` ' +
    'which pass --environment so EAS-hosted env vars are used.',
  );
}

if (!VALID_DATA_SOURCES.includes(rawDataSource as XanoDataSource)) {
  throw new Error(
    `[Xano] Invalid EXPO_PUBLIC_XANO_DATA_SOURCE: "${rawDataSource}". ` +
    `Must be one of: ${VALID_DATA_SOURCES.join(', ')}.`,
  );
}

export const DATA_SOURCE = rawDataSource as XanoDataSource;

// Hard guardrail: any non-dev build MUST be on the live data source.
// If a misconfigured OTA ever lands, the app will crash on launch and users
// will fall back to the previous embedded bundle — far safer than silently
// running against test data.
if (!__DEV__ && DATA_SOURCE !== 'live') {
  throw new Error(
    `[Xano] Non-dev build must use 'live' data source, got "${DATA_SOURCE}". ` +
    `This build will not run. Re-publish the OTA via \`npm run ota:production\`.`,
  );
}

// Dev builds hit the `:staging` Xano branch; prod/preview hit the main branch.
// Exported so sibling API groups (e.g. the `8DFWet8T` checkin-create endpoint)
// can construct their own base URLs with matching branch routing.
export const BRANCH_SUFFIX = __DEV__ ? ':staging' : '';

export const BASE_URL = `https://${INSTANCE}.a2.xano.io/api:${CANONICAL}${BRANCH_SUFFIX}`;

// ---------------------------------------------------------------------------
// Token store
// ---------------------------------------------------------------------------

const TOKEN_KEY = 'xano_token';
let _token: string | null = null;

// All SecureStore calls are wrapped in try/catch. On iOS the keychain can be
// locked (pre-first-unlock), on Android the keystore can throw on corrupt
// aliases after OS updates, and Expo Go has flaky behaviour. In every case
// the right move is to treat storage as unavailable and fall through to the
// in-memory token — the worst outcome is the user has to log in again next
// cold start, never an app hang or crash.
export const tokenStore = {
  get: () => _token,
  load: async () => {
    try {
      _token = await SecureStore.getItemAsync(TOKEN_KEY);
    } catch (e) {
      logger.error('[tokenStore] load failed, continuing with no token:', e);
      _token = null;
    }
    return _token;
  },
  set: async (t: string | null) => {
    _token = t;
    try {
      if (t) await SecureStore.setItemAsync(TOKEN_KEY, t);
      else await SecureStore.deleteItemAsync(TOKEN_KEY);
    } catch (e) {
      logger.error('[tokenStore] set failed (in-memory token still valid):', e);
    }
  },
  clear: async () => {
    _token = null;
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    } catch (e) {
      logger.error('[tokenStore] clear failed (in-memory cleared):', e);
    }
  },
};

// ---------------------------------------------------------------------------
// Auth-expired callback
// ---------------------------------------------------------------------------
// A 401/403 on a request that sent a Bearer token means the token is no
// longer valid (expired, revoked). We clear it immediately and notify any
// registered listener (AuthContext) so the UI can drop to the auth screen
// instead of sitting on a half-authed state with silent empty fetches.

let onAuthExpired: (() => void) | null = null;
export const setOnAuthExpired = (handler: (() => void) | null) => {
  onAuthExpired = handler;
};

// ---------------------------------------------------------------------------
// Core request helpers
// ---------------------------------------------------------------------------

const REQUEST_TIMEOUT_MS = 30000;
const RETRY_MAX_ATTEMPTS = 2;
const RETRY_BACKOFF_MS = [1000, 2000];

// Dedupe fire-and-forget bug logs — if an endpoint is broken, a single screen
// can fan out to dozens of identical error reports. Suppress duplicates of the
// same (url, status) within a short window.
const BUG_DEDUP_WINDOW_MS = 60_000;
const recentBugs = new Map<string, number>();

function shouldLogBug(url: string, status: number): boolean {
  const key = `${status}:${url}`;
  const now = Date.now();
  const last = recentBugs.get(key);
  if (last && now - last < BUG_DEDUP_WINDOW_MS) return false;
  recentBugs.set(key, now);
  // Opportunistic cleanup to keep the map bounded
  if (recentBugs.size > 200) {
    for (const [k, t] of recentBugs) {
      if (now - t > BUG_DEDUP_WINDOW_MS) recentBugs.delete(k);
    }
  }
  return true;
}

/** Fire-and-forget bug log for non-200 API responses. PII-scrubbed via `postBug`. */
function logBug(url: string, status: number, errorBody: unknown) {
  if (!shouldLogBug(url, status)) return;
  const message =
    typeof errorBody === 'object' && errorBody
      ? (errorBody as { message?: string }).message || JSON.stringify(errorBody).slice(0, 500)
      : String(errorBody);
  postBug({
    url,
    status,
    type: 'mobile native - api',
    description: `HTTP ${status} — ${message}`,
    raw: typeof errorBody === 'object' ? errorBody : { message: String(errorBody), status },
  });
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

function buildHeaders(contentType: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'x-data-source': DATA_SOURCE,
  };
  if (contentType) headers['Content-Type'] = contentType;
  const token = tokenStore.get();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

/** Decide whether a failed attempt (network or 5xx) is worth retrying. */
function isRetryable(method: HttpMethod, errorOrStatus: unknown): boolean {
  // Only retry idempotent methods. POSTs might have side-effects we don't
  // want to double up (e.g. creating a check-in twice).
  if (method !== 'GET') return false;
  if (typeof errorOrStatus === 'number') return errorOrStatus >= 500 && errorOrStatus < 600;
  // Network failure / abort / timeout
  return true;
}

async function handleResponse<T>(res: Response, url: string, hadToken: boolean): Promise<T> {
  logger.log(`[Xano] Response: ${res.status} ${res.statusText}`);
  if (res.ok) return res.json() as Promise<T>;

  const errorBody = await res.json().catch(() => ({ message: res.statusText }));
  logger.error(`[Xano] Error Body:`, errorBody);
  logBug(url, res.status, errorBody);

  // Auth expired: clear the invalid token and notify listeners. Gated on
  // `hadToken` so bad-credentials 401 from /auth/login doesn't nuke state
  // when there was no session to begin with.
  if ((res.status === 401 || res.status === 403) && hadToken) {
    try { await tokenStore.clear(); } catch { /* ignore */ }
    try { onAuthExpired?.(); } catch (e) { logger.error('[Xano] onAuthExpired handler threw:', e); }
  }

  throw new XanoError(errorBody?.message ?? `HTTP ${res.status}`, res.status, errorBody);
}

export async function request<T>(
  method: HttpMethod,
  path: string,
  params?: Record<string, unknown>,
  options?: { baseUrl?: string },
): Promise<T> {
  const headers = buildHeaders('application/json');
  const hadToken = headers['Authorization'] !== undefined;

  let url = `${options?.baseUrl ?? BASE_URL}${path}`;
  let body: string | undefined;

  if (method === 'GET' && params) {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null) qs.set(k, String(v));
    }
    const str = qs.toString();
    if (str) url += `?${str}`;
  } else if (params !== undefined) {
    body = JSON.stringify(params);
  }

  logger.log(`[Xano] ${method} ${url} [x-data-source=${DATA_SOURCE}]`);
  if (body) logger.log(`[Xano] Body:`, body);

  let lastError: unknown;
  for (let attempt = 0; attempt <= RETRY_MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetchWithTimeout(url, { method, headers, body });
      // Retry on 5xx for GETs, otherwise return/throw through handleResponse.
      if (!res.ok && isRetryable(method, res.status) && attempt < RETRY_MAX_ATTEMPTS) {
        logger.warn(`[Xano] ${method} ${url} → ${res.status}, retrying (attempt ${attempt + 2}/${RETRY_MAX_ATTEMPTS + 1})`);
        await new Promise((r) => setTimeout(r, RETRY_BACKOFF_MS[attempt] ?? 2000));
        continue;
      }
      return await handleResponse<T>(res, url, hadToken);
    } catch (err) {
      lastError = err;
      // XanoError from handleResponse is a final, structured error — don't retry.
      if (err instanceof XanoError) throw err;
      if (isRetryable(method, err) && attempt < RETRY_MAX_ATTEMPTS) {
        logger.warn(`[Xano] ${method} ${url} network error, retrying (attempt ${attempt + 2}/${RETRY_MAX_ATTEMPTS + 1}):`, err);
        await new Promise((r) => setTimeout(r, RETRY_BACKOFF_MS[attempt] ?? 2000));
        continue;
      }
      logger.error(`[Xano] Fetch Error for ${url}:`, err);
      throw err;
    }
  }
  throw lastError;
}

export async function requestMultipart<T>(
  method: HttpMethod,
  path: string,
  formData: FormData,
): Promise<T> {
  // Multipart: let fetch set the Content-Type (with boundary) itself.
  const headers = buildHeaders(null);
  const hadToken = headers['Authorization'] !== undefined;
  const url = `${BASE_URL}${path}`;
  logger.log(`[Xano] ${method} ${url} (multipart)`);

  let res: Response;
  try {
    res = await fetchWithTimeout(url, { method, headers, body: formData });
  } catch (err) {
    logger.error(`[Xano] Fetch Error for ${url}:`, err);
    throw err;
  }
  return handleResponse<T>(res, url, hadToken);
}

// ---------------------------------------------------------------------------
// Error class
// ---------------------------------------------------------------------------

export class XanoError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = 'XanoError';
  }
}
