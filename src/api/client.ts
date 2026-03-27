// Xano HTTP client
// Instance: xdny-scc5-yag9  |  Workspace: Emotional Pulse  |  Branch: v1
// All endpoints go through the Mobile Native API (canonical: LmTnxskw).
//
// Data source is driven by EXPO_PUBLIC_XANO_DATA_SOURCE in .env:
//   EXPO_PUBLIC_XANO_DATA_SOURCE=staging  → staging data
//   EXPO_PUBLIC_XANO_DATA_SOURCE=test     → test data (default)
//   EXPO_PUBLIC_XANO_DATA_SOURCE=live     → production data
import * as SecureStore from 'expo-secure-store';

const INSTANCE = 'xdny-scc5-yag9';
const CANONICAL = 'LmTnxskw';

export const DATA_SOURCE =
  (process.env.EXPO_PUBLIC_XANO_DATA_SOURCE as 'live' | 'staging' | 'test' | undefined) ?? 'test';

export const BASE_URL = `https://${INSTANCE}.a2.xano.io/api:${CANONICAL}`;

// ---------------------------------------------------------------------------
// Token store
// ---------------------------------------------------------------------------

const TOKEN_KEY = 'xano_token';
let _token: string | null = null;

export const tokenStore = {
  get: () => _token,
  load: async () => {
    _token = await SecureStore.getItemAsync(TOKEN_KEY);
    return _token;
  },
  set: async (t: string | null) => {
    _token = t;
    if (t) await SecureStore.setItemAsync(TOKEN_KEY, t);
    else await SecureStore.deleteItemAsync(TOKEN_KEY);
  },
  clear: async () => {
    _token = null;
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  },
};

// ---------------------------------------------------------------------------
// Core request helpers
// ---------------------------------------------------------------------------

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export async function request<T>(
  method: HttpMethod,
  path: string,
  params?: Record<string, unknown>,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'x-data-source': DATA_SOURCE,
  };

  const token = tokenStore.get();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let url = `${BASE_URL}${path}`;
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

  console.log(`[Xano] ${method} ${url}`);
  if (body) console.log(`[Xano] Body:`, body);

  let res: Response;
  try {
    res = await fetch(url, { method, headers, body });
  } catch (err) {
    console.error(`[Xano] Fetch Error for ${url}:`, err);
    throw err;
  }

  console.log(`[Xano] Response: ${res.status} ${res.statusText}`);

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ message: res.statusText }));
    console.error(`[Xano] Error Body:`, errorBody);
    throw new XanoError(errorBody?.message ?? `HTTP ${res.status}`, res.status, errorBody);
  }

  return res.json() as Promise<T>;
}

export async function requestMultipart<T>(
  method: HttpMethod,
  path: string,
  formData: FormData,
): Promise<T> {
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'x-data-source': DATA_SOURCE,
  };

  const token = tokenStore.get();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const url = `${BASE_URL}${path}`;
  console.log(`[Xano] ${method} ${url} (multipart)`);

  let res: Response;
  try {
    res = await fetch(url, { method, headers, body: formData });
  } catch (err) {
    console.error(`[Xano] Fetch Error for ${url}:`, err);
    throw err;
  }

  console.log(`[Xano] Response: ${res.status} ${res.statusText}`);

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ message: res.statusText }));
    console.error(`[Xano] Error Body:`, errorBody);
    throw new XanoError(errorBody?.message ?? `HTTP ${res.status}`, res.status, errorBody);
  }

  return res.json() as Promise<T>;
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
