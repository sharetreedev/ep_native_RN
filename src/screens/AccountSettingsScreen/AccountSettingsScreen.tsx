import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, StyleSheet, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, KeyRound, LogOut, Trash2 } from 'lucide-react-native';
import { RootStackParamList } from '../../types/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { useMyPulseVersion } from '../../hooks/useMyPulseVersion';
import { useScreenAnnouncement } from '../../hooks/useScreenAnnouncement';
import { colors, fonts, fontSizes, spacing } from '../../theme';
import ConfirmModal from '../../components/ConfirmModal';
import { useSafeEdges } from '../../contexts/MHFRContext';
import { auth as xanoAuth, XanoError } from '../../api';

type DeleteStage = 'idle' | 'warning' | 'final' | 'deleting';

export default function AccountSettingsScreen() {
  useScreenAnnouncement('Account Settings');
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, logout, deleteAccount } = useAuth();
  const { version: myPulseVersion, setVersion: setMyPulseVersion, loading: myPulseVersionLoading } = useMyPulseVersion();
  const safeEdges = useSafeEdges(['top']);

  const [resetVisible, setResetVisible] = useState(false);
  const [resetSending, setResetSending] = useState(false);
  const [deleteStage, setDeleteStage] = useState<DeleteStage>('idle');

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: logout },
    ]);
  };

  const handleResetPassword = async () => {
    if (!user?.email) {
      Alert.alert('No email on file', 'We could not find an email on your account.');
      setResetVisible(false);
      return;
    }
    setResetSending(true);
    try {
      await xanoAuth.requestPasswordReset(user.email);
      setResetVisible(false);
      Alert.alert(
        'Check your email',
        `If your account uses a password, we've sent a reset link to ${user.email}.`,
      );
    } catch (e) {
      const msg = e instanceof XanoError ? e.message : 'Could not send reset email. Please try again.';
      Alert.alert('Reset Password Failed', msg);
    } finally {
      setResetSending(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteStage('deleting');
    try {
      await deleteAccount();
      // On success, AuthProvider drops to unauthenticated and the navigator
      // routes to AuthScreen — no further work needed here.
    } catch (e) {
      setDeleteStage('idle');
      const msg = e instanceof XanoError ? e.message : 'We couldn\'t delete your account. Please try again or contact privacy@sharetree.org.';
      Alert.alert('Delete Account Failed', msg);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={safeEdges}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft color={colors.textSecondary} size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Account Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.displayCard}>
          <View style={styles.displayTextWrap}>
            <Text style={styles.menuItemText}>Try the new My Pulse</Text>
            <Text style={styles.menuItemSubtext}>Preview the redesigned home screen</Text>
          </View>
          <Switch
            value={myPulseVersion === 'v2'}
            onValueChange={(next) => setMyPulseVersion(next ? 'v2' : 'v1')}
            disabled={myPulseVersionLoading}
            trackColor={{ false: colors.borderLight, true: colors.primary }}
            style={styles.displaySwitch}
          />
        </View>

        <Text style={styles.sectionLabel}>Account</Text>
        <View style={styles.menu}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setResetVisible(true)}
            accessibilityRole="button"
          >
            <KeyRound color={colors.textSecondary} size={20} />
            <View style={styles.menuTextWrap}>
              <Text style={styles.menuItemText}>Reset Password</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleLogout}
            accessibilityRole="button"
          >
            <LogOut color={colors.textSecondary} size={20} />
            <View style={styles.menuTextWrap}>
              <Text style={styles.menuItemText}>Log Out</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItemNoBorder}
            onPress={() => setDeleteStage('warning')}
            accessibilityRole="button"
            accessibilityLabel="Delete my account"
          >
            <Trash2 color={colors.destructive} size={20} />
            <View style={styles.menuTextWrap}>
              <Text style={[styles.menuItemText, styles.destructiveText]}>Delete my account</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <ConfirmModal
        visible={resetVisible}
        onClose={() => !resetSending && setResetVisible(false)}
        onConfirm={handleResetPassword}
        title="Reset your password?"
        message={user?.email ? `We'll email a reset link to ${user.email}.` : 'We\'ll email you a reset link.'}
        confirmText="Send reset link"
        cancelText="Cancel"
        loading={resetSending}
      />

      <ConfirmModal
        visible={deleteStage === 'warning'}
        onClose={() => setDeleteStage('idle')}
        onConfirm={() => setDeleteStage('final')}
        title="Delete your account?"
        message={
          'This will permanently remove your name, email, phone number, profile photo, pair connections, and group memberships. ' +
          'Your past check-ins and support requests will be retained anonymously for safeguarding and aggregate research, in line with our privacy policy. ' +
          'This action cannot be undone.'
        }
        confirmText="Continue"
        cancelText="Cancel"
        destructive
      />

      <ConfirmModal
        visible={deleteStage === 'final' || deleteStage === 'deleting'}
        onClose={() => deleteStage !== 'deleting' && setDeleteStage('idle')}
        onConfirm={handleDeleteAccount}
        title="Are you absolutely sure?"
        message="There is no recovery once you confirm."
        confirmText="Delete my account"
        cancelText="Cancel"
        destructive
        loading={deleteStage === 'deleting'}
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
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  backButton: { width: 24, alignItems: 'flex-start' },
  title: {
    fontSize: fontSizes.xl,
    fontFamily: fonts.heading,
    color: colors.textPrimary,
  },
  scroll: { flex: 1, paddingHorizontal: 24, paddingTop: 16 },
  scrollContent: { paddingBottom: 100 },
  sectionLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
  },
  displayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(145, 162, 125, 0.25)',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  displayTextWrap: {
    flex: 1,
    marginRight: 12,
  },
  displaySwitch: {
    alignSelf: 'center',
  },
  menu: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginBottom: spacing.lg,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  menuItemNoBorder: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
  },
  menuTextWrap: {
    flex: 1,
    marginLeft: 12,
  },
  menuItemText: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.base,
    color: colors.textPrimary,
  },
  menuItemSubtext: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  destructiveText: {
    color: colors.destructive,
  },
});
