import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp, CommonActions } from '@react-navigation/native';
import { Users, UserCheck, AlertCircle, Home } from 'lucide-react-native';
import { RootStackParamList } from '../../types/navigation';
import { colors, fonts, fontSizes, borderRadius, buttonStyles } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import {
  groupInvite as xanoGroupInvite,
  groups as xanoGroups,
  XanoGroupInviteRecord,
} from '../../api/groups';
import { XanoError } from '../../api/client';
import { invalidate, CACHE_KEYS } from '../../lib/fetchCache';
import { trackGroupInviteAccepted } from '../../lib/analyticsEvents';
import { logger } from '../../lib/logger';
import Avatar from '../../components/Avatar';
import LoadingAnimation from '../../components/LoadingAnimation';

type GroupInviteAcceptRouteProp = RouteProp<RootStackParamList, 'GroupInviteAccept'>;

type ScreenStep = 'loading' | 'invite' | 'accepted' | 'invalid' | 'error';

/**
 * Normalise a possibly-string-or-object profile pic URL into a plain string.
 */
function resolveProfilePic(
  pic: string | { url?: string } | null | undefined,
): string | null {
  if (!pic) return null;
  if (typeof pic === 'string') return pic;
  return pic.url ?? null;
}

export default function GroupInviteAcceptScreen() {
  const navigation = useNavigation();
  const route = useRoute<GroupInviteAcceptRouteProp>();
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();

  const token = route.params?.token;

  const [step, setStep] = useState<ScreenStep>('loading');
  const [inviteRecord, setInviteRecord] = useState<XanoGroupInviteRecord | null>(null);
  const [responding, setResponding] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // The screen is only registered in the authenticated stack and the pending
  // -link consumer waits for onboarding to complete before replaying, so by
  // the time we render `isAuthenticated` is always true and `user` is set.
  const goHome = useCallback(() => {
    navigation.dispatch(
      CommonActions.reset({ index: 0, routes: [{ name: 'Main' }] }),
    );
  }, [navigation]);

  // ── Load invite on mount (and when token / auth state changes) ────────
  useEffect(() => {
    let cancelled = false;

    async function loadInvite() {
      if (!token) {
        setStep('invalid');
        setErrorMessage('No invite token provided.');
        return;
      }

      setStep('loading');
      setErrorMessage(null);

      try {
        logger.info('[GroupInviteAccept] GET /get_group_invite', { token });
        const result = await xanoGroupInvite.getByToken(token);

        if (cancelled) return;

        // No usable data → treat as expired
        if (!result || !result.id) {
          setStep('invalid');
          setErrorMessage('This invite is no longer valid or has expired.');
          return;
        }

        // Client-side mismatched-recipient check (mirrors WeWeb).
        // Both email AND phone must differ to fail — if either matches the
        // invite is valid for this user. Empty/null invitee fields are
        // treated as "no constraint" (i.e. they shouldn't trip the check).
        // The screen is only reachable after sign-in + onboarding so `user`
        // is always populated here.
        if (user?.email) {
          const inviteeEmail = (result.invitee_email ?? '').trim().toLowerCase();
          const inviteePhone = (result.invitee_mobile_number ?? '').trim();
          const userEmail = (user.email ?? '').trim().toLowerCase();
          const userPhone = (user.phoneNumber ?? '').trim();

          const emailMatches = inviteeEmail && inviteeEmail === userEmail;
          const phoneMatches = inviteePhone && userPhone && inviteePhone === userPhone;
          const hasAnyConstraint = Boolean(inviteeEmail || inviteePhone);

          if (hasAnyConstraint && !emailMatches && !phoneMatches) {
            logger.warn('[GroupInviteAccept] Mismatched recipient — marking expired', {
              userEmail,
              inviteeEmail,
            });
            setStep('invalid');
            setErrorMessage('This invite was sent to a different account.');
            return;
          }
        }

        setInviteRecord(result);
        setStep('invite');
      } catch (e) {
        if (cancelled) return;
        logger.error('[GroupInviteAccept] get_group_invite failed', e);

        if (e instanceof XanoError && e.status >= 400 && e.status < 500) {
          setStep('invalid');
          setErrorMessage(e.message || 'This invite is no longer valid or has expired.');
          return;
        }

        setStep('error');
        setErrorMessage('Could not load the invite. Please check your connection and try again.');
      }
    }

    loadInvite();
    return () => { cancelled = true; };
  }, [token, user?.id, user?.email, user?.phoneNumber]);

  // ── Accept / decline handlers ────────────────────────────────────────
  const handleAccept = async () => {
    if (!inviteRecord?.id || !user?.id) return;

    setResponding(true);
    try {
      const groupForestMapId = inviteRecord.id;
      const userId = Number(user.id);

      logger.info('[GroupInviteAccept] PATCH /group/respond → ACCEPTED', { groupForestMapId, userId });
      await xanoGroups.respond(groupForestMapId, userId, 'ACCEPTED');

      trackGroupInviteAccepted();
      invalidate(CACHE_KEYS.GROUPS);

      setStep('accepted');

      // Brief pause to show the accepted state, then navigate home.
      setTimeout(async () => {
        try {
          await refreshUser();
        } catch {
          // Non-fatal — we'll navigate regardless
        }
        goHome();
      }, 1000);
    } catch (e) {
      logger.error('[GroupInviteAccept] accept failed', e);
      const msg =
        e instanceof XanoError && e.message
          ? `Could not accept invite: ${e.message}`
          : 'Could not accept the invite. Please try again.';
      showToast(msg, { variant: 'error' });
      setResponding(false);
    }
  };

  const handleDecline = async () => {
    if (!inviteRecord?.id || !user?.id) return;

    setResponding(true);
    try {
      const groupForestMapId = inviteRecord.id;
      const userId = Number(user.id);

      logger.info('[GroupInviteAccept] PATCH /group/respond → REJECTED', { groupForestMapId, userId });
      await xanoGroups.respond(groupForestMapId, userId, 'REJECTED');

      // Spec: no Amplitude event for decline
      invalidate(CACHE_KEYS.GROUPS);

      showToast('Invite declined', { variant: 'default' });
      goHome();
    } catch (e) {
      logger.error('[GroupInviteAccept] decline failed', e);
      const msg =
        e instanceof XanoError && e.message
          ? `Could not decline invite: ${e.message}`
          : 'Could not decline the invite. Please try again.';
      showToast(msg, { variant: 'error' });
      setResponding(false);
    }
  };

  const handleRetry = () => {
    setStep('loading');
    setErrorMessage(null);
    setInviteRecord(null);
    (async () => {
      if (!token) return;
      try {
        const result = await xanoGroupInvite.getByToken(token);
        if (!result || !result.id) {
          setStep('invalid');
          setErrorMessage('This invite is no longer valid or has expired.');
          return;
        }
        setInviteRecord(result);
        setStep('invite');
      } catch (e) {
        logger.error('[GroupInviteAccept] retry failed', e);
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

  // ── Derived display info ─────────────────────────────────────────────
  const groupName =
    inviteRecord?._group?.group_name ||
    inviteRecord?.group_name ||
    'a group';

  const groupImage = resolveProfilePic(inviteRecord?._group?.group_image ?? inviteRecord?.group_image ?? null);

  const inviterName =
    inviteRecord?._invited_by?.fullName ||
    [inviteRecord?._invited_by?.firstName, inviteRecord?._invited_by?.lastName]
      .filter(Boolean)
      .join(' ') ||
    inviteRecord?.invited_by_name ||
    'Someone';

  const inviterProfilePic = resolveProfilePic(inviteRecord?._invited_by?.profilePic_url);
  const inviterHexColour = inviteRecord?._invited_by?.profile_hex_colour ?? null;

  // ── Render ──────────────────────────────────────────────────────────

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
          <Text style={styles.successTitle}>Welcome to {groupName}!</Text>
          <Text style={styles.successBody}>
            You're now a member. Taking you home...
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
        <Text style={styles.title}>Group Invite</Text>

        <View style={styles.inviterRow}>
          <Avatar
            source={inviterProfilePic}
            name={inviterName}
            size="xl"
            hexColour={inviterHexColour ?? undefined}
            shadow="sm"
          />
          <Text style={styles.subtitle}>
            {inviterName} has invited you to join{'\n'}
            <Text style={styles.subtitleBold}>{groupName}</Text>.
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardIconWrap}>
            {groupImage ? (
              <Image source={{ uri: groupImage }} style={styles.groupImage} />
            ) : (
              <Users color={colors.primary} size={32} />
            )}
          </View>
          <Text style={styles.cardTitle}>{groupName}</Text>
          <Text style={styles.cardDescription}>
            Groups are private circles where members can share their emotional pulse,
            check in on each other, and look out for one another.
          </Text>
        </View>

        {inviteRecord?.invitee_email && (
          <Text style={styles.inviteNote}>
            This invite was sent to {inviteRecord.invitee_email}
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
  subtitleBold: {
    fontFamily: fonts.bodyBold,
    color: colors.textPrimary,
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
    overflow: 'hidden',
  },
  groupImage: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.full,
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
    textAlign: 'center',
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
    marginTop: 12,
  },
  secondaryButtonText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.base,
    color: colors.textSecondary,
  },
});
