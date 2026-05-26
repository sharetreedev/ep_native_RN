import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, Alert, Image } from 'react-native';
import LoadingAnimation from '../../../components/LoadingAnimation';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../../theme';
import Button from '../../../components/Button';
import OTPInput from '../../../components/OTPInput';
import { auth as xanoAuth } from '../../../api';
import { isVerifiedResponse } from '../../../api/auth';
import { styles } from '../styles';

interface PhoneVerificationStepProps {
  onComplete: () => void;
  isSubmitting: boolean;
}

export default function PhoneVerificationStep({
  onComplete,
  isSubmitting,
}: PhoneVerificationStepProps) {
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
      const result = await xanoAuth.verifyCode(code);
      if (isVerifiedResponse(result)) {
        onComplete();
      } else {
        Alert.alert('Invalid Code', 'The code you entered is incorrect. Please try again.');
      }
    },
    [onComplete],
  );

  const handleResend = useCallback(async () => {
    if (cooldown > 0) return;
    try {
      await xanoAuth.generateCode('phone');
      setCooldown(30);
      Alert.alert('Code Sent', 'A new code has been sent to your phone.');
    } catch {
      Alert.alert('Error', 'Failed to resend code.');
    }
  }, [cooldown]);

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
        <Text style={styles.heading}>Verify your phone</Text>
        <Text style={styles.body}>
          Enter the 4-digit code sent to your phone.
        </Text>
        <View style={styles.otpWrapper}>
          <OTPInput length={4} onComplete={handleCodeComplete} />
        </View>
        {isSubmitting && <LoadingAnimation size={60} style={styles.spinner} />}
        <Button
          title={cooldown > 0 ? `Resend Code (${cooldown}s)` : 'Resend Code'}
          variant="secondary"
          onPress={handleResend}
          disabled={cooldown > 0}
          style={styles.resendButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
