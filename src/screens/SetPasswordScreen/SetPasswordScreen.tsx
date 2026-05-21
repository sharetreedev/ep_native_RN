import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth as xanoAuth, XanoError } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { colors, fonts, fontSizes, borderRadius, spacing } from '../../theme';
import Button from '../../components/Button';

// Final migration step. The user is already authenticated (token set by
// loginWithMobile), so resetPassword runs against the Bearer token. Clearing
// pendingPasswordSetup flips the AppNavigator gate and drops them into the
// normal authed app (Onboarding / Main) — no explicit navigation needed.
export default function SetPasswordScreen() {
  const { user, clearPendingPasswordSetup } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (password.length < 8) {
      Alert.alert('Weak Password', 'Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Passwords Do Not Match', 'Please make sure both passwords are the same.');
      return;
    }
    const userId = Number(user?.id);
    if (!userId) {
      Alert.alert('Error', 'We could not identify your account. Please sign in again.');
      return;
    }
    setSubmitting(true);
    try {
      await xanoAuth.resetPassword(userId, password);
      clearPendingPasswordSetup();
    } catch (e) {
      const msg = e instanceof XanoError ? e.message : 'Could not save your password. Please try again.';
      Alert.alert('Something went wrong', msg);
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <Image source={require('../../../assets/Logo.png')} style={styles.logo} />
            <Text style={styles.title}>Set a new password</Text>
            <Text style={styles.body}>
              Choose a new password to secure your migrated account.
            </Text>

            <TextInput
              style={styles.input}
              onChangeText={setPassword}
              value={password}
              secureTextEntry
              placeholder="New password"
              placeholderTextColor={colors.textPlaceholder}
              autoCapitalize="none"
            />
            <TextInput
              style={[styles.input, styles.inputLast]}
              onChangeText={setConfirm}
              value={confirm}
              secureTextEntry
              placeholder="Confirm new password"
              placeholderTextColor={colors.textPlaceholder}
              autoCapitalize="none"
            />

            <Button
              title="Save password"
              onPress={handleSubmit}
              loading={submitting}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: spacing.base },
  card: { padding: spacing.xl, borderRadius: borderRadius.lg },
  logo: { width: 48, height: 48, borderRadius: 16, alignSelf: 'center', marginBottom: spacing.base },
  title: {
    fontSize: fontSizes['2xl'],
    fontFamily: fonts.heading,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  body: {
    fontSize: fontSizes.base,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.button,
    padding: spacing.base,
    marginBottom: spacing.base,
    fontSize: fontSizes.base,
    fontFamily: fonts.body,
    color: colors.textPrimary,
  },
  inputLast: { marginBottom: spacing.xl },
});
