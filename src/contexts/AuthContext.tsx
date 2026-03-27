import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { auth as xanoAuth, tokenStore, XanoError, XanoGroup, XanoPair, XanoRecentCheckInEmotion, XanoLast7CheckIn, groups as xanoGroups } from '../api';
import { invalidateAll } from '../lib/fetchCache';

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
  groups?: XanoGroup[];
  pairs?: XanoPair[];
  onboardingComplete?: boolean;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  lastCheckInDate?: string | null;
  isMHFR?: boolean;
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
  loginWithMicrosoft: (token: string, tenantId: string) => Promise<void>;
  loginWithMobile: (authToken: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
  refreshUser: () => Promise<void>;
  /** @internal Used by CheckInContext to update user state. Do not use directly. */
  _setUser: (updater: (prev: User | null) => User | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function mapXanoUser(xano: any): User {
  return {
    id: String(xano.id),
    email: xano.email,
    name: xano.fullName || xano.firstName || 'User',
    firstName: xano.firstName || undefined,
    lastName: xano.lastName || undefined,
    avatarUrl: xano.profilePic_url || xano.avatar?.url,
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
    emailVerified: xano.emailVerified ?? false,
    phoneVerified: xano.phoneVerified ?? false,
    lastCheckInDate: xano.lastCheckInDate
      ? toLocalDateString(typeof xano.lastCheckInDate === 'number'
          ? new Date(xano.lastCheckInDate).toISOString()
          : xano.lastCheckInDate)
      : null,
  };
}

/** Fetch the user's groups and resolve isMHFR from their role. */
async function resolveGroupsAndMHFR(user: User): Promise<User> {
  try {
    const data = await xanoGroups.getAll();
    const activeGroups = Array.isArray(data.active_groups) ? data.active_groups : [];
    const isMHFR = activeGroups.some((g: any) => g.forest?.role === 'mhfr support');
    return { ...user, isMHFR };
  } catch (e) {
    console.warn('[AuthContext] Failed to fetch groups for MHFR check:', e);
    return user;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
  });
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // On mount, try to restore session via check_status if a token is already
  // present in persistent storage.
  useEffect(() => {
    async function initAuth() {
      setLoading(true);
      try {
        const token = await tokenStore.load();
        if (token) {
          const raw = await xanoAuth.me();
          const user = await resolveGroupsAndMHFR(mapXanoUser(raw));
          setState({ isAuthenticated: true, user });
        }
      } catch (e) {
        console.warn('[AuthContext] Session restoration failed:', e);
        await tokenStore.clear();
      } finally {
        setLoading(false);
      }
    }
    initAuth();
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const raw = await xanoAuth.me();
      const user = await resolveGroupsAndMHFR(mapXanoUser(raw));
      setState((prev) => ({ ...prev, user }));
    } catch (e) {
      console.warn('[AuthContext] refreshUser failed:', e);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const { authToken } = await xanoAuth.login(email, password);
      await tokenStore.set(authToken);

      const raw = await xanoAuth.me();
      const user = await resolveGroupsAndMHFR(mapXanoUser(raw));
      setState({ isAuthenticated: true, user });
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
      const user = await resolveGroupsAndMHFR(mapXanoUser(raw));
      setState({ isAuthenticated: true, user });
    } catch (e) {
      const msg = e instanceof XanoError ? e.message : 'Sign up failed. Please try again.';
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const loginWithMicrosoft = useCallback(async (token: string, tenantId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { result1, user: rawUser } = await xanoAuth.microsoftSSO({ token, tenant_id: tenantId });
      await tokenStore.set(result1);
      const user = await resolveGroupsAndMHFR(mapXanoUser(rawUser));
      setState({ isAuthenticated: true, user });
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
      const user = await resolveGroupsAndMHFR(mapXanoUser(raw));
      setState({ isAuthenticated: true, user });
    } catch (e) {
      const msg = e instanceof XanoError ? e.message : 'Mobile login failed. Please try again.';
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await tokenStore.clear();
    invalidateAll();
    setState({ isAuthenticated: false, user: null });
    setError(null);
  }, []);

  const _setUser = useCallback((updater: (prev: User | null) => User | null) => {
    setState((prev) => ({ ...prev, user: updater(prev.user) }));
  }, []);

  const value: AuthContextValue = {
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
