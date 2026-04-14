import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { ArrowLeft, Camera, Plus, X } from 'lucide-react-native';
import { useGroups } from '../../hooks/useGroups';
import { colors, fonts, fontSizes, borderRadius, spacing } from '../../theme';
import { useSafeEdges } from '../../contexts/MHFRContext';

const TOTAL_STEPS = 3;

export default function CreateGroupScreen() {
  const safeEdges = useSafeEdges(['top', 'bottom']);
  const navigation = useNavigation();
  const { createGroup, inviteViaEmail } = useGroups();

  const [step, setStep] = useState(1);
  const [groupName, setGroupName] = useState('');
  const [groupImage, setGroupImage] = useState<string>('');
  const [emailInput, setEmailInput] = useState('');
  const [emails, setEmails] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canProceed = step === 1 ? groupName.trim().length > 0 : true;

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
      setGroupImage(result.assets[0].uri);
    }
  }, []);

  const handleAddEmail = useCallback(() => {
    const trimmed = emailInput.trim().toLowerCase();
    if (!trimmed) return;
    if (!trimmed.includes('@')) {
      Alert.alert('Invalid email', 'Please enter a valid email address.');
      return;
    }
    if (emails.includes(trimmed)) {
      Alert.alert('Duplicate', 'This email has already been added.');
      return;
    }
    setEmails((prev) => [...prev, trimmed]);
    setEmailInput('');
  }, [emailInput, emails]);

  const handleRemoveEmail = useCallback((email: string) => {
    setEmails((prev) => prev.filter((e) => e !== email));
  }, []);

  const handleNext = useCallback(() => {
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
    }
  }, [step]);

  const handleBack = useCallback(() => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigation.goBack();
    }
  }, [step, navigation]);

  const handleCreate = useCallback(async () => {
    setIsSubmitting(true);
    try {
      const group = await createGroup(groupName.trim(), groupImage, []);
      if (group) {
        for (const email of emails) {
          try {
            await inviteViaEmail(group.id, email);
          } catch {
            // Continue even if individual invite fails
          }
        }
        navigation.goBack();
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to create group. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [groupName, groupImage, emails, createGroup, inviteViaEmail, navigation]);

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3].map((s) => (
        <View
          key={s}
          style={[styles.stepDot, s === step && styles.stepDotActive, s < step && styles.stepDotCompleted]}
        />
      ))}
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>What would you like{'\n'}to call your group?</Text>
      <Text style={styles.stepHint}>Choose something your members will recognise.</Text>
      <TextInput
        style={styles.nameInput}
        value={groupName}
        onChangeText={setGroupName}
        placeholder="e.g. Family, Work Team"
        placeholderTextColor={colors.textPlaceholder}
        autoFocus
        returnKeyType="next"
        onSubmitEditing={() => canProceed && handleNext()}
      />
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Add a photo for{'\n'}your group</Text>
      <Text style={styles.stepHint}>This helps members identify the group at a glance. You can skip this for now.</Text>
      <TouchableOpacity style={styles.imagePicker} onPress={handlePickImage} activeOpacity={0.7}>
        {groupImage ? (
          <Image source={{ uri: groupImage }} style={styles.imagePreview} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <View style={styles.cameraCircle}>
              <Camera color={colors.textMuted} size={28} />
            </View>
            <Text style={styles.imagePlaceholderText}>Tap to choose a photo</Text>
          </View>
        )}
      </TouchableOpacity>
      {groupImage ? (
        <TouchableOpacity style={styles.removeImageButton} onPress={() => setGroupImage('')}>
          <Text style={styles.removeImageText}>Remove</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Who would you like{'\n'}to invite?</Text>
      <Text style={styles.stepHint}>Add people by email. You can always invite more later.</Text>
      <View style={styles.emailInputRow}>
        <TextInput
          style={styles.emailTextInput}
          value={emailInput}
          onChangeText={setEmailInput}
          placeholder="name@email.com"
          placeholderTextColor={colors.textPlaceholder}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={handleAddEmail}
        />
        <TouchableOpacity
          style={[styles.addEmailButton, !emailInput.trim() && styles.addEmailButtonDisabled]}
          onPress={handleAddEmail}
          disabled={!emailInput.trim()}
        >
          <Plus color={emailInput.trim() ? colors.textOnPrimary : colors.textPlaceholder} size={18} />
        </TouchableOpacity>
      </View>

      {emails.length > 0 && (
        <View style={styles.emailListWrap}>
          <Text style={styles.emailListLabel}>{emails.length} invited</Text>
          <ScrollView style={styles.emailList} showsVerticalScrollIndicator={false}>
            {emails.map((email) => (
              <View key={email} style={styles.emailChip}>
                <View style={styles.emailAvatar}>
                  <Text style={styles.emailAvatarText}>{email.charAt(0).toUpperCase()}</Text>
                </View>
                <Text style={styles.emailChipText} numberOfLines={1}>{email}</Text>
                <TouchableOpacity onPress={() => handleRemoveEmail(email)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <X color={colors.textPlaceholder} size={16} />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={safeEdges}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <ArrowLeft color={colors.textPrimary} size={22} />
          </TouchableOpacity>
          {renderStepIndicator()}
          <View style={styles.backButton} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </ScrollView>

        <View style={styles.footer}>
          {step < TOTAL_STEPS ? (
            <TouchableOpacity
              style={[styles.primaryButton, !canProceed && styles.primaryButtonDisabled]}
              onPress={handleNext}
              disabled={!canProceed}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>Continue</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.primaryButton, isSubmitting && styles.primaryButtonDisabled]}
              onPress={handleCreate}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator color={colors.textOnPrimary} />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {emails.length > 0 ? 'Create & Invite' : 'Create Group'}
                </Text>
              )}
            </TouchableOpacity>
          )}
          {step === TOTAL_STEPS && emails.length === 0 && (
            <Text style={styles.skipHint}>You can skip inviting for now</Text>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  backButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Step indicator — inline in header
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  stepDotActive: {
    width: 24,
    backgroundColor: colors.primary,
  },
  stepDotCompleted: {
    backgroundColor: colors.primary,
  },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },

  // Steps
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: fontSizes['3xl'],
    fontFamily: fonts.heading,
    color: colors.textPrimary,
    lineHeight: 40,
    marginBottom: spacing.md,
  },
  stepHint: {
    fontSize: fontSizes.md,
    fontFamily: fonts.body,
    color: colors.textMuted,
    marginBottom: spacing['2xl'],
    lineHeight: 20,
  },

  // Step 1 — Name input (underline style)
  nameInput: {
    borderBottomWidth: 2,
    borderBottomColor: colors.borderLight,
    paddingVertical: spacing.md,
    fontSize: fontSizes.xl,
    fontFamily: fonts.headingSemiBold,
    color: colors.textPrimary,
  },

  // Step 2 — Image picker
  imagePicker: {
    width: 140,
    height: 140,
    borderRadius: 28,
    overflow: 'hidden',
    alignSelf: 'center',
    marginTop: spacing.base,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  cameraCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.textMuted,
  },
  removeImageButton: {
    alignSelf: 'center',
    marginTop: spacing.md,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.base,
  },
  removeImageText: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.destructive,
  },

  // Step 3 — Email input
  emailInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  emailTextInput: {
    flex: 1,
    borderBottomWidth: 2,
    borderBottomColor: colors.borderLight,
    paddingVertical: spacing.md,
    fontSize: fontSizes.base,
    fontFamily: fonts.body,
    color: colors.textPrimary,
  },
  addEmailButton: {
    backgroundColor: colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addEmailButtonDisabled: {
    backgroundColor: colors.border,
  },
  emailListWrap: {
    marginTop: spacing.xl,
  },
  emailListLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  emailList: {
    maxHeight: 220,
  },
  emailChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: spacing.md,
  },
  emailAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emailAvatarText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.sm,
    color: colors.primary,
  },
  emailChipText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.base,
    color: colors.textPrimary,
    flex: 1,
  },

  // Footer
  footer: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.base,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.button,
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.base,
    color: colors.textOnPrimary,
  },
  skipHint: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
