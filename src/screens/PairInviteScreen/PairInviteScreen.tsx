import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp, CommonActions } from '@react-navigation/native';
import { ArrowLeftRight, Eye, UserCheck, AlertCircle, Home } from 'lucide-react-native';
import { RootStackParamList } from '../../types/navigation';
import { colors, fonts, fontSizes, borderRadius, buttonStyles } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { pair as xanoPair, pairs as xanoPairs } from '../../api/pairs';
import { XanoError } from '../../api/client';
import { invalidate, CACHE_KEYS } from '../../lib/fetchCache';
import { trackPairCreated, trackPairInviteRejected } from '../../lib/analyticsEvents';
import { setPendingLink } from '../../navigation/pendingLink';
import { logger } from '../../lib/logger';
import Avatar from '../../components/Avatar';
import LoadingAnimation from '../../components/LoadingAnimation';

type PairInviteRouteProp = RouteProp<RootStackParamList, 'PairInvite'>;

// The screen handles two response shapes:
//   1. Deep-link path — `/pair/get_by_token` returns a flat object with
//      `pair_id`, `pair_type`, `fullName`, `initials`, `profile_pic`,
//      `profile_hex_colour`, `status`, `message`, `joined`. Apple-signup
//      users may have empty string for fullName / profile_pic.
//   2. In-app popup path — receives a raw `XanoPair` via route params,
//      with `id`, `pairType`, `requestFromId`, `requestToId`,
//      `invite_email`, `pairUserIDs`. No joined inviter info.
//
// We normalise both into the shape the render layer reads. Any extra
// keys are passed through via the index signature so we don't lose
// data we don't yet care about.
interface PairInviteRecord {
  id?: number;
  pair_id?: number;
  pairType?: string;
  pair_type?: string;
  reqStatus?: string;
  status?: string;
  requestFromId?: number;
  requestToId?: number;
  invite_email?: string;
  // Flat fields from `/pair/get_by_token`
  fullName?: string;
  initials?: string;
  profile_pic?: string | null;
  profile_hex_colour?: string | null;
  message?: string;
  // Joined fields some endpoints expose under a wrapper (kept for back-compat)
  _request_from?: {
    id?: number;
    firstName?: string;
    lastName?: string;
    fullName?: string;
    email?: string;
    profilePic_url?: string | { url?: string } | null;
    profile_hex_colour?: string | null;
  };
  [key: string]: unknown;
}

/** Return the pair record's id from either shape. */
function getPairId(r: PairInviteRecord | null | undefined): number | undefined {
  if (!r) return undefined;
  return r.id ?? r.pair_id;
}

/** Return the pair type from either shape. */
function getPairTypeKey(r: PairInviteRecord | null | undefined): string {
  return r?.pairType ?? r?.pair_type ?? 'DUAL';
}

/** Extract the inviter's display name with sensible fallbacks. */
function getInviterName(r: PairInviteRecord | null | undefined): string {
  if (!r) return 'Someone';
  const flat = (r.fullName ?? '').trim();
  if (flat) return flat;
  const joined = (r._request_from?.fullName ?? '').trim();
  if (joined) return joined;
  const fromParts = [r._request_from?.firstName, r._request_from?.lastName]
    .filter(Boolean)
    .join(' ')
    .trim();
  if (fromParts) return fromParts;
  if (r.invite_email) return r.invite_email;
  return 'Someone';
}

function getInviterProfilePic(r: PairInviteRecord | null | undefined): string | null {
  if (!r) return null;
  const flat = (r.profile_pic ?? '').toString().trim();
  if (flat) return flat;
  const join = r._request_from?.profilePic_url;
  if (typeof join === 'string' && join.trim()) return join;
  if (join && typeof join === 'object' && join.url) return join.url;
  return null;
}

function getInviterHexColour(r: PairInviteRecord | null | undefined): string | undefined {
  if (!r) return undefined;
  const flat = (r.profile_hex_colour ?? '').toString().trim();
  if (flat) return flat;
  const join = r._request_from?.profile_hex_colour ?? undefined;
  return join ?? undefined;
}

