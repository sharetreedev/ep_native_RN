import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../../types/navigation';
import { auth as xanoAuth, onboarding, tokenStore } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { colors, fonts, fontSizes, borderRadius, spacing } from '../../theme';
import Button from '../../components/Button';
import OTPInput from '../../components/OTPInput';
import { errorMessage } from '../../lib/errorUtils';
import { logger } from '../../lib/logger';

type RouteParams = RouteProp<RootStackParamList, 'MigrationVerify'>;

// Migrated email user: code was already sent by AuthScreen via
// generateCodeWithId. We verify it with verifyMobileCode (returns an
// authToken), then log them in with the pendingPasswordSetup flag so the
// navigator routes them to the Welcome → Set-password screens.
export default function MigrationVerifyScreen() {
  const { email, userId } = useRoute<RouteParams>().params;
  const { loginWithMobile } = useAuth();
  const [isVerifying, setVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(30);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleCodeComplete = useCallback(
    async (code: string) => {
      setVerifying(true);
      try {
        const result = await xanoAuth.verifyMobileCode(code, userId);
        // Gate on the thing we actually need — a usable token. This is
        // contract-independent: it doesn't matter how the backend encodes
        // `verified` (bool / "true" / "1"), a present authToken means the
        // code was accepted, its absence means it was rejected.
        if (typeof result.authToken === 'string' && result.authToken.length > 0) {
          // Authenticate up front so the email_verified call is authorised,
          // and so the /auth/me inside loginWithMobile already reflects
          // emailVerified — OnboardingScreen.getInitialStep reads
          // user.emailVerified to skip the redundant email step (the user
          // just proved email ownership with this code).
          await tokenStore.set(result.authToken);

          // Post-verification markers — both are best-effort side effects on
          // the now-authenticated user:
          //   • email_verified → onboarding skips the redundant email step
          //   • aws_synced     → flags the account reconciled from old AWS DB
          // A user who has already proven identity must never be blocked by a
          // marker failing; worst case they re-verify email in onboarding or
          // the backend re-syncs. allSettled so one failure can't drop the
          // other.
          const markers = await Promise.allSettled([
            onboarding.emailVerified(),
            xanoAuth.awsSynced(),
          ]);
          markers.forEach((m, i) => {
            if (m.status === 'rejected') {
              logger.warn(
                `[MigrationVerify] post-verify marker ${i === 0 ? 'emailVerified' : 'awsSynced'} failed:`,
                m.reason,
              );
            }
          });

          await loginWithMobile(result.authToken, { pendingPasswordSetup: true });
        } else {
          Alert.alert('Invalid Code', 'The code you entered is incorrect. Please try again.');
        }
      } catch (e: unknown) {
        Alert.alert('Verification Failed', errorMessage(e) ?? 'Something went wrong. Please try again.');
      } finally {
        setVerifying(false);
      }
    },
    [userId, loginWithMobile],
  );

  const handleResend = useCallback(async () => {
    if (cooldown > 0) return;
    try {
      await xanoAuth.generateCodeWithId('email', Number(userId));
      setCooldown(30);
      Alert.alert('Code Sent', `A new verification code has been sent to ${email}.`);
    } catch {
      Alert.alert('Error', 'Failed to resend code. Please try again.');
    }
  }, [cooldown, userId, email]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Image source={require('../../../assets/Logo.png')} style={styles.logo} />
          <Text style={styles.title}>Emotional Pulse</Text>
          <Text style={styles.subtitle}>Verify it&apos;s you</Text>
          <Text style={styles.body}>
            We sent a code to <Text style={styles.bold}>{email}</Text>. To verify
            that it&apos;s your account please enter the code below.
          </Text>

          <View style={styles.otpWrapper}>
            <OTPInput length={4} onComplete={handleCodeComplete} />
          </View>

          {isVerifying && <ActivityIndicator color={colors.primary} style={styles.spinner} />}

          <Button
            title={cooldown > 0 ? `Resend Code (${cooldown}s)` : 'Resend Code'}
            variant="secondary"
            onPress={handleResend}
            disabled={cooldown > 0}
            style={styles.resendButton}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: spacing.base },
  card: { padding: spacing.xl, borderRadius: borderRadius.lg },
  logo: { width: 48, height: 48, borderRadius: 16, alignSelf: 'center', marginBottom: spacing.base },
  title: {
    fontSize: fontSizes['3xl'],
    fontFamily: fonts.bodyBold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.bodyMedium,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.base,
  },
  body: {
    fontSize: fontSizes.base,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  bold: { fontFamily: fonts.bodySemiBold, color: colors.textPrimary },
  otpWrapper: { alignItems: 'center', marginBottom: spacing.xl },
  spinner: { marginBottom: spacing.base },
  resendButton: { marginTop: spacing.base },
});
