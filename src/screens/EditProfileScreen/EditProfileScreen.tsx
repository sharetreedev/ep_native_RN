import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, Pencil, BadgeCheck, ChevronDown } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { RootStackParamList } from '../../types/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { useUser } from '../../hooks/useUser';
import { colors, fonts, fontSizes, spacing, borderRadius } from '../../theme';
import ModalPicker from '../../components/ModalPicker';
import Avatar from '../../components/Avatar';
import { COUNTRIES } from '../../constants/countries';
import { useSafeEdges } from '../../contexts/MHFRContext';

// App logo used as profile avatar placeholder
const appLogo = require('../../../assets/Logo.png');

export default function EditProfileScreen() {
  const safeEdges = useSafeEdges(['top']);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, refreshUser } = useAuth();
  const { updateProfile, updateProfilePic, isLoading } = useUser();

  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [phone, setPhone] = useState(user?.phoneNumber || '');
  const [email] = useState(user?.email || '');
  const [country, setCountry] = useState(user?.country || '');
  const [avatarUri, setAvatarUri] = useState(user?.avatarUrl || '');
  const [avatarFileUri, setAvatarFileUri] = useState('');
  const [countryPickerVisible, setCountryPickerVisible] = useState(false);

  const selectedCountryLabel = COUNTRIES.find((c) => c.value === country)?.label || '';

  const handlePickImage = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
      setAvatarFileUri(result.assets[0].uri);
    }
  }, []);

  const handleSave = async () => {
    try {
      const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');
      await updateProfile({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        full_name: fullName,
        phone_number: phone.trim(),
        country: country,
      });
      if (avatarFileUri) {
        await updateProfilePic(avatarFileUri);
      }
      await refreshUser();
      Alert.alert('Success', 'Profile updated successfully.');
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={safeEdges}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft color={colors.textSecondary} size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.avatarSection}>
          <TouchableOpacity style={styles.avatarWrap} onPress={handlePickImage} activeOpacity={0.7}>
            <Avatar
              source={avatarUri || null}
              name={user?.name}
              hexColour={user?.profileHexColour}
              fallbackImage={user?.name ? undefined : appLogo}
              size="2xl"
            />
            <View style={styles.editAvatarButton}>
              <Pencil color={colors.textSecondary} size={14} />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.row}>
          <View style={styles.halfField}>
            <TextInput
              style={styles.input}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="First Name"
              placeholderTextColor={colors.textPlaceholder}
              autoComplete="name-given"
            />
          </View>
          <View style={styles.halfField}>
            <TextInput
              style={styles.input}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Last Name"
              placeholderTextColor={colors.textPlaceholder}
              autoComplete="name-family"
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.halfField}>
            <View style={styles.phoneWrap}>
              <TextInput
                style={[styles.input, styles.phoneInput]}
                value={phone}
                onChangeText={setPhone}
                placeholder="Phone"
                placeholderTextColor={colors.textPlaceholder}
                keyboardType="phone-pad"
                autoComplete="tel"
              />
              {user?.phoneVerified && (
                <BadgeCheck color={colors.primary} size={20} style={styles.verifiedIcon} />
              )}
            </View>
          </View>
          <View style={styles.halfField}>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={email}
              editable={false}
              placeholder="Email"
              placeholderTextColor={colors.textPlaceholder}
            />
          </View>
        </View>

        <TouchableOpacity
          style={styles.countryPicker}
          onPress={() => setCountryPickerVisible(true)}
        >
          <Text
            style={[
              styles.countryPickerText,
              !selectedCountryLabel && styles.countryPickerPlaceholder,
            ]}
          >
            {selectedCountryLabel || 'Select a country'}
          </Text>
          <ChevronDown color={colors.textMuted} size={18} />
        </TouchableOpacity>
        <Text style={styles.countryHint}>*used to set Mental Health Support Service</Text>

        <TouchableOpacity
          style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isLoading}
        >
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </TouchableOpacity>
      </ScrollView>

      <ModalPicker
        visible={countryPickerVisible}
        onDismiss={() => setCountryPickerVisible(false)}
        data={COUNTRIES}
        selectedValue={country}
        onSelect={(item) => {
          setCountry(item.value as string);
          setCountryPickerVisible(false);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.base,
  },
  backButton: { width: 24, alignItems: 'flex-start' },
  title: {
    fontSize: fontSizes.xl,
    fontFamily: fonts.heading,
    color: colors.textPrimary,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.xl, paddingBottom: 100 },
  avatarSection: { alignItems: 'center', marginVertical: spacing['2xl'] },
  avatarWrap: { position: 'relative' },
  editAvatarButton: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  halfField: { flex: 1 },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    fontSize: fontSizes.base,
    fontFamily: fonts.body,
    color: colors.textPrimary,
  },
  phoneWrap: {
    position: 'relative',
    justifyContent: 'center',
  },
  phoneInput: {
    paddingRight: spacing['2xl'],
  },
  verifiedIcon: {
    position: 'absolute',
    right: spacing.md,
  },
  inputDisabled: {
    backgroundColor: colors.surfaceMuted,
    color: colors.textMuted,
  },
  countryPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
  },
  countryPickerText: {
    fontSize: fontSizes.base,
    fontFamily: fonts.body,
    color: colors.textPrimary,
  },
  countryPickerPlaceholder: {
    color: colors.textPlaceholder,
  },
  countryHint: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.body,
    color: colors.destructive,
    textAlign: 'center',
    marginBottom: spacing['2xl'],
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.button,
    paddingVertical: spacing.base,
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  saveButtonDisabled: { opacity: 0.5 },
  saveButtonText: {
    color: colors.textOnPrimary,
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.base,
  },
});
