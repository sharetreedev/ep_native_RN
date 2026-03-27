import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Phone } from 'lucide-react-native';
import { colors, fonts, fontSizes, borderRadius, spacing } from '../../theme';

export default function EmergencyServicesScreen() {
  const navigation = useNavigation();

  const makeCall = (phoneNumber: string) => {
    const phoneUrl = `tel:${phoneNumber}`;
    Linking.canOpenURL(phoneUrl)
      .then((supported) => supported && Linking.openURL(phoneUrl))
      .catch((err) => console.error(err));
  };

  const contacts = [
    {
      category: 'Emergency',
      items: [
        { name: 'Emergency Services', number: '000', description: 'For life-threatening emergencies' },
        { name: 'Lifeline', number: '13 11 14', description: '24/7 Crisis Support' },
      ],
    },
    {
      category: 'EAP Provider',
      items: [
        { name: 'Corporate Health', number: '1300 123 456', description: 'Confidential employee support' },
      ],
    },
    {
      category: 'Support Services',
      items: [
        { name: 'Beyond Blue', number: '1300 22 4636', description: 'Depression and anxiety support' },
        { name: 'Kids Helpline', number: '1800 55 1800', description: 'Counseling for young people' },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft color={colors.textPrimary} size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Emergency & Support</Text>
      </View>

      <ScrollView style={styles.scroll}>
        <Text style={styles.disclaimer}>
          If you or someone you know is in immediate danger, please call 000.
        </Text>

        {contacts.map((section, index) => (
          <View key={index} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.category}</Text>
            {section.items.map((item, itemIndex) => (
              <TouchableOpacity
                key={itemIndex}
                onPress={() => makeCall(item.number)}
                style={styles.card}
              >
                <View>
                  <Text style={styles.cardName}>{item.name}</Text>
                  <Text style={styles.cardDesc}>{item.description}</Text>
                  <Text style={styles.cardNumber}>{item.number}</Text>
                </View>
                <View style={styles.phoneIconWrap}>
                  <Phone color={colors.primary} size={20} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: { marginRight: spacing.base },
  title: {
    fontSize: fontSizes.xl,
    fontFamily: fonts.heading,
    color: colors.textPrimary,
  },
  scroll: { flex: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.base },
  disclaimer: {
    fontFamily: fonts.body,
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  section: { marginBottom: spacing['2xl'] },
  sectionTitle: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.heading,
    color: colors.textPrimary,
    marginBottom: spacing.base,
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.base,
    borderRadius: borderRadius.button,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardName: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.base,
    color: colors.textPrimary,
  },
  cardDesc: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  cardNumber: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.base,
    color: colors.primary,
    marginTop: spacing.xs,
  },
  phoneIconWrap: {
    backgroundColor: colors.primaryLight,
    padding: spacing.base,
    borderRadius: borderRadius.full,
  },
});
