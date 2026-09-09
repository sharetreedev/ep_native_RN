import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { auth as xanoAuth } from '../../api';
import type { PhoneDeliveryMethod } from '../../api/auth';
import { colors, fonts, fontSizes, borderRadius, spacing } from '../../theme';
import Button from '../../components/Button';
import PhoneInput from '../../components/PhoneInput';
import { errorMessage } from '../../lib/errorUtils';

type Nav = NativeStackNavigationProp<RootStackParamList, 'MobileSignIn'>;

export default function MobileSignInScreen() {
  const navigation = useNavigation<Nav>();
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+61');
  const [countryIso, setCountryIso] = useState('AU');
  const [isLoading, setLoading] = useState(false);

  // EP-1261 — the channel is chosen here rather than only after an SMS fails to
  // arrive, matching the WeWeb flow. Someone in a country where A2P SMS never
  // lands would otherwise have to send a useless, billable text first.
  async function sendCode(deliveryMethod: PhoneDeliveryMethod) {
    if (!phone.trim()) {
      Alert.alert('Missing Phone', 'Please enter your phone number.');
      return;
    }

    setLoading(true);
    try {
      const fullPhone = `${countryCode}${phone.replace(/^0+/, '')}`;
      const result = await xanoAuth.signInWithMobile(fullPhone, countryIso, deliveryMethod);

      // The endpoint answers HTTP 200 even when the send fails, carrying the
      // provider status in the body (201 == sent). Without this check an
      // unknown number or a failed send still navigated to the code screen.
      if (result.status !== undefined && Number(result.status) !== 201) {
        if (deliveryMethod === 'whatsapp') {
          // Never disclose whether the number is registered on WhatsApp.
          Alert.alert(
            'Couldn’t send on WhatsApp',
            'We couldn’t deliver your code on WhatsApp. Send it by text message instead?',
            [
              { text: 'Not now', style: 'cancel' },
              { text: 'Send by text', onPress: () => { void sendCode('sms'); } },
            ],
          );
        } else {
          Alert.alert('Error', result.message ?? 'Failed to send verification code. Please try again.');
        }
        return;
      }

      navigation.navigate('MobileVerify', {
        userId: String(result.user_id),
        phone,
        countryIso,
        deliveryMethod: result.delivery_method ?? deliveryMethod,
      });
    } catch (e: unknown) {
      Alert.alert('Error', errorMessage(e) ?? 'Failed to send verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <Image
              source={require('../../../assets/Logo.png')}
              style={styles.logo}
            />
            <Text style={styles.title}>Emotional Pulse</Text>
            <Text style={styles.subtitle}>Sign in with your mobile</Text>

            <PhoneInput
              value={phone}
              onChangePhone={setPhone}
              countryCode={countryCode}
              onChangeCountryCode={setCountryCode}
              countryIso={countryIso}
              onChangeCountryIso={setCountryIso}
            />

            <Button
              title="Continue"
              onPress={() => { void sendCode('sms'); }}
              loading={isLoading}
              style={styles.continueButton}
            />

            <Button
              title="Continue with WhatsApp"
              variant="secondary"
              onPress={() => { void sendCode('whatsapp'); }}
              disabled={isLoading}
              style={styles.whatsappButton}
            />

            <Button
              title="Back to sign in"
              onPress={() => navigation.goBack()}
              variant="secondary"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    marginBottom: spacing.xl,
  },
  continueButton: {
    marginTop: spacing.xl,
    marginBottom: spacing.base,
  },
  whatsappButton: {
    marginBottom: spacing.base,
  },
});
