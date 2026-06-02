import React, { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Platform, AppState } from 'react-native';
import { auth as xanoAuth, tokenStore, XanoError, XanoAuthMeResponse, XanoGroup, XanoUserGroup, XanoPair, XanoRecentCheckInEmotion, XanoLast7CheckIn, groups as xanoGroups, pairs as xanoPairs, onesignal as onesignalApi, setOnAuthExpired, user as xanoUserApi, runningStats as xanoRunningStats } from '../api';
import { invalidateAll } from '../lib/fetchCache';
import {
  hydratePendingPasswordSetup,
  peekPendingPasswordSetup,
  setPendingPasswordSetup as persistPendingPasswordSetup,
} from '../navigation/pendingPasswordSetup';
import { resetAndReload } from '../lib/resetRuntime';
import { identifyIntercomUser, logoutIntercomUser } from '../lib/intercom';
import { identifyAnalyticsUser, resetAnalytics, type AnalyticsIdentity } from '../lib/analytics';
import { trackLoginCompleted, trackSignUpCompleted } from '../lib/analyticsEvents';
import { logger } from '../lib/logger';
import { errorStatus } from '../lib/errorUtils';
import { pickRandomProfileHex } from '../lib/profileColours';
import { userDateOf } from '../lib/userDate';

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
  /** Forest-map rows where the user is still PENDING — sourced from
   *  `/groups/get_all` (`data.invites` plus PENDING entries that the backend
   *  currently leaks into `active_groups`). Shape is heterogeneous, see
   *  `PendingGroupInviteSheet` for the defensive accessors. */
  pendingGroupInvites?: any[];
  pairs?: XanoPair[];
  /** Incoming PENDING pair invites where this user is the recipient.
   *  Sourced from `/pairs` (`data.invites`). Used by PendingInviteOrchestrator
   *  to present a PairInvite modal on app open or post-onboarding. */
  pendingPairInvites?: XanoPair[];
  onboardingComplete?: boolean;
  introSlidesSeen?: boolean;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  /** Xano `created_at` (epoch ms). Used as the analytics `signup_date`. */
  createdAt?: number;
  /** Xano `access` tier. Used as the analytics `plan_type`. */
  accessTier?: 'Free' | 'Activator' | 'Workplace';
  recentStateCoordinates?: number | { id: number } | null;
  lastCheckInDate?: string | null;
  /** IANA timezone (e.g. "Australia/Sydney") synced from the user's Xano row.
   *  Used by `userDate` helpers so date bucketing is consistent across the
   *  app even when the device's timezone differs from the user's. */
  timezone?: string | null;
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
  loginWithMobile: (authToken: string, opts?: { pendingPasswordSetup?: boolean }) => Promise<void>;
  logout: () => void;
  deleteAccount: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  /** True when a freshly-migrated user is authenticated but still has to set a
   *  new password. Gates the app on the Migration → Set-password screens. */
  pendingPasswordSetup: boolean;
  clearPendingPasswordSetup: () => void;
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
    createdAt: xano.created_at,
    accessTier: xano.access,
    recentStateCoordinates: xano.recentStateCoordinates ?? null,
    lastCheckInDate: xano.lastCheckInDate
      ? userDateOf(xano.lastCheckInDate, xano.timezone)
      : null,
    reminderFrequency: xano.reminder_frequency ?? undefined,
    reminderHour: xano.reminder_hour ?? undefined,
    reminderMin: xano.reminder_min ?? undefined,
    preferredCheckinView: xano.preferred_checkin_view || '',
    timezone: xano.timezone || null,
  };
}

/** Map the app's `User` to the minimal shape Amplitude identification needs.
 *  Lives here (not in analytics.ts) so that module stays a leaf with no
 *  dependency on the auth/contexts layer. */
