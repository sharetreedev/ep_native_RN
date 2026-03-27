import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { ArrowLeft, HeartHandshake } from 'lucide-react-native';
import { colors, fonts, fontSizes, borderRadius, buttonStyles } from '../../theme';

export default function InvitePairIntroScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft color={colors.textSecondary} size={24} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <HeartHandshake color={colors.primary} size={80} />
        </View>

        <Text style={styles.title}>The Hand of Support</Text>

        <Text style={styles.body}>
          Pulse is designed to be shared with the 5 people you trust most. Being paired means being there for each
          other through the highs and lows.
        </Text>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[buttonStyles.primary.container, { width: '100%' }]}
          onPress={() => navigation.navigate('InvitePairType')}
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
  backButton: { marginRight: 16 },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    paddingBottom: 16,
  },
  iconWrap: {
    backgroundColor: colors.primaryLight,
    padding: 32,
    borderRadius: borderRadius.full,
    marginBottom: 32,
  },
  title: {
    fontSize: fontSizes['3xl'],
    fontFamily: fonts.heading,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 16,
  },
  body: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },

});
