import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronLeft } from 'lucide-react-native';
import { RootStackParamList } from '../../types/navigation';
import { colors, fonts, fontSizes, borderRadius, spacing } from '../../theme';
import Button from '../../components/Button';

// Shown when the migration pre-check returns `phone`: the email isn't a
// password account, but the user may have a mobile-number account.
export default function AccountNotFoundScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Image source={require('../../../assets/Logo.png')} style={styles.logo} />
          <Text style={styles.title}>
            We couldn&apos;t find an account associated with this email
          </Text>
          <Text style={styles.body}>
            If you used your mobile number to log in you can try logging in with mobile.
          </Text>

          <Button
            title="Sign in with Mobile"
            onPress={() => navigation.navigate('MobileSignIn')}
            variant="secondary"
            style={styles.mobileButton}
          />

          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backRow}
            accessibilityRole="button"
            accessibilityLabel="Try with a different email"
          >
            <ChevronLeft color={colors.textMuted} size={18} />
            <Text style={styles.backText}>Try with Different Email</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    marginBottom: spacing.md,
  },
  body: {
    fontSize: fontSizes.base,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  mobileButton: { marginBottom: spacing.base },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  backText: {
    color: colors.textMuted,
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.sm,
    marginLeft: 4,
  },
});
