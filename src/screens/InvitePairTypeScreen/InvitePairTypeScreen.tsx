import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { ArrowLeft, ArrowLeftRight, Eye } from 'lucide-react-native';
import { colors, fonts, fontSizes, borderRadius, buttonStyles } from '../../theme';

type PairType = 'DUAL' | 'PULL';

export default function InvitePairTypeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [selected, setSelected] = useState<PairType | null>(null);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft color={colors.textSecondary} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pair Type</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        <Text style={styles.subtitle}>Choose how you'd like to connect with this person.</Text>

        <TouchableOpacity
          style={[styles.card, selected === 'DUAL' && styles.cardSelected]}
          onPress={() => setSelected('DUAL')}
        >
          <View style={[styles.iconWrap, selected === 'DUAL' && styles.iconWrapSelected]}>
            <ArrowLeftRight color={selected === 'DUAL' ? colors.primary : colors.textSecondary} size={28} />
          </View>
          <Text style={styles.cardTitle}>Trusted Pair</Text>
          <Text style={styles.cardBody}>
            Someone you trust to reciprocally share your emotional states with each other.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, selected === 'PULL' && styles.cardSelected]}
          onPress={() => setSelected('PULL')}
        >
          <View style={[styles.iconWrap, selected === 'PULL' && styles.iconWrapSelected]}>
            <Eye color={selected === 'PULL' ? colors.primary : colors.textSecondary} size={28} />
          </View>
          <Text style={styles.cardTitle}>Support Pair</Text>
          <Text style={styles.cardBody}>
            Request to have someone share their emotional check-ins, so you can support them.
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[buttonStyles.primary.container, { width: '100%' }, !selected && styles.buttonDisabled]}
          onPress={() => selected && navigation.navigate('InvitePairActions', { pairType: selected })}
          disabled={!selected}
        >
          <Text style={buttonStyles.primary.text}>Continue</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 24 },
  header: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16 },
  backButton: { width: 40, alignItems: 'flex-start' },
  headerSpacer: { width: 40 },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: fontSizes.xl,
    fontFamily: fonts.heading,
    color: colors.textPrimary,
  },
  content: { flex: 1, paddingTop: 16 },
  subtitle: {
    fontSize: fontSizes.base,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    marginBottom: 32,
  },
  card: {
    backgroundColor: colors.surface,
    padding: 24,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  iconWrap: {
    backgroundColor: colors.surfaceMuted,
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconWrapSelected: {
    backgroundColor: colors.background,
  },
  cardTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.lg,
    color: colors.textPrimary,
    marginBottom: 6,
  },
  cardBody: {
    fontFamily: fonts.body,
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  footer: {
    paddingBottom: 24,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
});
