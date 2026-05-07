import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { useCourses } from '../../hooks/useCourses';
import { useScreenAnnouncement } from '../../hooks/useScreenAnnouncement';
import { Pencil, Bell, Info, User, ArrowLeft, Settings } from 'lucide-react-native';
import { colors, fonts, fontSizes, spacing } from '../../theme';
import Avatar from '../../components/Avatar';
import { useSafeEdges } from '../../contexts/MHFRContext';

export default function AccountScreen() {
  useScreenAnnouncement('Account');
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();
  const { enrollment, fetchEnrollment } = useCourses();
  const safeEdges = useSafeEdges(['top']);
  const courseProgress = enrollment ? (enrollment.progress_percent ?? 0) / 100 : 0;

  useEffect(() => { fetchEnrollment(); }, []);

  const displayUser = user ?? { email: 'dylan+2@sharetree.org', id: '1' };

  return (
    <SafeAreaView style={styles.container} edges={safeEdges}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft color={colors.textSecondary} size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>My Account</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileSection}>
          <Avatar
            source={user?.avatarUrl}
            name={user?.name}
            hexColour={user?.profileHexColour}
            fallbackIcon={user?.name ? undefined : <User color={colors.textOnPrimary} size={48} />}
            size="2xl"
            shadow="md"
            progress={courseProgress}
            progressStrokeWidth={3.5}
            style={styles.avatar}
          />
          {courseProgress > 0 && (
            <View style={styles.progressPill}>
              <Text style={styles.progressPillText}>{Math.round(courseProgress * 100)}%</Text>
            </View>
          )}
          {user?.name && <Text style={styles.name}>{user.name}</Text>}
          <Text style={styles.email}>{displayUser.email}</Text>
        </View>

        <View style={styles.menu}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Pencil color={colors.textSecondary} size={20} />
            <Text style={styles.menuItemText}>Edit Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('Reminders')}
          >
            <Bell color={colors.textSecondary} size={20} />
            <Text style={styles.menuItemText}>Reminders</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItemNoBorder}
            onPress={() => navigation.navigate('AccountSettings')}
          >
            <Settings color={colors.textSecondary} size={20} />
            <Text style={styles.menuItemText}>Account Settings</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.billingCard}>
          <Info color={colors.textSecondary} size={20} style={styles.billingIcon} />
          <View style={styles.billingText}>
            <Text style={styles.billingLine}>Access billing via desktop or browser</Text>
            <Text style={styles.billingLine}>https://app.emotionalpulse.ai</Text>
          </View>
        </View>
      </ScrollView>
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
  profileSection: { alignItems: 'center', marginBottom: 40 },
  avatar: {
    marginBottom: 6,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  progressPill: {
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  progressPillText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: colors.primary,
  },
  name: {
    fontSize: fontSizes['2xl'],
    fontFamily: fonts.heading,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  email: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.bodyMedium,
    color: colors.textPrimary,
  },
  menu: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginBottom: 32,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  menuItemNoBorder: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
  },
  menuItemText: {
    flex: 1,
    marginLeft: 12,
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.base,
    color: colors.textPrimary,
  },
  billingCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 48,
  },
  billingIcon: { marginTop: 2 },
  billingText: { marginLeft: 12, flex: 1 },
  billingLine: {
    fontFamily: fonts.bodyMedium,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
