import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, Alert, Image } from 'react-native';
import LoadingAnimation from '../../../components/LoadingAnimation';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../../theme';
import Button from '../../../components/Button';
import OTPInput from '../../../components/OTPInput';
import { auth as xanoAuth } from '../../../api';
import { isVerifiedResponse } from '../../../api/auth';
import type { PhoneDeliveryMethod } from '../../../api/auth';
import { logger } from '../../../lib/logger';
import { styles } from '../styles';

interface PhoneVerificationStepProps {
  onComplete: () => void;
  isSubmitting: boolean;
  /** Channel the first code was sent on (EP-1261). */
  initialChannel?: PhoneDeliveryMethod;
}

const RESEND_COOLDOWN = 30;

export default function PhoneVerificationStep({
  onComplete,
  isSubmitting,
  initialChannel = 'sms',
}: PhoneVerificationStepProps) {
  const [isSending, setSending] = useState(false);

  // Channel the current code was sent on — whichever was chosen at phone entry.
  const [channel, setChannel] = useState<PhoneDeliveryMethod>(initialChannel);

  // Per-channel cooldowns (EP-1261) — a shared one would lock the WhatsApp
  // option for 30s exactly when someone needs it because SMS isn't arriving.
  const [cooldowns, setCooldowns] = useState<Record<PhoneDeliveryMethod, number>>(
    initialChannel === 'whatsapp'
      ? { sms: 0, whatsapp: RESEND_COOLDOWN }
      : { sms: RESEND_COOLDOWN, whatsapp: 0 },
  );

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
      try {
        const result = await xanoAuth.verifyCode(code);
        logger.info('[PhoneVerification] verifyCode response', { result });
        if (isVerifiedResponse(result)) {
          onComplete();
        } else {
          Alert.alert('Invalid Code', 'The code you entered is incorrect. Please try again.');
        }
      } catch (e) {
        logger.error('[PhoneVerification] verifyCode threw', e);
        Alert.alert('Verification failed', 'Could not verify the code right now. Please try again.');
      }
    },
    [onComplete],
  );

  /**
   * Request a new code over `method`. Returns false on failure so callers can
   * choose the next move. The endpoint answers 200 with the provider status in
   * the body (201 == sent), so a thrown error isn't the only failure mode.
   */
  const sendCode = useCallback(async (method: PhoneDeliveryMethod): Promise<boolean> => {
    setSending(true);
    try {
      const result = await xanoAuth.generateCode(method);
      const status = (result as { status?: number | string }).status;
      if (status !== undefined && Number(status) !== 201) return false;
      setChannel(result.delivery_method === 'whatsapp' ? 'whatsapp' : method);
      setCooldowns((prev) => ({ ...prev, [method]: RESEND_COOLDOWN }));
      Alert.alert(
        'Code Sent',
        method === 'whatsapp'
          ? 'We’ve sent your code to you on WhatsApp.'
          : 'A new code has been sent to your phone.',
      );
      return true;
    } catch (e) {
      logger.error('[PhoneVerification] sendCode failed', e);
      return false;
    } finally {
      setSending(false);
    }
  }, []);

  const handleResend = useCallback(async () => {
    if (cooldowns.sms > 0 || isSending) return;
    if (!(await sendCode('sms'))) {
      Alert.alert('Error', 'Failed to resend code.');
    }
  }, [cooldowns.sms, isSending, sendCode]);

  const handleWhatsApp = useCallback(async () => {
    if (cooldowns.whatsapp > 0 || isSending) return;
    if (await sendCode('whatsapp')) return;

    // Deliberately does not reveal whether the number is on WhatsApp.
    Alert.alert(
      'Couldn’t send on WhatsApp',
      'We couldn’t deliver your code on WhatsApp. Send it by text message instead?',
      [
        { text: 'Not now', style: 'cancel' },
        { text: 'Send by text', onPress: () => { void handleResend(); } },
      ],
    );
  }, [cooldowns.whatsapp, isSending, sendCode, handleResend]);

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
          {channel === 'whatsapp'
            ? 'Enter the 4-digit code we sent you on WhatsApp.'
            : 'Enter the 4-digit code sent to your phone.'}
        </Text>
        <View style={styles.otpWrapper}>
          <OTPInput length={4} onComplete={handleCodeComplete} />
        </View>
        {(isSubmitting || isSending) && <LoadingAnimation size={60} style={styles.spinner} />}
        <Button
          title={cooldowns.sms > 0 ? `Resend Code (${cooldowns.sms}s)` : 'Resend Code'}
          variant="secondary"
          onPress={handleResend}
          disabled={cooldowns.sms > 0 || isSending}
          style={styles.resendButton}
        />
        <Button
          title={
            cooldowns.whatsapp > 0
              ? `Send on WhatsApp (${cooldowns.whatsapp}s)`
              : 'Send my code on WhatsApp instead'
          }
          variant="secondary"
          onPress={handleWhatsApp}
          disabled={cooldowns.whatsapp > 0 || isSending}
          style={styles.resendButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
