import React, { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Platform, AppState } from 'react-native';
import { auth as xanoAuth, tokenStore, XanoError, XanoGroup, XanoUserGroup, XanoPair, XanoRecentCheckInEmotion, XanoLast7CheckIn, groups as xanoGroups, pairs as xanoPairs, onesignal as onesignalApi } from '../api';
import { invalidateAll } from '../lib/fetchCache';
import { logger } from '../lib/logger';

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
  loginWithMobile: (authToken: string) => Promise<void>;
  logout: () => void;
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
async function syncOneSignalSubscriptionId(xanoUser: any): Promise<void> {
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

function mapXanoUser(xano: any): User {
  return {
    id: String(xano.id),
    email: xano.email,
    name: xano.fullName || xano.firstName || 'User',
    firstName: xano.firstName || undefined,
    lastName: xano.lastName || undefined,
    avatarUrl: (typeof xano.profilePic_url === 'object' ? xano.profilePic_url?.url : xano.profilePic_url) || xano.avatar?.url,
    phoneNumber: xano.phoneNumber || undefined,
    country: xano.country || undefined,
    runningStatsId: xano.running_stats_id,
    emotionState: (xano._emotion_states || xano.recent_checkin_emotion) ? {
      themeColour: xano._emotion_states?.themeColour ?? xano.recent_checkin_emotion?.themeColour,
      emotionColour: xano._emotion_states?.emotionColour ?? xano.recent_checkin_emotion?.emotionColour,
    } : undefined,
    recentCheckInEmotion: xano.recent_checkin_emotion ?? null,
    last7CheckIns: xano.last_7_checkins ?? null,
    groups: xano._user_group?.map((ug: any) => ug.groups) || [],
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

/** Fetch the user's groups, pairs, and resolve isMHFR from their role. */
async function resolveGroupsPairsAndMHFR(user: User): Promise<User> {
  const updates: Partial<User> = {};

  // Fetch groups
  try {
    const data = await xanoGroups.getAll();
    const activeGroups = Array.isArray(data.active_groups) ? data.active_groups : [];
    updates.groups = activeGroups;
    updates.isMHFR = activeGroups.some((g: any) => g.forest?.role === 'mhfr support');
  } catch (e) {
    logger.warn('[AuthContext] Failed to fetch groups:', e);
  }

  // Fetch pairs
  try {
    const data = await xanoPairs.getAll();
    const activePairs = Array.isArray(data.active) ? data.active : [];
    updates.pairs = activePairs;
  } catch (e) {
    logger.warn('[AuthContext] Failed to fetch pairs:', e);
  }

  return { ...user, ...updates };
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
        return true;
      } catch (e: any) {
        const status = e?.status ?? e?.statusCode;
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

  // When the app returns to foreground, retry session restore if it failed (e.g. was offline)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextState) => {
      if (nextState === 'active' && pendingSessionRestore.current) {
        try {
          const token = tokenStore.get();
          if (token) {
            const raw = await xanoAuth.me();
            const user = await resolveGroupsPairsAndMHFR(mapXanoUser(raw));
            setState({ isAuthenticated: true, user });
            syncOneSignalSubscriptionId(raw);
            pendingSessionRestore.current = false;
          }
        } catch (e: any) {
          const status = e?.status ?? e?.statusCode;
          if (status === 401 || status === 403) {
            await tokenStore.clear();
            pendingSessionRestore.current = false;
          }
          // Otherwise keep retrying on next foreground
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
    } catch (e) {
      const msg = e instanceof XanoError ? e.message : 'Microsoft login failed. Please try again.';
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

  const _setUser = useCallback((updater: (prev: User | null) => User | null) => {
    setState((prev) => ({ ...prev, user: updater(prev.user) }));
  }, []);

  const value: AuthContextValue = useMemo(
    () => ({
      ...state,
      login,
      signup,
      loginWithMicrosoft,
      loginWithMobile,
      logout,
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
      loginWithMobile,
      logout,
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
