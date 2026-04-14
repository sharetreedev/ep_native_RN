import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../../theme';
import Button from '../../../components/Button';
import OTPInput from '../../../components/OTPInput';
import { auth as xanoAuth } from '../../../api';
import { styles } from '../styles';

interface EmailVerificationStepProps {
  email: string;
  onComplete: () => void;
  isSubmitting: boolean;
}

export default function EmailVerificationStep({
  email,
  onComplete,
  isSubmitting,
}: EmailVerificationStepProps) {
  const [emailCodeSent, setEmailCodeSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const sendEmailCode = useCallback(async () => {
    if (cooldown > 0) return;
    try {
      await xanoAuth.generateCode('email');
      setEmailCodeSent(true);
      setCooldown(30);
      Alert.alert('Code Sent', `A verification code has been sent to ${email}.`);
    } catch {
      Alert.alert('Error', 'Failed to send verification code. Please try again.');
    }
  }, [cooldown, email]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  useEffect(() => {
    if (!emailCodeSent) {
      sendEmailCode();
    }
  }, [emailCodeSent, sendEmailCode]);

  const handleCodeComplete = useCallback(
    async (code: string) => {
      const result = await xanoAuth.verifyCode(Number(code));
      if (result.verified === 'true' || result.verified === '1') {
        onComplete();
      } else {
        Alert.alert('Invalid Code', 'The code you entered is incorrect. Please try again.');
      }
    },
    [onComplete],
  );

  const renderHeader = () => (
    <View style={styles.headerRow}>
      <Image source={require('../../../../assets/Logo.png')} style={styles.logo} />
      <Text style={styles.brandName}>Emotional Pulse</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {renderHeader()}
        <Text style={styles.heading}>Verify your email</Text>
        <Text style={styles.body}>
          We&apos;ve sent a 4-digit code to{' '}
          <Text style={styles.bold}>{email}</Text>. Enter it below.
        </Text>
        <View style={styles.otpWrapper}>
          <OTPInput length={4} onComplete={handleCodeComplete} />
        </View>
        {isSubmitting && <ActivityIndicator color={colors.primary} style={styles.spinner} />}
        <Button
          title={cooldown > 0 ? `Resend Code (${cooldown}s)` : 'Resend Code'}
          variant="secondary"
          onPress={sendEmailCode}
          disabled={cooldown > 0}
          style={styles.resendButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
