import React, { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Platform, AppState } from 'react-native';
import { auth as xanoAuth, tokenStore, XanoError, XanoAuthMeResponse, XanoGroup, XanoUserGroup, XanoPair, XanoRecentCheckInEmotion, XanoLast7CheckIn, groups as xanoGroups, pairs as xanoPairs, onesignal as onesignalApi, setOnAuthExpired, user as xanoUserApi, runningStats as xanoRunningStats } from '../api';
import { invalidateAll } from '../lib/fetchCache';
import { logger } from '../lib/logger';
import { errorStatus } from '../lib/errorUtils';
import { pickRandomProfileHex } from '../lib/profileColours';

/** Convert any date string (ISO/UTC or YYYY-MM-DD) to YYYY-MM-DD in the device's local timezone. */
function toLocalDateString(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso.slice(0, 10);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export interface User {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  /** Persistent hex colour used as the background for the initials fallback
   *  when the user has no avatar. Assigned once per user and stored on the
   *  Xano user row as `profile_hex_colour`. */
  profileHexColour?: string;
  phoneNumber?: string;
  country?: string;
  emotionState?: {
    themeColour: string;
    emotionColour: string;
  };
  recentCheckInEmotion?: XanoRecentCheckInEmotion | null;
  last7CheckIns?: XanoLast7CheckIn[] | null;
  runningStatsId?: number | null;
  groups?: Array<XanoGroup | XanoUserGroup>;
  pairs?: XanoPair[];
  onboardingComplete?: boolean;
  introSlidesSeen?: boolean;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  recentStateCoordinates?: number | { id: number } | null;
  lastCheckInDate?: string | null;
  isMHFR?: boolean;
  reminderFrequency?: string;
  reminderHour?: number;
  reminderMin?: number;
  preferredCheckinView?: 'slider' | 'grid' | '';
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  signup: (fields: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    country: string;
  }) => Promise<void>;
  loginWithMicrosoft: (code: string, codeVerifier: string, domain?: string, tenantId?: string) => Promise<void>;
  loginWithApple: (params: {
    identityToken: string;
    rawNonce: string;
    authorizationCode?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    appleUserId?: string | null;
  }) => Promise<void>;
  loginWithMobile: (authToken: string) => Promise<void>;
  logout: () => void;
  deleteAccount: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  refreshUser: () => Promise<void>;
  /** @internal Used by CheckInContext to update user state. Do not use directly. */
  _setUser: (updater: (prev: User | null) => User | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Load OneSignal once at module scope — avoid dynamic `await import()` which
// causes Metro to re-bundle the module on every call (producing repeated
// "Bundled Xms node_modules/react-native-onesignal/dist/index.js" logs).
let OneSignalModule: any = null;
if (Platform.OS !== 'web') {
  try {
    OneSignalModule = require('react-native-onesignal').OneSignal;
  } catch {
    // Native module not available (e.g. Expo Go) — leave null.
  }
}

/**
 * After authentication, grab the OneSignal push subscription ID and send it
 * to the backend if the user record doesn't already have one stored.
 */
async function syncOneSignalSubscriptionId(xanoUser: XanoAuthMeResponse): Promise<void> {
  if (!OneSignalModule) return;
  try {
    const subId = await OneSignalModule.User.pushSubscription.getIdAsync();
    // Always sync — subscription ID can change on reinstall or token rotation
    if (subId && subId !== xanoUser.onesignal_subscription_id) {
      await onesignalApi.updateSubscriptionId(subId);
    }
  } catch (e) {
    // Non-critical — don't block auth flow
    logger.warn('[AuthContext] Failed to sync OneSignal subscription ID:', e);
  }
}

function mapXanoUser(xano: XanoAuthMeResponse): User {
  const profilePicUrl = typeof xano.profilePic_url === 'object'
    ? xano.profilePic_url?.url
    : xano.profilePic_url;
  return {
    id: String(xano.id),
    email: xano.email,
    name: xano.fullName || xano.firstName || 'User',
    firstName: xano.firstName || undefined,
    lastName: xano.lastName || undefined,
    avatarUrl: profilePicUrl || xano.avatar?.url || undefined,
    profileHexColour: xano.profile_hex_colour || undefined,
    phoneNumber: xano.phoneNumber || undefined,
    country: xano.country || undefined,
    runningStatsId: xano.running_stats_id,
    emotionState: (xano._emotion_states || xano.recent_checkin_emotion) ? {
      themeColour: xano._emotion_states?.themeColour ?? xano.recent_checkin_emotion?.themeColour ?? '',
      emotionColour: xano._emotion_states?.emotionColour ?? xano.recent_checkin_emotion?.emotionColour ?? '',
    } : undefined,
    recentCheckInEmotion: xano.recent_checkin_emotion ?? null,
    last7CheckIns: xano.last_7_checkins ?? null,
    groups: xano._user_group?.map((ug) => ug.groups) || [],
    isMHFR: false, // resolved after groups fetch
    pairs: xano._pairs || [],
    onboardingComplete: xano.onboarding_complete ?? false,
    introSlidesSeen: xano.intro_slides_seen ?? false,
    emailVerified: xano.emailVerified ?? false,
    phoneVerified: xano.phoneVerified ?? false,
    recentStateCoordinates: xano.recentStateCoordinates ?? null,
    lastCheckInDate: xano.lastCheckInDate
      ? toLocalDateString(typeof xano.lastCheckInDate === 'number'
          ? new Date(xano.lastCheckInDate).toISOString()
          : xano.lastCheckInDate)
      : null,
    reminderFrequency: xano.reminder_frequency ?? undefined,
    reminderHour: xano.reminder_hour ?? undefined,
    reminderMin: xano.reminder_min ?? undefined,
    preferredCheckinView: xano.preferred_checkin_view || '',
  };
}

function getTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
}

async function syncLastSeen(): Promise<void> {
  try {
    await xanoUserApi.updateLastSeen(getTimezone());
  } catch (e) {
    logger.warn('[AuthContext] Failed to update last seen:', e);
  }
}

/** Assign a persistent fallback hex colour for the initials avatar when the
 *  user has neither a profile picture nor a previously-assigned hex. Mirrors
 *  the WeWeb onboarding behaviour so colours are consistent across surfaces.
 *  Silently no-ops on failure — the in-memory hex is still used for this
 *  session and the next login will retry. */
async function ensureProfileHexColour(user: User): Promise<User> {
  if (user.avatarUrl || user.profileHexColour) return user;
  const picked = pickRandomProfileHex();
  // PATCH endpoint requires first_name/last_name/phone_number/country/full_name
  // even on partial updates, so we resend existing values alongside the hex.
  // SSO users without a complete profile fall through with an in-memory hex
  // only — they'll re-roll until onboarding fills in the required fields.
  if (user.firstName && user.lastName && user.phoneNumber && user.country && user.name) {
    try {
      await xanoUserApi.updateProfile({
        first_name: user.firstName,
        last_name: user.lastName,
        phone_number: user.phoneNumber,
        country: user.country,
        full_name: user.name,
        profile_hex_colour: picked,
      });
    } catch (e) {
      logger.warn('[AuthContext] Failed to persist profile_hex_colour:', e);
    }
  }
  return { ...user, profileHexColour: picked };
}

/** Backfill a running_stats row for users who don't have one (notably Apple
 *  sign-up users — the Xano Apple callback historically skipped this).
 *  `running_stats_id` of 0/null/undefined means "no record"; we create one
 *  and merge the new id onto the user so downstream screens can fetch it.
 *  Failures are logged and swallowed — My Pulse tolerates a missing id. */
async function ensureRunningStats(user: User): Promise<User> {
  if (user.runningStatsId && user.runningStatsId > 0) return user;
  try {
    const created = await xanoRunningStats.create();
    const newId = created?.id;
    if (!newId) {
      logger.warn('[AuthContext] running_stats.create returned no id');
      return user;
    }
    return { ...user, runningStatsId: newId };
  } catch (e) {
    logger.warn('[AuthContext] Failed to create running_stats:', e);
    return user;
  }
}

/** Fetch the user's groups, pairs, and resolve isMHFR from their role.
 *  On failure, preserves existing data from the user object rather than overwriting with empty.
 *  Also assigns a persistent profile hex colour if the user has no avatar and
 *  no previously-assigned hex (WeWeb parity). */
async function resolveGroupsPairsAndMHFR(user: User): Promise<User> {
  const updates: Partial<User> = {};

  // Fetch groups
  try {
    const data = await xanoGroups.getAll();
    const activeGroups = Array.isArray(data.active_groups) ? data.active_groups : [];
    logger.log('[AuthContext] Groups response:', JSON.stringify({ active: activeGroups.length, isMHFR: activeGroups.some((g: any) => g.forest?.role === 'mhfr support') }));
    updates.groups = activeGroups;
    updates.isMHFR = activeGroups.some((g: any) => g.forest?.role === 'mhfr support');
  } catch (e) {
    logger.warn('[AuthContext] Failed to fetch groups, keeping existing:', e);
    // Preserve existing data
    if (user.groups) updates.groups = user.groups;
    if (user.isMHFR !== undefined) updates.isMHFR = user.isMHFR;
  }

  // Fetch pairs
  try {
    const data = await xanoPairs.getAll();
    logger.log('[AuthContext] Pairs response:', JSON.stringify({ active: data.active?.length ?? 0, invites: data.invites?.length ?? 0 }));
    const activePairs = Array.isArray(data.active) ? data.active : [];
    updates.pairs = activePairs;
  } catch (e) {
    logger.warn('[AuthContext] Failed to fetch pairs, keeping existing:', e);
    // Preserve existing data
    if (user.pairs) updates.pairs = user.pairs;
  }

  const merged = { ...user, ...updates };
  const withHex = await ensureProfileHexColour(merged);
  return ensureRunningStats(withHex);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
  });
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // On mount, try to restore session via check_status if a token is already
  // present in persistent storage.
  // Track whether we have a token but failed to load user data (e.g. offline)
  const pendingSessionRestore = useRef(false);

  useEffect(() => {
    async function tryRestore(token: string, attempt: number): Promise<boolean> {
      try {
        const raw = await xanoAuth.me();
        const user = await resolveGroupsPairsAndMHFR(mapXanoUser(raw));
        setState({ isAuthenticated: true, user });
        syncOneSignalSubscriptionId(raw);
        syncLastSeen();
        return true;
      } catch (e: unknown) {
        const status = errorStatus(e);
        if (status === 401 || status === 403) {
          await tokenStore.clear();
          return true; // stop retrying — token is invalid
        }
        // Retryable error (5xx, network) — try again with backoff
        if (attempt < 3) {
          const delay = (attempt + 1) * 1500; // 1.5s, 3s, 4.5s
          logger.warn(`[AuthContext] Session restore attempt ${attempt + 1} failed (${status || 'network'}), retrying in ${delay}ms…`);
          await new Promise((r) => setTimeout(r, delay));
          return false;
        }
        logger.warn('[AuthContext] Session restore failed after 3 attempts, will retry on foreground');
        pendingSessionRestore.current = true;
        return true; // stop retrying for now
      }
    }

    async function initAuth() {
      setLoading(true);
      try {
        const token = await tokenStore.load();
        if (token) {
          for (let attempt = 0; attempt < 3; attempt++) {
            const done = await tryRestore(token, attempt);
            if (done) break;
          }
        }
      } finally {
        setLoading(false);
      }
    }
    initAuth();
  }, []);

  // Mid-session 401/403: the HTTP client has already cleared the token; we
  // just need to transition UI state to unauthenticated and flush caches so
  // the next render drops to the auth screen instead of showing stale data.
  useEffect(() => {
    setOnAuthExpired(() => {
      logger.warn('[AuthContext] Auth expired — forcing logout');
      invalidateAll();
      setState({ isAuthenticated: false, user: null });
      pendingSessionRestore.current = false;
    });
    return () => setOnAuthExpired(null);
  }, []);

  // When the app returns to foreground, retry session restore if it failed (e.g. was offline)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextState) => {
      if (nextState === 'active') {
        const token = tokenStore.get();
        if (token) {
          syncLastSeen();
        }
        if (pendingSessionRestore.current && token) {
          try {
            const raw = await xanoAuth.me();
            const user = await resolveGroupsPairsAndMHFR(mapXanoUser(raw));
            setState({ isAuthenticated: true, user });
            syncOneSignalSubscriptionId(raw);
            pendingSessionRestore.current = false;
          } catch (e: unknown) {
            const status = errorStatus(e);
            if (status === 401 || status === 403) {
              await tokenStore.clear();
              pendingSessionRestore.current = false;
            }
            // Otherwise keep retrying on next foreground
          }
        }
      }
    });
    return () => subscription.remove();
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const raw = await xanoAuth.me();
      const user = await resolveGroupsPairsAndMHFR(mapXanoUser(raw));
      setState((prev) => ({ ...prev, user }));
    } catch (e) {
      logger.warn('[AuthContext] refreshUser failed:', e);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const { authToken } = await xanoAuth.login(email, password);
      await tokenStore.set(authToken);

      const raw = await xanoAuth.me();
      const user = await resolveGroupsPairsAndMHFR(mapXanoUser(raw));
      setState({ isAuthenticated: true, user });
      syncOneSignalSubscriptionId(raw);
      syncLastSeen();
    } catch (e) {
      const msg = e instanceof XanoError ? e.message : 'Login failed. Please try again.';
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const signup = useCallback(async (fields: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    country: string;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const { authToken } = await xanoAuth.signup(fields);
      await tokenStore.set(authToken);

      const raw = await xanoAuth.me();
      const user = await resolveGroupsPairsAndMHFR(mapXanoUser(raw));
      setState({ isAuthenticated: true, user });
      syncOneSignalSubscriptionId(raw);
      syncLastSeen();
    } catch (e) {
      const msg = e instanceof XanoError ? e.message : 'Sign up failed. Please try again.';
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const loginWithMicrosoft = useCallback(async (code: string, codeVerifier: string, domain?: string, tenantId = 'common') => {
    setLoading(true);
    setError(null);
    try {
      const msResult = await xanoAuth.microsoftCallback({
        token: code,
        code_verifier: codeVerifier,
        domain,
        tenant_id: tenantId,
      });
      const authToken = typeof msResult === 'string' ? msResult : (msResult as any).authToken;
      if (!authToken || typeof authToken !== 'string') {
        if (__DEV__) {
          throw new Error('Bad token shape. Raw response: ' + JSON.stringify(msResult).slice(0, 300));
        }
        throw new Error('Microsoft login returned an invalid session. Please try again.');
      }
      await tokenStore.set(authToken);

      const raw = await xanoAuth.me();
      const user = await resolveGroupsPairsAndMHFR(mapXanoUser(raw));
      setState({ isAuthenticated: true, user });
      syncOneSignalSubscriptionId(raw);
      syncLastSeen();
    } catch (e) {
      const msg = e instanceof XanoError ? e.message : 'Microsoft login failed. Please try again.';
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const loginWithApple = useCallback(async (params: {
    identityToken: string;
    rawNonce: string;
    authorizationCode?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    appleUserId?: string | null;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const appleResult = await xanoAuth.appleCallback({
        identity_token: params.identityToken,
        raw_nonce: params.rawNonce,
        authorization_code: params.authorizationCode ?? undefined,
        first_name: params.firstName ?? undefined,
        last_name: params.lastName ?? undefined,
        email: params.email ?? undefined,
        apple_user_id: params.appleUserId ?? undefined,
      });
      const authToken = typeof appleResult === 'string' ? appleResult : (appleResult as any).authToken;
      if (!authToken || typeof authToken !== 'string') {
        if (__DEV__) {
          throw new Error('Bad token shape. Raw response: ' + JSON.stringify(appleResult).slice(0, 300));
        }
        throw new Error('Apple login returned an invalid session. Please try again.');
      }
      await tokenStore.set(authToken);

      const raw = await xanoAuth.me();
      const user = await resolveGroupsPairsAndMHFR(mapXanoUser(raw));
      setState({ isAuthenticated: true, user });
      syncOneSignalSubscriptionId(raw);
      syncLastSeen();
    } catch (e) {
      const msg = e instanceof XanoError ? e.message : 'Apple login failed. Please try again.';
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const loginWithMobile = useCallback(async (authToken: string) => {
    setLoading(true);
    setError(null);
    try {
      await tokenStore.set(authToken);
      const raw = await xanoAuth.me();
      const user = await resolveGroupsPairsAndMHFR(mapXanoUser(raw));
      setState({ isAuthenticated: true, user });
      syncOneSignalSubscriptionId(raw);
      syncLastSeen();
    } catch (e) {
      const msg = e instanceof XanoError ? e.message : 'Mobile login failed. Please try again.';
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    if (OneSignalModule) {
      try {
        OneSignalModule.logout();
      } catch (e) {
        logger.warn('[AuthContext] OneSignal logout failed:', e);
      }
    }
    await tokenStore.clear();
    invalidateAll();
    setState({ isAuthenticated: false, user: null });
    setError(null);
  }, []);

  const deleteAccount = useCallback(async () => {
    // The API call must succeed before we tear down local state — if the
    // server failed to anonymise the records, we don't want the user to
    // believe their account is gone. On success we mirror the logout flow.
    await xanoUserApi.deleteAccount();
    if (OneSignalModule) {
      try {
        OneSignalModule.logout();
      } catch (e) {
        logger.warn('[AuthContext] OneSignal logout failed:', e);
      }
    }
    await tokenStore.clear();
    invalidateAll();
    setState({ isAuthenticated: false, user: null });
    setError(null);
  }, []);

  const _setUser = useCallback((updater: (prev: User | null) => User | null) => {
    setState((prev) => ({ ...prev, user: updater(prev.user) }));
  }, []);

  const value: AuthContextValue = useMemo(
    () => ({
      ...state,
      login,
      signup,
      loginWithMicrosoft,
      loginWithApple,
      loginWithMobile,
      logout,
      deleteAccount,
      refreshUser,
      isLoading,
      error,
      _setUser,
    }),
    [
      state,
      login,
      signup,
      loginWithMicrosoft,
      loginWithApple,
      loginWithMobile,
      logout,
      deleteAccount,
      refreshUser,
      isLoading,
      error,
      _setUser,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