const PAIR_TYPE_LABELS: Record<string, { title: string; description: string }> = {
  DUAL: {
    title: 'Trusted Pair',
    description:
      'You will be able to see each other’s emotional pulse, share the highs and know when to reach out for support.\n\nTrusted Pairs form a small circle of people who look out for each other.',
  },
  PULL: {
    title: 'Support Pair',
    description:
      'Support Pairs make it easier for someone you trust to notice when things change and check in with you.\n\nBy accepting, they’ll be able to see your emotional pulse so they can better support you.\n\nYou will not see their pulse.',
  },
  PUSH: {
    title: 'Support Pair',
    description:
      'Support Pairs make it easier for someone you trust to notice when things change and check in with you.\n\nBy accepting, you’ll be able to see their emotional pulse so you can better support them.',
  },
};

type ScreenStep = 'loading' | 'invite' | 'accepted' | 'invalid' | 'error';

export default function PairInviteScreen() {
  const navigation = useNavigation();
  const route = useRoute<PairInviteRouteProp>();
  const { user, isAuthenticated, refreshUser } = useAuth();
  const { showToast } = useToast();

  // Two entry points:
  //   - Universal link / deep link → `pair_token` is set
  //   - In-app pending-invite popup (PendingInviteOrchestrator) → `pairId` is set
  // At least one must be present; if neither, we show the invalid state.
  const pairToken = route.params?.pair_token;
  const inviteParam = (route.params as { invite?: PairInviteRecord } | undefined)?.invite;

  const [step, setStep] = useState<ScreenStep>('loading');
  const [inviteRecord, setInviteRecord] = useState<PairInviteRecord | null>(null);
  const [responding, setResponding] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const goHome = useCallback(() => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      }),
    );
  }, [navigation]);

  const goOnboarding = useCallback(() => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Onboarding' }],
      }),
    );
  }, [navigation]);

  // Load invite on mount (and when token changes)
  useEffect(() => {
    let cancelled = false;

    async function loadInvite() {
      // Path A: in-app popup — full invite record was handed in via route
      // params. No fetch needed (and indeed `/pairs/{id}` would reject with
      // ERROR_FATAL "User is not Pairs with this person" since we're a
      // pending invitee, not an accepted pair member yet).
      if (inviteParam?.id) {
        setInviteRecord(inviteParam);
        setStep('invite');
        return;
      }

      // Path B: deep link — load by token.
      if (!pairToken) {
        setStep('invalid');
        setErrorMessage('No invite reference provided.');
        return;
      }

      // Guard: deep-link path requires auth; save link and bail.
      // (Pending-link mechanism normally handles this before the screen
      // mounts, but this is a safety net.)
      if (!isAuthenticated || !user?.id) {
        const url = `https://app.emotionalpulse.ai/pair-invite?pair_token=${pairToken}`;
        await setPendingLink(url);
        logger.warn('[PairInvite] Reached screen unauthenticated — saving pending link');
        return;
      }

      setStep('loading');
      setErrorMessage(null);

      try {
        const currentUserId = user?.id ? Number(user.id) : undefined;
        logger.info('[PairInvite] GET /pair/get_by_token', { token: pairToken, currentUserId });
        const result = (await xanoPair.getByToken(pairToken, currentUserId)) as unknown as PairInviteRecord;

        if (cancelled) return;

        if (!result || !getPairId(result)) {
          setStep('invalid');
          setErrorMessage('This invite is no longer valid or has expired.');
          return;
        }

        // Check for non-success status (backend may signal via a status field)
        const status = (result as Record<string, unknown>).status;
        if (status && status !== 'success' && status !== 'PENDING') {
          setStep('invalid');
          setErrorMessage('This invite is no longer valid or has expired.');
          return;
        }

        setInviteRecord(result);
        setStep('invite');
      } catch (e) {
        if (cancelled) return;
        logger.error('[PairInvite] load failed', e);

        if (e instanceof XanoError) {
          // 4xx = invalid/expired/self-invite
          if (e.status >= 400 && e.status < 500) {
            setStep('invalid');
            setErrorMessage(
              e.message || 'This invite is no longer valid or has expired.',
            );
            return;
          }
        }

        // Network/server error — retryable
        setStep('error');
        setErrorMessage('Could not load the invite. Please check your connection and try again.');
      }
    }

    loadInvite();
    return () => { cancelled = true; };
  }, [pairToken, inviteParam, isAuthenticated, user?.id]);

  const handleAccept = async () => {
    const pairId = getPairId(inviteRecord);
    if (!pairId || !user?.id) return;

    setResponding(true);
    try {
      logger.info('[PairInvite] PATCH respond → ACCEPTED', { pairId });
      await xanoPairs.respond(pairId, 'ACCEPTED');

      trackPairCreated({ pair_id: pairId });
      invalidate(CACHE_KEYS.PAIRS);

      setStep('accepted');

      // Brief pause to show the accepted state, then navigate
      setTimeout(async () => {
        try {
          await refreshUser();
        } catch {
          // Non-fatal — we'll navigate regardless
        }

        if (!user?.onboardingComplete) {
          goOnboarding();
        } else {
          goHome();
        }
      }, 1000);
    } catch (e) {
      logger.error('[PairInvite] accept failed', e);
      const msg =
        e instanceof XanoError && e.message
          ? `Could not accept invite: ${e.message}`
          : 'Could not accept the invite. Please try again.';
      showToast(msg, { variant: 'error' });
      setResponding(false);
    }
  };

  const handleDecline = async () => {
    const pairId = getPairId(inviteRecord);
    if (!pairId || !user?.id) return;

    setResponding(true);
    try {
      logger.info('[PairInvite] PATCH respond → REJECTED', { pairId });
      await xanoPairs.respond(pairId, 'REJECTED');

      trackPairInviteRejected({ pair_id: pairId });
      invalidate(CACHE_KEYS.PAIRS);

      showToast('Invite declined', { variant: 'default' });
      goHome();
    } catch (e) {
      logger.error('[PairInvite] decline failed', e);
      const msg =
        e instanceof XanoError && e.message
          ? `Could not decline invite: ${e.message}`
          : 'Could not decline the invite. Please try again.';
      showToast(msg, { variant: 'error' });
      setResponding(false);
    }
  };

  const handleRetry = () => {
    // Reset and re-trigger the load effect
    setStep('loading');
    setErrorMessage(null);
    setInviteRecord(null);
    // Retry only applies to the deep-link path — the in-app popup path uses
    // the invite handed in via route params, no fetch involved.
    (async () => {
      if (getPairId(inviteParam)) {
        setInviteRecord(inviteParam!);
        setStep('invite');
        return;
      }
      if (!pairToken || !isAuthenticated || !user?.id) return;
      try {
        const result = (await xanoPair.getByToken(
          pairToken,
          Number(user.id),
        )) as unknown as PairInviteRecord;
        if (!result || !getPairId(result)) {
          setStep('invalid');
          setErrorMessage('This invite is no longer valid or has expired.');
          return;
        }
        setInviteRecord(result);
        setStep('invite');
      } catch (e) {
        logger.error('[PairInvite] retry failed', e);
        if (e instanceof XanoError && e.status >= 400 && e.status < 500) {
          setStep('invalid');
          setErrorMessage(e.message || 'This invite is no longer valid or has expired.');
        } else {
          setStep('error');
          setErrorMessage('Could not load the invite. Please check your connection and try again.');
        }
      }
    })();
  };

  // ── Inviter display info ──────────────────────────────────────────────
  // Use the normaliser helpers so both response shapes (flat
  // get_by_token vs nested XanoPair) render correctly. Empty strings
  // from Apple-signup users (no name/picture yet) fall back to
  // invite_email → "Someone".
  const inviterName = getInviterName(inviteRecord);
  const inviterProfilePic = getInviterProfilePic(inviteRecord);
  const inviterHexColour = getInviterHexColour(inviteRecord);

  const pairTypeKey = getPairTypeKey(inviteRecord);
  const pairTypeInfo = PAIR_TYPE_LABELS[pairTypeKey] ?? PAIR_TYPE_LABELS.DUAL;
  const PairTypeIcon = pairTypeKey === 'DUAL' ? ArrowLeftRight : Eye;

  // ── Render ────────────────────────────────────────────────────────────

  if (step === 'loading') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <LoadingAnimation size={120} />
          <Text style={styles.loadingText}>Loading invite...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (step === 'accepted') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <View style={styles.successIcon}>
            <UserCheck color={colors.primary} size={48} />
          </View>
          <Text style={styles.successTitle}>Pair accepted!</Text>
          <Text style={styles.successBody}>
            You and {inviterName} are now paired. Taking you home...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (step === 'invalid') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <View style={styles.errorIcon}>
            <AlertCircle color={colors.destructive} size={48} />
          </View>
          <Text style={styles.errorTitle}>Invite not available</Text>
          <Text style={styles.errorBody}>
            {errorMessage || 'This invite is no longer valid or has expired.'}
          </Text>
          <TouchableOpacity
            style={[buttonStyles.primary.container, styles.fullWidthButton]}
            onPress={goHome}
          >
            <Home color={colors.textOnPrimary} size={20} style={{ marginRight: 8 }} />
            <Text style={buttonStyles.primary.text}>Return to Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (step === 'error') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <View style={styles.errorIcon}>
            <AlertCircle color={colors.alert} size={48} />
          </View>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorBody}>
            {errorMessage || 'Could not load the invite.'}
          </Text>
          <TouchableOpacity
            style={[buttonStyles.primary.container, styles.fullWidthButton]}
            onPress={handleRetry}
          >
            <Text style={buttonStyles.primary.text}>Try again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={goHome}>
            <Text style={styles.secondaryButtonText}>Return to Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // step === 'invite'
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.body}>
        <Text style={styles.title}>Pair Invite</Text>

        <View style={styles.inviterRow}>
          <Avatar
            source={inviterProfilePic}
            name={inviterName}
            size="xl"
            hexColour={inviterHexColour}
            shadow="sm"
          />
          <Text style={styles.subtitle}>
            {inviterName} has invited you to be their pair.
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardIconWrap}>
            <PairTypeIcon color={colors.primary} size={32} />
          </View>
          <Text style={styles.cardTitle}>{pairTypeInfo.title}</Text>
          <Text style={styles.cardDescription}>{pairTypeInfo.description}</Text>
        </View>

        {inviteRecord?.invite_email && (
          <Text style={styles.inviteNote}>
            This invite was sent to {inviteRecord.invite_email}
          </Text>
        )}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[buttonStyles.primary.container, styles.fullWidthButton, responding && styles.buttonDisabled]}
          onPress={handleAccept}
          disabled={responding}
        >
          {responding ? (
            <ActivityIndicator color={colors.textOnPrimary} />
          ) : (
            <Text style={buttonStyles.primary.text}>Accept Invite</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.declineButton, responding && styles.buttonDisabled]}
          onPress={handleDecline}
          disabled={responding}
        >
          <Text style={styles.declineButtonText}>Decline</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 24,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  body: {
    flex: 1,
    paddingTop: 48,
  },
  title: {
    fontSize: fontSizes['2xl'],
    fontFamily: fonts.heading,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  inviterRow: {
    alignItems: 'center',
    marginBottom: 32,
  },
  subtitle: {
    fontSize: fontSizes.base,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 22,
  },
  card: {
    backgroundColor: colors.surface,
    padding: 28,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: 16,
  },
  cardIconWrap: {
    backgroundColor: colors.primaryLight,
    width: 64,
    height: 64,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.lg,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  cardDescription: {
    fontFamily: fonts.body,
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  inviteNote: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
  },
  footer: {
    paddingBottom: 24,
  },
  fullWidthButton: {
    width: '100%',
  },
  declineButton: {
    width: '100%',
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  declineButtonText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.base,
    color: colors.textSecondary,
  },
  buttonDisabled: {
    opacity: 0.4,
  },

  // Loading
  loadingText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    marginTop: 16,
  },

  // Success
  successIcon: {
    backgroundColor: colors.primaryLight,
    width: 80,
    height: 80,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: fontSizes.xl,
    fontFamily: fonts.heading,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  successBody: {
    fontSize: fontSizes.base,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Error / Invalid
  errorIcon: {
    backgroundColor: colors.destructiveLight,
    width: 80,
    height: 80,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  errorTitle: {
    fontSize: fontSizes.xl,
    fontFamily: fonts.heading,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  errorBody: {
    fontSize: fontSizes.base,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  secondaryButton: {
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  secondaryButtonText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.base,
    color: colors.textSecondary,
  },
});
