import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert, Share, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { ArrowLeft, Mail, Link, Copy } from 'lucide-react-native';
import { RootStackParamList } from '../../types/navigation';
import { colors, fonts, fontSizes, borderRadius, buttonStyles } from '../../theme';

export default function InvitePairActionsScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'InvitePairActions'>>();
  const { pairType } = route.params;
  const [email, setEmail] = useState('');

  const handleCopyLink = () => {
    Alert.alert('Link Copied', 'The invite link has been copied to your clipboard.');
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: 'Join me on Pulse to stay connected and mindful! https://pulse.app/invite/123',
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft color={colors.textSecondary} size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Invite a Pair</Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.hint}>Choose how you'd like to invite your pair.</Text>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Mail color={colors.primary} size={24} />
            <Text style={styles.cardTitle}>Invite via Email</Text>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Enter email address"
            placeholderTextColor={colors.textPlaceholder}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TouchableOpacity style={buttonStyles.primary.container}>
            <Text style={buttonStyles.primary.text}>Send Invite</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Link color={colors.primary} size={24} />
            <Text style={styles.cardTitle}>Share Link</Text>
          </View>

          <TouchableOpacity style={styles.linkRow} onPress={handleShare}>
            <Text style={styles.linkText} numberOfLines={1}>
              https://pulse.app/invite/u/dylan...
            </Text>
            <Copy color={colors.textSecondary} size={20} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 24 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 16,
  },
  backButton: { marginRight: 16 },
  title: {
    fontSize: fontSizes.xl,
    fontFamily: fonts.heading,
    color: colors.textPrimary,
  },
  body: { flex: 1 },
  hint: {
    fontFamily: fonts.body,
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    marginBottom: 32,
  },
  card: {
    backgroundColor: colors.surface,
    padding: 24,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.lg,
    color: colors.textPrimary,
    marginLeft: 8,
  },
  input: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    fontSize: fontSizes.base,
    fontFamily: fonts.body,
    color: colors.textPrimary,
  },

  linkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  linkText: {
    flex: 1,
    marginRight: 8,
    fontFamily: fonts.body,
    fontSize: fontSizes.base,
    color: colors.textSecondary,
  },
});
