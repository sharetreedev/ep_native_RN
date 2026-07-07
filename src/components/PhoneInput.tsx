import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, fonts, fontSizes, borderRadius, spacing } from '../theme';
import { COUNTRY_CODES } from '../constants/countries';
import ModalPicker from './ModalPicker';

interface PhoneInputProps {
  value: string;
  onChangePhone: (phone: string) => void;
  countryCode: string;
  onChangeCountryCode: (code: string) => void;
  countryIso: string;
  onChangeCountryIso: (iso: string) => void;
}

// ModalPicker keys selection off `value`; use the ISO code so the current
// country shows as selected in the list.
const COUNTRY_OPTIONS = COUNTRY_CODES.map((c) => ({ ...c, value: c.country }));
type CountryOption = (typeof COUNTRY_OPTIONS)[number];

// Stable (module-level) so ModalPicker's filter memo isn't recreated each render.
const getCountrySearchText = (item: CountryOption) => `${item.label} ${item.code} ${item.country}`;
const renderCountryDialCode = (item: CountryOption) => (
  <Text style={styles.pickerCode}>{item.code}</Text>
);

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

      <ModalPicker
        visible={pickerVisible}
        onDismiss={() => setPickerVisible(false)}
        data={COUNTRY_OPTIONS}
        selectedValue={countryIso}
        animationType="slide"
        searchable
        searchPlaceholder="Search country or code"
        getSearchText={getCountrySearchText}
        renderTrailing={renderCountryDialCode}
        onSelect={(item) => {
          onChangeCountryCode(item.code);
          onChangeCountryIso(item.country);
          setPickerVisible(false);
        }}
      />
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
  pickerCode: {
    fontSize: fontSizes.base,
    fontFamily: fonts.bodyMedium,
    color: colors.textSecondary,
  },
});
