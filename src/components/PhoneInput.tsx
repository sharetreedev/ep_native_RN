import React, { useMemo, useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity, FlatList, Modal } from 'react-native';
import { colors, fonts, fontSizes, borderRadius, spacing } from '../theme';

const COUNTRY_CODES = [
  { code: '+93', country: 'AF', label: 'Afghanistan' },
  { code: '+355', country: 'AL', label: 'Albania' },
  { code: '+213', country: 'DZ', label: 'Algeria' },
  { code: '+376', country: 'AD', label: 'Andorra' },
  { code: '+244', country: 'AO', label: 'Angola' },
  { code: '+1', country: 'AG', label: 'Antigua and Barbuda' },
  { code: '+54', country: 'AR', label: 'Argentina' },
  { code: '+374', country: 'AM', label: 'Armenia' },
  { code: '+297', country: 'AW', label: 'Aruba' },
  { code: '+61', country: 'AU', label: 'Australia' },
  { code: '+43', country: 'AT', label: 'Austria' },
  { code: '+994', country: 'AZ', label: 'Azerbaijan' },
  { code: '+1', country: 'BS', label: 'Bahamas' },
  { code: '+973', country: 'BH', label: 'Bahrain' },
  { code: '+880', country: 'BD', label: 'Bangladesh' },
  { code: '+1', country: 'BB', label: 'Barbados' },
  { code: '+375', country: 'BY', label: 'Belarus' },
  { code: '+32', country: 'BE', label: 'Belgium' },
  { code: '+501', country: 'BZ', label: 'Belize' },
  { code: '+229', country: 'BJ', label: 'Benin' },
  { code: '+1', country: 'BM', label: 'Bermuda' },
  { code: '+975', country: 'BT', label: 'Bhutan' },
  { code: '+591', country: 'BO', label: 'Bolivia' },
  { code: '+387', country: 'BA', label: 'Bosnia and Herzegovina' },
  { code: '+267', country: 'BW', label: 'Botswana' },
  { code: '+55', country: 'BR', label: 'Brazil' },
  { code: '+673', country: 'BN', label: 'Brunei' },
  { code: '+359', country: 'BG', label: 'Bulgaria' },
  { code: '+226', country: 'BF', label: 'Burkina Faso' },
  { code: '+257', country: 'BI', label: 'Burundi' },
  { code: '+855', country: 'KH', label: 'Cambodia' },
  { code: '+237', country: 'CM', label: 'Cameroon' },
  { code: '+1', country: 'CA', label: 'Canada' },
  { code: '+238', country: 'CV', label: 'Cape Verde' },
  { code: '+1', country: 'KY', label: 'Cayman Islands' },
  { code: '+236', country: 'CF', label: 'Central African Republic' },
  { code: '+235', country: 'TD', label: 'Chad' },
  { code: '+56', country: 'CL', label: 'Chile' },
  { code: '+86', country: 'CN', label: 'China' },
  { code: '+57', country: 'CO', label: 'Colombia' },
  { code: '+269', country: 'KM', label: 'Comoros' },
  { code: '+243', country: 'CD', label: 'Congo (DRC)' },
  { code: '+242', country: 'CG', label: 'Congo (Republic)' },
  { code: '+506', country: 'CR', label: 'Costa Rica' },
  { code: '+225', country: 'CI', label: "Côte d'Ivoire" },
  { code: '+385', country: 'HR', label: 'Croatia' },
  { code: '+53', country: 'CU', label: 'Cuba' },
  { code: '+357', country: 'CY', label: 'Cyprus' },
  { code: '+420', country: 'CZ', label: 'Czech Republic' },
  { code: '+45', country: 'DK', label: 'Denmark' },
  { code: '+253', country: 'DJ', label: 'Djibouti' },
  { code: '+1', country: 'DM', label: 'Dominica' },
  { code: '+1', country: 'DO', label: 'Dominican Republic' },
  { code: '+593', country: 'EC', label: 'Ecuador' },
  { code: '+20', country: 'EG', label: 'Egypt' },
  { code: '+503', country: 'SV', label: 'El Salvador' },
  { code: '+240', country: 'GQ', label: 'Equatorial Guinea' },
  { code: '+291', country: 'ER', label: 'Eritrea' },
  { code: '+372', country: 'EE', label: 'Estonia' },
  { code: '+268', country: 'SZ', label: 'Eswatini' },
  { code: '+251', country: 'ET', label: 'Ethiopia' },
  { code: '+679', country: 'FJ', label: 'Fiji' },
  { code: '+358', country: 'FI', label: 'Finland' },
  { code: '+33', country: 'FR', label: 'France' },
  { code: '+241', country: 'GA', label: 'Gabon' },
  { code: '+220', country: 'GM', label: 'Gambia' },
  { code: '+995', country: 'GE', label: 'Georgia' },
  { code: '+49', country: 'DE', label: 'Germany' },
  { code: '+233', country: 'GH', label: 'Ghana' },
  { code: '+350', country: 'GI', label: 'Gibraltar' },
  { code: '+30', country: 'GR', label: 'Greece' },
  { code: '+299', country: 'GL', label: 'Greenland' },
  { code: '+1', country: 'GD', label: 'Grenada' },
  { code: '+1', country: 'GU', label: 'Guam' },
  { code: '+502', country: 'GT', label: 'Guatemala' },
  { code: '+224', country: 'GN', label: 'Guinea' },
  { code: '+245', country: 'GW', label: 'Guinea-Bissau' },
  { code: '+592', country: 'GY', label: 'Guyana' },
  { code: '+509', country: 'HT', label: 'Haiti' },
  { code: '+504', country: 'HN', label: 'Honduras' },
  { code: '+852', country: 'HK', label: 'Hong Kong' },
  { code: '+36', country: 'HU', label: 'Hungary' },
  { code: '+354', country: 'IS', label: 'Iceland' },
  { code: '+91', country: 'IN', label: 'India' },
  { code: '+62', country: 'ID', label: 'Indonesia' },
  { code: '+98', country: 'IR', label: 'Iran' },
  { code: '+964', country: 'IQ', label: 'Iraq' },
  { code: '+353', country: 'IE', label: 'Ireland' },
  { code: '+972', country: 'IL', label: 'Israel' },
  { code: '+39', country: 'IT', label: 'Italy' },
  { code: '+1', country: 'JM', label: 'Jamaica' },
  { code: '+81', country: 'JP', label: 'Japan' },
  { code: '+962', country: 'JO', label: 'Jordan' },
  { code: '+7', country: 'KZ', label: 'Kazakhstan' },
  { code: '+254', country: 'KE', label: 'Kenya' },
  { code: '+686', country: 'KI', label: 'Kiribati' },
  { code: '+383', country: 'XK', label: 'Kosovo' },
  { code: '+965', country: 'KW', label: 'Kuwait' },
  { code: '+996', country: 'KG', label: 'Kyrgyzstan' },
  { code: '+856', country: 'LA', label: 'Laos' },
  { code: '+371', country: 'LV', label: 'Latvia' },
  { code: '+961', country: 'LB', label: 'Lebanon' },
  { code: '+266', country: 'LS', label: 'Lesotho' },
  { code: '+231', country: 'LR', label: 'Liberia' },
  { code: '+218', country: 'LY', label: 'Libya' },
  { code: '+423', country: 'LI', label: 'Liechtenstein' },
  { code: '+370', country: 'LT', label: 'Lithuania' },
  { code: '+352', country: 'LU', label: 'Luxembourg' },
  { code: '+853', country: 'MO', label: 'Macau' },
  { code: '+261', country: 'MG', label: 'Madagascar' },
  { code: '+265', country: 'MW', label: 'Malawi' },
  { code: '+60', country: 'MY', label: 'Malaysia' },
  { code: '+960', country: 'MV', label: 'Maldives' },
  { code: '+223', country: 'ML', label: 'Mali' },
  { code: '+356', country: 'MT', label: 'Malta' },
  { code: '+692', country: 'MH', label: 'Marshall Islands' },
  { code: '+222', country: 'MR', label: 'Mauritania' },
  { code: '+230', country: 'MU', label: 'Mauritius' },
  { code: '+52', country: 'MX', label: 'Mexico' },
  { code: '+691', country: 'FM', label: 'Micronesia' },
  { code: '+373', country: 'MD', label: 'Moldova' },
  { code: '+377', country: 'MC', label: 'Monaco' },
  { code: '+976', country: 'MN', label: 'Mongolia' },
  { code: '+382', country: 'ME', label: 'Montenegro' },
  { code: '+212', country: 'MA', label: 'Morocco' },
  { code: '+258', country: 'MZ', label: 'Mozambique' },
  { code: '+95', country: 'MM', label: 'Myanmar' },
  { code: '+264', country: 'NA', label: 'Namibia' },
  { code: '+674', country: 'NR', label: 'Nauru' },
  { code: '+977', country: 'NP', label: 'Nepal' },
  { code: '+31', country: 'NL', label: 'Netherlands' },
  { code: '+64', country: 'NZ', label: 'New Zealand' },
  { code: '+505', country: 'NI', label: 'Nicaragua' },
  { code: '+227', country: 'NE', label: 'Niger' },
  { code: '+234', country: 'NG', label: 'Nigeria' },
  { code: '+850', country: 'KP', label: 'North Korea' },
  { code: '+389', country: 'MK', label: 'North Macedonia' },
  { code: '+47', country: 'NO', label: 'Norway' },
  { code: '+968', country: 'OM', label: 'Oman' },
  { code: '+92', country: 'PK', label: 'Pakistan' },
  { code: '+680', country: 'PW', label: 'Palau' },
  { code: '+970', country: 'PS', label: 'Palestine' },
  { code: '+507', country: 'PA', label: 'Panama' },
  { code: '+675', country: 'PG', label: 'Papua New Guinea' },
  { code: '+595', country: 'PY', label: 'Paraguay' },
  { code: '+51', country: 'PE', label: 'Peru' },
  { code: '+63', country: 'PH', label: 'Philippines' },
  { code: '+48', country: 'PL', label: 'Poland' },
  { code: '+351', country: 'PT', label: 'Portugal' },
  { code: '+1', country: 'PR', label: 'Puerto Rico' },
  { code: '+974', country: 'QA', label: 'Qatar' },
  { code: '+40', country: 'RO', label: 'Romania' },
  { code: '+7', country: 'RU', label: 'Russia' },
  { code: '+250', country: 'RW', label: 'Rwanda' },
  { code: '+1', country: 'KN', label: 'Saint Kitts and Nevis' },
  { code: '+1', country: 'LC', label: 'Saint Lucia' },
  { code: '+1', country: 'VC', label: 'Saint Vincent and the Grenadines' },
  { code: '+685', country: 'WS', label: 'Samoa' },
  { code: '+378', country: 'SM', label: 'San Marino' },
  { code: '+239', country: 'ST', label: 'São Tomé and Príncipe' },
  { code: '+966', country: 'SA', label: 'Saudi Arabia' },
  { code: '+221', country: 'SN', label: 'Senegal' },
  { code: '+381', country: 'RS', label: 'Serbia' },
  { code: '+248', country: 'SC', label: 'Seychelles' },
  { code: '+232', country: 'SL', label: 'Sierra Leone' },
  { code: '+65', country: 'SG', label: 'Singapore' },
  { code: '+421', country: 'SK', label: 'Slovakia' },
  { code: '+386', country: 'SI', label: 'Slovenia' },
  { code: '+677', country: 'SB', label: 'Solomon Islands' },
  { code: '+252', country: 'SO', label: 'Somalia' },
  { code: '+27', country: 'ZA', label: 'South Africa' },
  { code: '+82', country: 'KR', label: 'South Korea' },
  { code: '+211', country: 'SS', label: 'South Sudan' },
  { code: '+34', country: 'ES', label: 'Spain' },
  { code: '+94', country: 'LK', label: 'Sri Lanka' },
  { code: '+249', country: 'SD', label: 'Sudan' },
  { code: '+597', country: 'SR', label: 'Suriname' },
  { code: '+46', country: 'SE', label: 'Sweden' },
  { code: '+41', country: 'CH', label: 'Switzerland' },
  { code: '+963', country: 'SY', label: 'Syria' },
  { code: '+886', country: 'TW', label: 'Taiwan' },
  { code: '+992', country: 'TJ', label: 'Tajikistan' },
  { code: '+255', country: 'TZ', label: 'Tanzania' },
  { code: '+66', country: 'TH', label: 'Thailand' },
  { code: '+670', country: 'TL', label: 'Timor-Leste' },
  { code: '+228', country: 'TG', label: 'Togo' },
  { code: '+676', country: 'TO', label: 'Tonga' },
  { code: '+1', country: 'TT', label: 'Trinidad and Tobago' },
  { code: '+216', country: 'TN', label: 'Tunisia' },
  { code: '+90', country: 'TR', label: 'Turkey' },
  { code: '+993', country: 'TM', label: 'Turkmenistan' },
  { code: '+688', country: 'TV', label: 'Tuvalu' },
  { code: '+256', country: 'UG', label: 'Uganda' },
  { code: '+380', country: 'UA', label: 'Ukraine' },
  { code: '+971', country: 'AE', label: 'United Arab Emirates' },
  { code: '+44', country: 'GB', label: 'United Kingdom' },
  { code: '+1', country: 'US', label: 'United States' },
  { code: '+598', country: 'UY', label: 'Uruguay' },
  { code: '+998', country: 'UZ', label: 'Uzbekistan' },
  { code: '+678', country: 'VU', label: 'Vanuatu' },
  { code: '+379', country: 'VA', label: 'Vatican City' },
  { code: '+58', country: 'VE', label: 'Venezuela' },
  { code: '+84', country: 'VN', label: 'Vietnam' },
  { code: '+967', country: 'YE', label: 'Yemen' },
  { code: '+260', country: 'ZM', label: 'Zambia' },
  { code: '+263', country: 'ZW', label: 'Zimbabwe' },
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