function toAnalyticsIdentity(u: User): AnalyticsIdentity {
  return {
    xanoUserId: Number(u.id),
    email: u.email,
    signupDate: u.createdAt ?? null,
    planType: u.accessTier ?? 'unknown',
    pairCount: u.pairs?.length ?? 0,
    groupIds: (u.groups ?? []).map((g) => g.id),
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
    await xanoUserApi.updateProfile({ timezone: getTimezone() });
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
  try {
    await xanoUserApi.updateProfile({ profile_hex_colour: picked });
  } catch (e) {
    logger.warn('[AuthContext] Failed to persist profile_hex_colour:', e);
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
    const rawActive = Array.isArray(data.active_groups) ? data.active_groups : [];
    const rawInvites = Array.isArray((data as any).invites) ? (data as any).invites : [];
    // Backend can return PENDING forest_map entries in active_groups; filter
    // them out so downstream (MyPulse, OnboardingProgress, support screens
    // pulling custom_support_services) only sees groups the user has actually
    // joined. The PENDING ones get folded into pendingGroupInvites alongside
    // the explicit `invites` array so the app can surface them in the
    // PendingGroupInviteSheet on launch.
    const isAccepted = (g: any) => {
      const status = g?.forest?.reqStatus ?? g?.reqStatus;
      return !status || status === 'ACCEPTED';
    };
    const activeGroups = rawActive.filter(isAccepted);
    const inviteId = (i: any): number | undefined => i?.forest?.id ?? i?.id;
    const seenInviteIds = new Set<number>();
    const pendingGroupInvites: any[] = [];
    for (const i of [...rawInvites, ...rawActive.filter((g: any) => !isAccepted(g))]) {
      const id = inviteId(i);
      if (id == null || !seenInviteIds.has(id)) {
        if (id != null) seenInviteIds.add(id);
        pendingGroupInvites.push(i);
      }
    }
    logger.log('[AuthContext] Groups response:', JSON.stringify({ active: activeGroups.length, invites: pendingGroupInvites.length, isMHFR: activeGroups.some((g: any) => g.forest?.role === 'mhfr support') }));
    updates.groups = activeGroups;
    updates.pendingGroupInvites = pendingGroupInvites;
    updates.isMHFR = activeGroups.some((g: any) => g.forest?.role === 'mhfr support');
  } catch (e) {
    logger.warn('[AuthContext] Failed to fetch groups, keeping existing:', e);
    // Preserve existing data
    if (user.groups) updates.groups = user.groups;
    if (user.pendingGroupInvites) updates.pendingGroupInvites = user.pendingGroupInvites;
    if (user.isMHFR !== undefined) updates.isMHFR = user.isMHFR;
  }

  // Fetch pairs
  try {
    const data = await xanoPairs.getAll();
    const activePairs = Array.isArray(data.active) ? data.active : [];
    const rawInvitePairs = Array.isArray(data.invites) ? data.invites : [];

    // Pick out the **incoming** pair invites the current user can act on.
    // Mirrors what the WeWeb client does, which is the source of truth for
    // this filter:
    //
    //   Show an invite if `pairUserIDs` does NOT contain the current
    //   user's id, AND there's at least one such invite to surface.
    //
    // Why this single rule is enough:
    //   - User self-invited (sender = recipient = me)
    //     → pairUserIDs includes me → excluded ✓
    //   - Someone else sent me an invite (I haven't accepted yet)
    //     → pairUserIDs is [their_id] only → doesn't include me → shown ✓
    //   - Email-based invite to a brand-new user (no user_id yet)
    //     → pairUserIDs is [sender_id] only → doesn't include me → shown ✓
    //   - I'm already accepted into the pair
    //     → pairUserIDs is [me, them] → excludes ✓
    //
    // The previous implementation also matched on `invite_email === user.email`,
    // which incorrectly surfaced self-invites where the user invited their
    // own email address (the email match short-circuited the
    // requestFromId exclude).
    //
    // Loose numeric comparison — Xano sometimes returns id fields as
    // strings, and `user.id` is stored as a string in the User type.
    const userIdNum = Number(user.id);

    const pendingPairInvites = rawInvitePairs.filter((p) => {
      if (!p || typeof p !== 'object') return false;
      const pairUserIDs = Array.isArray(p.pairUserIDs) ? p.pairUserIDs : [];
      const includesMe = pairUserIDs.some((id: unknown) => Number(id) === userIdNum);
      return !includesMe;
    });

    logger.log('[AuthContext] Pairs response:', JSON.stringify({
      active: activePairs.length,
      rawInvites: rawInvitePairs.length,
      pendingPairInvites: pendingPairInvites.length,
      userIdNum,
      // Surface the shape of the first invite so we can spot field mismatches
      // in production logs without leaking PII.
      firstInviteKeys: rawInvitePairs[0] ? Object.keys(rawInvitePairs[0]) : null,
      firstInviteEmail: rawInvitePairs[0]?.invite_email ?? null,
      firstInvitePairUserIDs: rawInvitePairs[0]?.pairUserIDs ?? null,
    }));

    updates.pairs = activePairs;
    updates.pendingPairInvites = pendingPairInvites;
  } catch (e) {
    logger.warn('[AuthContext] Failed to fetch pairs, keeping existing:', e);
    // Preserve existing data
    if (user.pairs) updates.pairs = user.pairs;
    if (user.pendingPairInvites) updates.pendingPairInvites = user.pendingPairInvites;
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
  const [pendingPasswordSetup, setPendingPasswordSetupState] = useState(false);

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
        // Hydrate the durable migration flag and the token in parallel, then
        // commit the flag BEFORE the session restore flips isAuthenticated.
        // Doing it inside the loading gate means the first authed render of
        // AppNavigator is already correct — a migrated user who killed the
        // app on the Set-password screen never flashes Main/Onboarding.
        const [token] = await Promise.all([
          tokenStore.load(),
          hydratePendingPasswordSetup(),
        ]);
        setPendingPasswordSetupState(peekPendingPasswordSetup());
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
        } else if (token) {
          // Live session resumed from background — refresh the user so
          // day-rollover state (lastCheckInDate / last7CheckIns) is current.
          // Without this, a warm Android resume keeps yesterday's in-memory
          // user, `hasCheckedInToday` never recomputes, and the navigator
          // leaves the user on Home instead of routing back to Check-in. The
          // fresh user object lets CheckInContext re-evaluate the window and
          // AppNavigator re-push Check-in. (EP-1052)
          refreshUser();
        }
      }
    });
    return () => subscription.remove();
  }, []);

  // Mirror the signed-in user into Intercom so support agents see who they're
  // talking to. Centralised here as one effect rather than at each auth call
  // site (login / signup / Microsoft / Apple / mobile / session restore) so
  // every path is covered by construction. Keyed on the user id — the user
  // object is re-created frequently as groups/pairs/MHFR resolve, but the
  // Intercom identity only changes when the id does, and its native loginUser
  // call is expensive, so we don't re-login on every refresh.
  //
  // The logout branch here covers the teardown paths that flip state to
  // unauthenticated WITHOUT a runtime reload: the auth-expired (401/403)
  // handler and the manualLocalLogout fallback. The normal logout/delete/merge
  // path goes through resetAndReload, which logs Intercom out (and resets
  // Amplitude) at the native layer before reloading (see tryIntercomLogout /
  // tryAnalyticsReset in resetRuntime.ts).
  const lastIntercomUserId = useRef<string | null>(null);
  useEffect(() => {
    const u = state.isAuthenticated ? state.user : null;
    if (u && u.id !== lastIntercomUserId.current) {
      lastIntercomUserId.current = u.id;
      void identifyIntercomUser({ id: u.id, email: u.email });
    } else if (!u && lastIntercomUserId.current !== null) {
      lastIntercomUserId.current = null;
      void logoutIntercomUser();
    }
  }, [state.isAuthenticated, state.user]);

  // Amplitude identity — kept SEPARATE from the Intercom effect above on
  // purpose: Amplitude's identify() is a cheap, idempotent local op (no native
  // round-trip), so unlike Intercom we refresh it whenever the user object
  // changes — e.g. pairs/groups resolving after login — not only on id change,
  // so pair_count / group_ids never go stale. reset() on logout so the next
  // user on this device doesn't inherit this identity (covers the no-reload
  // teardown paths; the reload path resets via resetRuntime.ts).
  useEffect(() => {
    if (state.isAuthenticated && state.user) {
      identifyAnalyticsUser(toAnalyticsIdentity(state.user));
    } else {
      resetAnalytics();
    }
  }, [state.isAuthenticated, state.user]);

  // Brief: re-identify on every app foreground so pair_count / group_ids stay
  // reasonably current — a server-side change (e.g. accepting a pair invite
  // from a deep link) won't update the in-memory user until a refetch, but
  // re-sending identify keeps the stable props fresh and is effectively free.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active' && state.isAuthenticated && state.user) {
        identifyAnalyticsUser(toAnalyticsIdentity(state.user));
      }
    });
    return () => sub.remove();
  }, [state.isAuthenticated, state.user]);

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
      // Identify BEFORE the event — the identify effect is async (post-render)
      // so an event fired here would otherwise be anonymous (brief trap).
      identifyAnalyticsUser(toAnalyticsIdentity(user));
      trackLoginCompleted({ login_method: 'email' });
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
      // Identify before the event (brief). Mobile signup is email-only;
      // signup_method value parity flagged to Maurice (EP-1023).
      identifyAnalyticsUser(toAnalyticsIdentity(user));
      trackSignUpCompleted({ signup_method: 'email' });
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
      // Identify before the event (brief). This is the PKCE OAuth code flow →
      // microsoft_auth. If a distinct Microsoft SSO entry exists it must map to
      // microsoft_sso — auth-vs-sso split flagged to Maurice (EP-1023).
      identifyAnalyticsUser(toAnalyticsIdentity(user));
      trackLoginCompleted({ login_method: 'microsoft_auth' });
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
      // Identify before the event (brief). Apple returns name/email ONLY on
      // the user's first authorization for this app — the standard signal for
      // signup vs returning login (the Xano callback returns no is-new flag).
      // Edge case: a revoke + re-authorize resends them; acceptable for
      // analytics. Flagged to Maurice (EP-1023).
      identifyAnalyticsUser(toAnalyticsIdentity(user));
      const isFirstAppleAuth = !!(params.email || params.firstName || params.lastName);
      if (isFirstAppleAuth) {
        trackSignUpCompleted({ signup_method: 'apple' });
      } else {
        trackLoginCompleted({ login_method: 'apple' });
      }
    } catch (e) {
      const msg = e instanceof XanoError ? e.message : 'Apple login failed. Please try again.';
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const loginWithMobile = useCallback(
    async (authToken: string, opts?: { pendingPasswordSetup?: boolean }) => {
      setLoading(true);
      setError(null);
      try {
        // Set the durable migration flag before flipping auth state so the
        // navigator gates on the very first authed render (no flash of Main).
        if (opts?.pendingPasswordSetup) {
          await persistPendingPasswordSetup(true);
          setPendingPasswordSetupState(true);
        }
        await tokenStore.set(authToken);
        const raw = await xanoAuth.me();
        const user = await resolveGroupsPairsAndMHFR(mapXanoUser(raw));
        setState({ isAuthenticated: true, user });
        syncOneSignalSubscriptionId(raw);
        syncLastSeen();
        // Identify before the event (brief).
        identifyAnalyticsUser(toAnalyticsIdentity(user));
        trackLoginCompleted({ login_method: 'mobile' });
      } catch (e) {
        const msg = e instanceof XanoError ? e.message : 'Mobile login failed. Please try again.';
        setError(msg);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const clearPendingPasswordSetup = useCallback(() => {
    setPendingPasswordSetupState(false);
    persistPendingPasswordSetup(false);
  }, []);

  // Manual tear-down used as a fallback when the runtime reload isn't
  // available (Expo Go on older SDKs etc). The bulletproof path is
  // `resetAndReload`, which restarts the JS runtime and makes every form of
  // cross-account leakage impossible by construction; this is only a backup.
  const manualLocalLogout = useCallback(async () => {
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

  const logout = useCallback(async () => {
    try {
      await resetAndReload({
        message: 'Signing you out…',
        clearAuthToken: true,
        onesignalLogout: true,
      });
    } catch {
      // Reload unavailable (Expo Go / dev fallback already attempted). Tear
      // down what we can locally so the user at least lands back on Auth.
      await manualLocalLogout();
    }
  }, [manualLocalLogout]);

  const deleteAccount = useCallback(async () => {
    // The API call must succeed before we tear down local state — if the
    // server failed to anonymise the records, we don't want the user to
    // believe their account is gone. On success we mirror the logout flow.
    await xanoUserApi.deleteAccount();
    try {
      await resetAndReload({
        message: 'Closing your account…',
        clearAuthToken: true,
        onesignalLogout: true,
      });
    } catch {
      await manualLocalLogout();
    }
  }, [manualLocalLogout]);

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
      pendingPasswordSetup,
      clearPendingPasswordSetup,
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
      pendingPasswordSetup,
      clearPendingPasswordSetup,
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
