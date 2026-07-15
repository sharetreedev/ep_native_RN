import React, { useMemo, useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity, FlatList, Modal } from 'react-native';
import { colors, fonts, fontSizes, borderRadius, spacing } from '../theme';
import { COUNTRY_CODES } from '../constants/countries';

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
  const [search, setSearch] = useState('');

  const filteredCodes = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return COUNTRY_CODES;
    return COUNTRY_CODES.filter(
      (item) =>
        item.label.toLowerCase().includes(query) ||
        item.code.includes(query) ||
        item.country.toLowerCase().includes(query)
    );
  }, [search]);

  const closePicker = () => {
    setPickerVisible(false);
    setSearch('');
  };

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

      <Modal visible={pickerVisible} transparent animationType="slide" onRequestClose={closePicker}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={closePicker}>
          <TouchableOpacity style={styles.pickerContainer} activeOpacity={1}>
            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Search country or code"
              placeholderTextColor={colors.textPlaceholder}
              autoCorrect={false}
              autoCapitalize="none"
            />
            <FlatList
              data={filteredCodes}
              keyboardShouldPersistTaps="handled"
              keyExtractor={(item) => item.country}
              ListEmptyComponent={<Text style={styles.emptyText}>No matches</Text>}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pickerRow}
                  onPress={() => {
                    onChangeCountryCode(item.code);
                    onChangeCountryIso(item.country);
                    closePicker();
                  }}
                >
                  <Text style={styles.pickerLabel}>{item.label}</Text>
                  <Text style={styles.pickerCode}>{item.code}</Text>
                </TouchableOpacity>
              )}
            />
          </TouchableOpacity>
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
  searchInput: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.button,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    fontSize: fontSizes.base,
    fontFamily: fonts.body,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: spacing.xl,
    fontSize: fontSizes.base,
    fontFamily: fonts.body,
    color: colors.textMuted,
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
