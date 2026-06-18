import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, Image } from 'react-native';
import LoadingAnimation from '../../components/LoadingAnimation';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../../types/navigation';
import { auth as xanoAuth } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { colors, fonts, fontSizes, borderRadius, spacing } from '../../theme';
import Button from '../../components/Button';
import OTPInput from '../../components/OTPInput';
import { errorMessage } from '../../lib/errorUtils';

type RouteParams = RouteProp<RootStackParamList, 'MobileVerify'>;

export default function MobileVerifyScreen() {
  const { userId, phone, countryIso } = useRoute<RouteParams>().params;
  const { loginWithMobile } = useAuth();
  const [isVerifying, setVerifying] = useState(false);

  // Lock the "Resend Code" button for 30s after the code is sent (on mount and
  // after each resend) to avoid back-to-back resends triggering repeat SMS.
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

  const handleResend = useCallback(async () => {
    if (cooldown > 0) return;
    try {
      await xanoAuth.signInWithMobile(phone, countryIso);
      setCooldown(30);
      Alert.alert('Code Sent', 'A new verification code has been sent to your phone.');
    } catch {
      Alert.alert('Error', 'Failed to resend code.');
    }
  }, [phone, countryIso, cooldown]);

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
            Enter the 4-digit code sent to your phone.
          </Text>

          <View style={styles.otpWrapper}>
            <OTPInput length={4} onComplete={handleCodeComplete} />
          </View>

          {isVerifying && <LoadingAnimation size={60} style={styles.spinner} />}

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
});
