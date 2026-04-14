import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity, FlatList, Modal } from 'react-native';
import { colors, fonts, fontSizes, borderRadius, spacing } from '../theme';

const COUNTRY_CODES = [
  { code: '+61', country: 'AU', label: 'Australia' },
  { code: '+1', country: 'US', label: 'United States' },
  { code: '+44', country: 'GB', label: 'United Kingdom' },
  { code: '+64', country: 'NZ', label: 'New Zealand' },
  { code: '+91', country: 'IN', label: 'India' },
  { code: '+49', country: 'DE', label: 'Germany' },
  { code: '+33', country: 'FR', label: 'France' },
  { code: '+81', country: 'JP', label: 'Japan' },
  { code: '+86', country: 'CN', label: 'China' },
  { code: '+82', country: 'KR', label: 'South Korea' },
  { code: '+55', country: 'BR', label: 'Brazil' },
  { code: '+27', country: 'ZA', label: 'South Africa' },
  { code: '+971', country: 'AE', label: 'UAE' },
  { code: '+65', country: 'SG', label: 'Singapore' },
  { code: '+353', country: 'IE', label: 'Ireland' },
];

interface PhoneInputProps {
  value: string;
  onChangePhone: (phone: string) => void;
  countryCode: string;
  onChangeCountryCode: (code: string) => void;
  countryIso: string;
  onChangeCountryIso: (iso: string) => void;
}

export default function PhoneInput({
  value,
  onChangePhone,
  countryCode,
  onChangeCountryCode,
  countryIso,
  onChangeCountryIso,
}: PhoneInputProps) {
  const [pickerVisible, setPickerVisible] = useState(false);

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.codeButton} onPress={() => setPickerVisible(true)}>
        <Text style={styles.codeText}>{countryCode}</Text>
        <Text style={styles.chevron}>▼</Text>
      </TouchableOpacity>

      <TextInput
        style={styles.input}
        value={value}
        onChangeText={(text) => {
          // Strip non-digits and cap at 15 (E.164 max national subscriber length)
          const digitsOnly = text.replace(/\D/g, '').slice(0, 15);
          onChangePhone(digitsOnly);
        }}
        placeholder="Phone number"
        placeholderTextColor={colors.textPlaceholder}
        keyboardType="phone-pad"
        autoComplete="tel"
        maxLength={15}
      />

      <Modal visible={pickerVisible} transparent animationType="slide">
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setPickerVisible(false)}
        >
          <View style={styles.pickerContainer}>
            <FlatList
              data={COUNTRY_CODES}
              keyExtractor={(item) => item.country}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pickerRow}
                  onPress={() => {
                    onChangeCountryCode(item.code);
                    onChangeCountryIso(item.country);
                    setPickerVisible(false);
                  }}
                >
                  <Text style={styles.pickerLabel}>{item.label}</Text>
                  <Text style={styles.pickerCode}>{item.code}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  codeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.button,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    gap: spacing.xs,
  },
  codeText: {
    fontSize: fontSizes.base,
    fontFamily: fonts.bodyMedium,
    color: colors.textPrimary,
  },
  chevron: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.button,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    fontSize: fontSizes.base,
    fontFamily: fonts.body,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.overlay,
  },
  pickerContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: 400,
    paddingTop: spacing.base,
    paddingBottom: spacing['2xl'],
  },
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  pickerLabel: {
    fontSize: fontSizes.base,
    fontFamily: fonts.body,
    color: colors.textPrimary,
  },
  pickerCode: {
    fontSize: fontSizes.base,
    fontFamily: fonts.bodyMedium,
    color: colors.textSecondary,
  },
});
