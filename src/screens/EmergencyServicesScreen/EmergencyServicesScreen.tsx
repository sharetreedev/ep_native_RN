import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Phone, Sparkles } from 'lucide-react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { useSafeEdges } from '../../contexts/MHFRContext';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight } from 'lucide-react-native';
import { colors, fonts, fontSizes, borderRadius, spacing } from '../../theme';
import { logger } from '../../lib/logger';

export default function EmergencyServicesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const safeEdges = useSafeEdges(['top']);

  const makeCall = (phoneNumber: string) => {
    const phoneUrl = `tel:${phoneNumber}`;
    Linking.canOpenURL(phoneUrl)
      .then((supported) => supported && Linking.openURL(phoneUrl))
      .catch((err) => logger.error(err));
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
    <SafeAreaView style={styles.container} edges={safeEdges}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft color={colors.textPrimary} size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Get Support</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scroll}>
        <Text style={styles.disclaimer}>
          If you or someone you know is in immediate danger, please call 000.
        </Text>

        <TouchableOpacity
          onPress={() => navigation.navigate('AIMHFR')}
          activeOpacity={0.85}
          style={styles.aiCardOuter}
        >
          <LinearGradient
            colors={[colors.mhfrGradientFrom, colors.mhfrGradientTo]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.aiCard}
          >
            {/* Decorative rings */}
            <View style={styles.aiDecoWrap}>
              <View style={styles.aiDecoRing1} />
              <View style={styles.aiDecoRing2} />
            </View>

            <View style={styles.aiContent}>
              <View style={styles.aiTextWrap}>
                <Text style={styles.aiLabel}>AI Powered</Text>
                <Text style={styles.aiTitle}>Mental Health{'\n'}First Responder</Text>
                <Text style={styles.aiDesc}>Speak with an AI MHFR for immediate, confidential support anytime.</Text>
              </View>
            </View>

            <View style={styles.aiAction}>
              <Text style={styles.aiActionText}>Start a conversation</Text>
              <ChevronRight color="rgba(255,255,255,0.7)" size={16} />
            </View>
          </LinearGradient>
        </TouchableOpacity>

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
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.base,
  },
  backButton: { width: 24 },
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
  aiCardOuter: {
    borderRadius: 20,
    marginBottom: spacing.xl,
    shadowColor: '#2D3A25',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  aiCard: {
    borderRadius: 20,
    padding: spacing.xl,
    overflow: 'hidden',
  },
  aiDecoWrap: {
    position: 'absolute',
    right: -20,
    top: -20,
  },
  aiDecoRing1: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  aiDecoRing2: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    top: 15,
    left: 15,
  },
  aiContent: {
    flexDirection: 'row',
    gap: spacing.base,
    marginBottom: spacing.base,
  },
  aiIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiTextWrap: {
    flex: 1,
  },
  aiLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.xs,
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  aiTitle: {
    fontFamily: fonts.heading,
    fontSize: fontSizes.xl,
    color: colors.textOnPrimary,
    lineHeight: 26,
  },
  aiDesc: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: 'rgba(255,255,255,0.6)',
    marginTop: spacing.sm,
    lineHeight: 18,
  },
  aiAction: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  aiActionText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.sm,
    color: 'rgba(255,255,255,0.85)',
  },
});
