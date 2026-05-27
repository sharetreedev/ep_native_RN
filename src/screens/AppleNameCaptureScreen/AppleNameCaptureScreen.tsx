import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pencil, ChevronDown } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../contexts/AuthContext';
import { useUser } from '../../hooks/useUser';
import { useScreenAnnouncement } from '../../hooks/useScreenAnnouncement';
import { colors, fonts, fontSizes, spacing, borderRadius } from '../../theme';
import Avatar from '../../components/Avatar';
import ModalPicker from '../../components/ModalPicker';
import { COUNTRIES } from '../../constants/countries';
const appLogo = require('../../../assets/Logo.png');

// Shown after Apple sign-in when the user record has no firstName. This
// happens when Apple suppresses the one-shot name delivery (the user has
// previously authorized this app on the same Apple ID) AND we have no cached
// name from a prior attempt. Without this gate, the user lands in Onboarding /
// the main app with a blank name and ends up rendered as initials of an empty
// string everywhere.
export default function AppleNameCaptureScreen() {
  useScreenAnnouncement('Tell us your name');
  const { user, refreshUser, logout } = useAuth();
  const { updateProfile } = useUser();

  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [country, setCountry] = useState(user?.country ?? '');
  const [countryPickerVisible, setCountryPickerVisible] = useState(false);
  const [avatarUri, setAvatarUri] = useState(user?.avatarUrl ?? '');
  const [avatarFileUri, setAvatarFileUri] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const trimmedFirst = firstName.trim();
  const trimmedLast = lastName.trim();
  const selectedCountryLabel = COUNTRIES.find((c) => c.value === country)?.label || '';
  const canSubmit = trimmedFirst.length > 0 && country.length > 0 && !submitting;

  const handlePickImage = useCallback(async () => {
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

  async function handleContinue() {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const fullName = [trimmedFirst, trimmedLast].filter(Boolean).join(' ');
      await updateProfile({
        firstName: trimmedFirst,
        lastName: trimmedLast,
        fullName,
        country,
        ...(avatarFileUri ? { profilePicFile: { uri: avatarFileUri } } : {}),
      });
      await refreshUser();
    } catch {
      Alert.alert(
        'Could not save your name',
        'Something went wrong saving your name. Please check your connection and try again.',
      );
    } finally {
      // Always reset so a silent gate-stays-active failure doesn't leave the
      // button permanently in "Saving…". If updateProfile succeeded, the
      // screen unmounts on the next render anyway.
      setSubmitting(false);
    }
  }

  function handleSignOut() {
    Alert.alert(
      'Sign out?',
      'You can finish setting up your profile next time you sign in.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign out', style: 'destructive', onPress: () => { logout(); } },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerBlock}>
            <Text style={styles.title}>What should we call you?</Text>
            <Text style={styles.subtitle}>
              Adding a name and photo helps your pairs recognise you on check-ins and in support requests.
            </Text>
          </View>

          <View style={styles.avatarSection}>
            <TouchableOpacity
              style={styles.avatarWrap}
              onPress={handlePickImage}
              activeOpacity={0.7}
              disabled={submitting}
              accessibilityRole="button"
              accessibilityLabel="Choose a profile photo"
            >
              <Avatar
                source={avatarUri || null}
                name={trimmedFirst || user?.name}
                hexColour={user?.profileHexColour}
                fallbackImage={trimmedFirst || user?.name ? undefined : appLogo}
                size="2xl"
              />
              <View style={styles.editAvatarButton}>
                <Pencil color={colors.textSecondary} size={14} />
              </View>
            </TouchableOpacity>
            <Text style={styles.avatarHint}>Add a photo (optional)</Text>
          </View>

          <View style={styles.row}>
            <View style={styles.halfField}>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="First name"
                placeholderTextColor={colors.textPlaceholder}
                autoComplete="name-given"
                autoCapitalize="words"
                returnKeyType="next"
                editable={!submitting}
              />
            </View>
            <View style={styles.halfField}>
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Last name"
                placeholderTextColor={colors.textPlaceholder}
                autoComplete="name-family"
                autoCapitalize="words"
                returnKeyType="done"
                onSubmitEditing={handleContinue}
                editable={!submitting}
              />
            </View>
          </View>

          <TouchableOpacity
            style={styles.countryPicker}
            onPress={() => setCountryPickerVisible(true)}
            disabled={submitting}
            accessibilityRole="button"
            accessibilityLabel="Select your country"
          >
            <Text
              style={[
                styles.countryPickerText,
                !selectedCountryLabel && styles.countryPickerPlaceholder,
              ]}
            >
              {selectedCountryLabel || 'Select your country'}
            </Text>
            <ChevronDown color={colors.textMuted} size={18} />
          </TouchableOpacity>
          <Text style={styles.countryHint}>*used to set Mental Health Support Service</Text>

          <TouchableOpacity
            style={[styles.button, !canSubmit && styles.buttonDisabled]}
            onPress={handleContinue}
            disabled={!canSubmit}
            accessibilityRole="button"
          >
            <Text style={styles.buttonText}>
              {submitting ? 'Saving…' : 'Continue'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSignOut}
            disabled={submitting}
            accessibilityRole="button"
            accessibilityLabel="Sign out"
            style={styles.signOutLink}
          >
            <Text style={styles.signOutLinkText}>Sign out</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

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
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing['2xl'],
    paddingBottom: spacing.xl,
  },
  headerBlock: { marginBottom: spacing.xl },
  title: {
    fontSize: fontSizes['2xl'],
    fontFamily: fonts.heading,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSizes.base,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    lineHeight: fontSizes.base * 1.45,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
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
  avatarHint: {
    marginTop: spacing.sm,
    fontSize: fontSizes.sm,
    fontFamily: fonts.body,
    color: colors.textMuted,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  halfField: { flex: 1 },
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
    marginBottom: spacing.xl,
  },
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
  button: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.button,
    paddingVertical: spacing.base,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: {
    color: colors.textOnPrimary,
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.base,
  },
  signOutLink: {
    alignItems: 'center',
    paddingVertical: spacing.base,
    marginTop: spacing.sm,
  },
  signOutLinkText: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.body,
    color: colors.textMuted,
    textDecorationLine: 'underline',
  },
});
