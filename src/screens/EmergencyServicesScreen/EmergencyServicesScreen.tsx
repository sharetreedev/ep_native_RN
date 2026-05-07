import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Phone, ChevronRight, Users } from 'lucide-react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackParamList } from '../../types/navigation';
import { useSafeEdges } from '../../contexts/MHFRContext';
import { users as xanoUsers, XanoUser } from '../../api';
import { colors, fonts, fontSizes, borderRadius, spacing } from '../../theme';
import { logger } from '../../lib/logger';

const eapContacts = [
  { name: 'Corporate Health', number: '1300 123 456', description: 'Confidential employee support' },
];

const hotlineContacts = [
  { name: 'Lifeline', number: '13 11 14', description: '24/7 Crisis Support' },
  { name: 'Beyond Blue', number: '1300 22 4636', description: 'Depression and anxiety support' },
  { name: 'Kids Helpline', number: '1800 55 1800', description: 'Counseling for young people' },
];

const emergencyContacts = [
  { name: 'Emergency Services', number: '000', description: 'For life-threatening emergencies' },
];

function makeCall(phoneNumber: string) {
  const phoneUrl = `tel:${phoneNumber}`;
  Linking.canOpenURL(phoneUrl)
    .then((supported) => supported && Linking.openURL(phoneUrl))
    .catch((err) => logger.error(err));
}

function ContactCard({
  name,
  description,
  number,
}: {
  name: string;
  description: string;
  number: string;
}) {
  const [revealed, setRevealed] = useState(false);

  return (
    <View style={styles.card}>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardName}>{name}</Text>
        <Text style={styles.cardDesc}>{description}</Text>
        {revealed && number ? <Text style={styles.cardNumber}>{number}</Text> : null}
      </View>
      {number ? (
        revealed ? (
          <TouchableOpacity onPress={() => makeCall(number)} style={styles.phoneIconWrap} activeOpacity={0.7}>
            <Phone color={colors.primary} size={20} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => setRevealed(true)} style={styles.viewNumberButton} activeOpacity={0.7}>
            <Phone color="#FFFFFF" size={14} />
            <Text style={styles.viewNumberText}>View Number</Text>
          </TouchableOpacity>
        )
      ) : null}
    </View>
  );
}

export default function EmergencyServicesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const safeEdges = useSafeEdges(['top']);

  const [mhfrContacts, setMhfrContacts] = useState<XanoUser[]>([]);
  const [loadingMhfr, setLoadingMhfr] = useState(true);

  useEffect(() => {
    xanoUsers.getTop4Mhfr()
      .then((data) => setMhfrContacts(Array.isArray(data) ? data : []))
      .catch((e) => logger.warn('[EmergencyServices] Failed to load MHFR:', e))
      .finally(() => setLoadingMhfr(false));
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={safeEdges}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft color={colors.textPrimary} size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Get Support</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollInner}>
        <Text style={styles.disclaimer}>
          If you or someone you know is in immediate danger, please call 000.
        </Text>

        {/* AI MHFR */}
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

        {/* MHFR */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>MHFR</Text>
          {loadingMhfr ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.base }} />
          ) : mhfrContacts.length > 0 ? (
            mhfrContacts.map((c) => (
              <ContactCard
                key={c.id}
                name={c.fullName || `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim() || 'Contact'}
                description="MHFR Support"
                number={c.phoneNumber || ''}
              />
            ))
          ) : (
            <View style={styles.placeholderCard}>
              <View style={styles.placeholderIconWrap}>
                <Users color={colors.textMuted} size={20} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.placeholderTitle}>No MHFR available yet</Text>
                <Text style={styles.placeholderDesc}>
                  Ask your group admin to set up an MHFR or support role for your group.
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* EAP & Professional Services */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>EAP & Professional Services</Text>
          {eapContacts.map((c, i) => (
            <ContactCard key={i} name={c.name} description={c.description} number={c.number} />
          ))}
        </View>

        {/* Hotlines */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hotlines</Text>
          {hotlineContacts.map((c, i) => (
            <ContactCard key={i} name={c.name} description={c.description} number={c.number} />
          ))}
        </View>

        {/* Emergency Services */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emergency Services</Text>
          {emergencyContacts.map((c, i) => (
            <ContactCard key={i} name={c.name} description={c.description} number={c.number} />
          ))}
        </View>
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
  scroll: { flex: 1 },
  scrollInner: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.base,
    paddingBottom: spacing['4xl'],
  },
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
  viewNumberButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: borderRadius.button,
  },
  viewNumberText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.sm,
    color: '#FFFFFF',
  },
  placeholderCard: {
    backgroundColor: colors.surface,
    padding: spacing.base,
    borderRadius: borderRadius.button,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
    opacity: 0.65,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  placeholderIconWrap: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  placeholderDesc: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    lineHeight: 18,
  },
  aiCardOuter: {
    borderRadius: 20,
    marginBottom: spacing['2xl'],
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
