import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { colors, fonts, fontSizes, borderRadius, spacing } from '../../theme';
import Button from '../../components/Button';

const WHATS_NEW = [
  'You can now access the app via mobile, desktop browser and Microsoft Teams.',
  'Improved checkin flow, trend reports and visibility of Pair Activity.',
  'Simplified Support Request Flow',
  'AI Mental Health First Responder is now available to you 24/7 at the click of button.',
  'Group Admin portal to easily manage your groups, members, roles and support services.',
];

export default function MigrationWelcomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>🎉 Welcome to Emotional Pulse 2 🎉</Text>
        <Text style={styles.intro}>
          We&apos;ve migrated your account, check-in history and Pair data.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardHeading}>What&apos;s new:</Text>
          {WHATS_NEW.map((item, idx) => (
            <View key={idx} style={styles.listRow}>
              <Text style={styles.listNumber}>{idx + 1}.</Text>
              <Text style={styles.listText}>{item}</Text>
            </View>
          ))}

          <Text style={styles.cardHeading}>Next step:</Text>
          <Text style={styles.nextStep}>
            To complete your account migration please set a new password.
          </Text>
        </View>

        <Button
          title="Secure account and set password"
          onPress={() => navigation.navigate('SetPassword')}
          style={styles.cta}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  title: {
    fontSize: fontSizes['2xl'],
    fontFamily: fonts.heading,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  intro: {
    fontSize: fontSizes.base,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginBottom: spacing.xl,
  },
  cardHeading: {
    fontSize: fontSizes.base,
    fontFamily: fonts.bodyBold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  listRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  listNumber: {
    fontSize: fontSizes.base,
    fontFamily: fonts.bodySemiBold,
    color: colors.textSecondary,
    width: 22,
  },
  listText: {
    flex: 1,
    fontSize: fontSizes.base,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  nextStep: {
    fontSize: fontSizes.base,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  cta: { marginTop: spacing.sm },
});
