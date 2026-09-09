import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Alert, Image, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../../components/Button';
import PhoneInput from '../../../components/PhoneInput';
import { styles } from '../styles';
import type { PhoneDeliveryMethod } from '../../../api/auth';

interface PhoneEntryStepProps {
  onSubmit: (
    phone: string,
    countryCode: string,
    countryIso: string,
    deliveryMethod: PhoneDeliveryMethod,
  ) => void;
  isSubmitting: boolean;
}

export default function PhoneEntryStep({ onSubmit, isSubmitting }: PhoneEntryStepProps) {
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+61');
  const [countryIso, setCountryIso] = useState('AU');

  // EP-1261 — the channel is chosen HERE, not after a failed SMS. Users whose
  // SMS never arrives shouldn't have to trigger a useless (billable) text
  // before they can reach the channel that works for them.
  const handleSubmit = useCallback(
    (deliveryMethod: PhoneDeliveryMethod) => {
      if (!phone.trim()) {
        Alert.alert('Missing Phone', 'Please enter your phone number.');
        return;
      }
      onSubmit(phone, countryCode, countryIso, deliveryMethod);
    },
    [phone, countryCode, countryIso, onSubmit],
  );

  const renderHeader = () => (
    <View style={styles.headerRow}>
      <Image source={require('../../../../assets/Logo.png')} style={styles.logo} />
      <Text style={styles.brandName}>Emotional Pulse</Text>
    </View>
  );

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {renderHeader()}
          <Text style={styles.heading}>Enter your phone number</Text>
          <Text style={styles.body}>
            We&apos;ll send a verification code to confirm your number.
          </Text>
          <View style={styles.phoneWrapper}>
            <PhoneInput
              value={phone}
              onChangePhone={setPhone}
              countryCode={countryCode}
              onChangeCountryCode={setCountryCode}
              countryIso={countryIso}
              onChangeCountryIso={setCountryIso}
            />
          </View>
          <Button
            title="Send Code"
            onPress={() => handleSubmit('sms')}
            loading={isSubmitting}
            style={styles.primaryButton}
          />
          <Button
            title="Send Code on WhatsApp"
            variant="secondary"
            onPress={() => handleSubmit('whatsapp')}
            disabled={isSubmitting}
          />
        </ScrollView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}
