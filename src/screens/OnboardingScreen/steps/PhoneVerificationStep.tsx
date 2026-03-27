import React, { useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../../theme';
import Button from '../../../components/Button';
import OTPInput from '../../../components/OTPInput';
import { auth as xanoAuth } from '../../../api';
import { styles } from '../styles';

interface PhoneVerificationStepProps {
  onComplete: () => void;
  isSubmitting: boolean;
}

export default function PhoneVerificationStep({
  onComplete,
  isSubmitting,
}: PhoneVerificationStepProps) {
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

  const handleResend = useCallback(async () => {
    try {
      await xanoAuth.generateCode('phone');
      Alert.alert('Code Sent', 'A new code has been sent to your phone.');
    } catch {
      Alert.alert('Error', 'Failed to resend code.');
    }
  }, []);

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
        {isSubmitting && <ActivityIndicator color={colors.primary} style={styles.spinner} />}
        <Button
          title="Resend Code"
          variant="secondary"
          onPress={handleResend}
          style={styles.resendButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
