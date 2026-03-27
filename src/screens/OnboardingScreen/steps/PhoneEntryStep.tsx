import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../../components/Button';
import PhoneInput from '../../../components/PhoneInput';
import { styles } from '../styles';

interface PhoneEntryStepProps {
  onSubmit: (phone: string, countryCode: string, countryIso: string) => void;
  isSubmitting: boolean;
}

export default function PhoneEntryStep({ onSubmit, isSubmitting }: PhoneEntryStepProps) {
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+61');
  const [countryIso, setCountryIso] = useState('AU');

  const handleSubmit = useCallback(() => {
    if (!phone.trim()) {
      Alert.alert('Missing Phone', 'Please enter your phone number.');
      return;
    }
    onSubmit(phone, countryCode, countryIso);
  }, [phone, countryCode, countryIso, onSubmit]);

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
          onPress={handleSubmit}
          loading={isSubmitting}
          style={styles.primaryButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
