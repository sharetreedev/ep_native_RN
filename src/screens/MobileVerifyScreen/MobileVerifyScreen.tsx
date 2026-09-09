import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, Image } from 'react-native';
import LoadingAnimation from '../../components/LoadingAnimation';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../../types/navigation';
import { auth as xanoAuth } from '../../api';
import type { PhoneDeliveryMethod } from '../../api/auth';
import { useAuth } from '../../contexts/AuthContext';
import { colors, fonts, fontSizes, borderRadius, spacing } from '../../theme';
import Button from '../../components/Button';
import OTPInput from '../../components/OTPInput';
import { errorMessage } from '../../lib/errorUtils';

type RouteParams = RouteProp<RootStackParamList, 'MobileVerify'>;

const RESEND_COOLDOWN = 30;

export default function MobileVerifyScreen() {
  const { userId, phone, countryIso } = useRoute<RouteParams>().params;
  const { loginWithMobile } = useAuth();
  const [isVerifying, setVerifying] = useState(false);
  const [isSending, setSending] = useState(false);

  // Which channel the code in the user's hand arrived on. MobileSignInScreen
  // always sends by SMS first, so that's the starting state.
  const [channel, setChannel] = useState<PhoneDeliveryMethod>('sms');

  // One cooldown per channel (EP-1261). A single shared cooldown would disable
  // the WhatsApp option for 30s on arrival, which defeats the point — the users
  // who need it are exactly those whose SMS never lands.
  const [cooldowns, setCooldowns] = useState<Record<PhoneDeliveryMethod, number>>({
    sms: RESEND_COOLDOWN,
    whatsapp: 0,
  });

  useEffect(() => {
    if (cooldowns.sms <= 0 && cooldowns.whatsapp <= 0) return;
    const timer = setInterval(() => {
      setCooldowns((prev) => ({
        sms: prev.sms <= 1 ? 0 : prev.sms - 1,
        whatsapp: prev.whatsapp <= 1 ? 0 : prev.whatsapp - 1,
      }));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldowns.sms, cooldowns.whatsapp]);

  const handleCodeComplete = useCallback(
    async (code: string) => {
      setVerifying(true);
      try {
        const result = await xanoAuth.verifyMobileCode(code, userId);
        if (result.verified) {
          await loginWithMobile(result.authToken);
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

  /**
   * Re-request a code on `method`. Returns false on failure so the caller can
   * decide what to offer next — WhatsApp falls back to SMS, SMS just reports.
   *
   * The endpoint answers HTTP 200 even when the send fails, carrying the
   * provider status in the body (201 == sent), so a thrown error is not the
   * only failure mode we have to catch.
   */
  const sendCode = useCallback(
    async (method: PhoneDeliveryMethod): Promise<boolean> => {
      setSending(true);
      try {
        const result = await xanoAuth.signInWithMobile(phone, countryIso, method);
        if (result.status !== undefined && Number(result.status) !== 201) {
          return false;
        }
        setChannel(result.delivery_method ?? method);
        setCooldowns((prev) => ({ ...prev, [method]: RESEND_COOLDOWN }));
        Alert.alert(
          'Code sent',
          method === 'whatsapp'
            ? 'We’ve sent your code to you on WhatsApp.'
            : 'A new verification code has been sent to your phone.',
        );
        return true;
      } catch {
        return false;
      } finally {
        setSending(false);
      }
    },
    [phone, countryIso],
  );

  const handleResend = useCallback(async () => {
    if (cooldowns.sms > 0 || isSending) return;
    if (!(await sendCode('sms'))) {
      Alert.alert('Error', 'Failed to resend code.');
    }
  }, [cooldowns.sms, isSending, sendCode]);

  const handleWhatsApp = useCallback(async () => {
    if (cooldowns.whatsapp > 0 || isSending) return;
    if (await sendCode('whatsapp')) return;

    // Never say whether the number is registered on WhatsApp — that would leak
    // account information to anyone who can type a phone number.
    Alert.alert(
      'Couldn’t send on WhatsApp',
      'We couldn’t deliver your code on WhatsApp. Send it by text message instead?',
      [
        { text: 'Not now', style: 'cancel' },
        {
          text: 'Send by text',
          onPress: () => {
            void handleResend();
          },
        },
      ],
    );
  }, [cooldowns.whatsapp, isSending, sendCode, handleResend]);

  const whatsappTitle =
    cooldowns.whatsapp > 0
      ? `Send on WhatsApp (${cooldowns.whatsapp}s)`
      : 'Send my code on WhatsApp instead';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Image
            source={require('../../../assets/Logo.png')}
            style={styles.logo}
          />
          <Text style={styles.title}>Emotional Pulse</Text>
          <Text style={styles.subtitle}>Verify your phone</Text>
          <Text style={styles.body}>
            {channel === 'whatsapp'
              ? 'Enter the 4-digit code we sent you on WhatsApp.'
              : 'Enter the 4-digit code sent to your phone.'}
          </Text>

          <View style={styles.otpWrapper}>
            <OTPInput length={4} onComplete={handleCodeComplete} />
          </View>

          {(isVerifying || isSending) && <LoadingAnimation size={60} style={styles.spinner} />}

          <Button
            title={cooldowns.sms > 0 ? `Resend Code (${cooldowns.sms}s)` : 'Resend Code'}
            variant="secondary"
            onPress={handleResend}
            disabled={cooldowns.sms > 0 || isSending}
            style={styles.resendButton}
          />

          <Button
            title={whatsappTitle}
            variant="secondary"
            onPress={handleWhatsApp}
            disabled={cooldowns.whatsapp > 0 || isSending}
            style={styles.whatsappButton}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.base,
  },
  card: {
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignSelf: 'center',
    marginBottom: spacing.base,
  },
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
    marginBottom: spacing.xl,
  },
  otpWrapper: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  spinner: {
    marginBottom: spacing.base,
  },
  resendButton: {
    marginTop: spacing.base,
  },
  whatsappButton: {
    marginTop: spacing.sm,
  },
});
