import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp, CommonActions } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import { ArrowLeft, Link, Copy, Mail } from 'lucide-react-native';
import { RootStackParamList } from '../../types/navigation';
import { colors, fonts, fontSizes, buttonStyles } from '../../theme';
import { logger } from '../../lib/logger';
import { pairs } from '../../api/pairs';
import { DATA_SOURCE, XanoError } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

const PROD_INVITE_BASE = 'https://app.emotionalpulse.ai/pair-invite';
const STAGING_INVITE_BASE = 'https://d40d63f2-ae0c-4e43-afd2-4047cb3a7a9c-staging.weweb-preview.io/pair-invite';

function buildInviteUrl(token: string): string {
  const base = DATA_SOURCE === 'live' ? PROD_INVITE_BASE : STAGING_INVITE_BASE;
  return `${base}?pair_token=${token}`;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function InvitePairActionsScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'InvitePairActions'>>();
  const { pairType } = route.params;
  const { user } = useAuth();
  const { showToast } = useToast();

  const [creating, setCreating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [pairsId, setPairsId] = useState<number | null>(null);
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);

  const goHome = () => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      }),
    );
  };

  useEffect(() => {
    let cancelled = false;
    async function createPair() {
      if (!user?.id) {
        setError('You need to be signed in to invite a pair.');
        setCreating(false);
        return;
      }
      try {
        const requestFromId = Number(user.id);
        logger.log('[InvitePairActions] POST /pairs request →', { pairType, requestFromId });
        const result = await pairs.create(pairType, requestFromId);
        logger.log('[InvitePairActions] POST /pairs full response ←', JSON.stringify(result));
        if (cancelled) return;
        if (typeof result.id !== 'number') {
          setError(`Pair create returned no numeric id (got ${typeof result.id}). Check the Xano response shape.`);
          return;
        }
        if (!result.token) {
          setError('Pair created but no invite token was returned. Please try again.');
          return;
        }
        const url = buildInviteUrl(result.token);
        logger.log('[InvitePairActions] resolved pairs.id →', result.id);
        logger.log('[InvitePairActions] resolved invite URL →', url);
        setInviteUrl(url);
        setPairsId(result.id);
      } catch (e) {
        logger.error('[InvitePairActions] create pair failed', e);
        if (!cancelled) setError('Could not create the invite. Please try again.');
      } finally {
        if (!cancelled) setCreating(false);
      }
    }
    createPair();
    return () => {
      cancelled = true;
    };
  }, [pairType, user?.id]);

  const handleCopyLink = async () => {
    if (!inviteUrl) return;
    try {
      await Clipboard.setStringAsync(inviteUrl);
      setCopied(true);
      showToast('Copied to clipboard. Invite links are one-time use only.');
    } catch (e) {
      logger.error('[InvitePairActions] clipboard copy failed', e);
      showToast('Could not copy. Please copy the link manually.', { variant: 'error' });
    }
  };

  const handleSendEmail = async () => {
    if (!pairsId) return;
    const trimmed = email.trim();
    if (!EMAIL_RE.test(trimmed)) {
      showToast('Please enter a valid email address.', { variant: 'error' });
      return;
    }
    setSending(true);
    try {
      logger.log(
        `[InvitePairActions] PATCH /pairs/${pairsId}/sendrequest request →`,
        { pairsId, invite_email: trimmed },
      );
      await pairs.sendRequest(pairsId, { invite_email: trimmed });
      showToast('Pair invite has been sent', { variant: 'success' });
      goHome();
    } catch (e) {
      logger.error('[InvitePairActions] send invite email failed', e);
      const msg = e instanceof XanoError && e.message
        ? `Could not send invite: ${e.message}`
        : 'Could not send invite. Please try again.';
      showToast(msg, { variant: 'error' });
      setSending(false);
    }
  };

  const renderLoading = () => (
    <View style={styles.loadingRow}>
      <ActivityIndicator color={colors.primary} />
      <Text style={styles.loadingText}>Generating your invite link…</Text>
    </View>
  );

  const renderError = () => <Text style={styles.errorText}>{error}</Text>;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft color={colors.textSecondary} size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Invite a Pair</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.body}>
        <Text style={styles.hint}>Choose how you'd like to invite your pair.</Text>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Link color={colors.primary} size={24} />
            <Text style={styles.cardTitle}>Copy invite link</Text>
          </View>

          {creating ? renderLoading()
            : error ? renderError()
            : (
              <TouchableOpacity style={styles.linkRow} onPress={handleCopyLink}>
                <Text style={styles.linkText} numberOfLines={1}>
                  {inviteUrl}
                </Text>
                <Copy color={colors.textSecondary} size={20} />
              </TouchableOpacity>
            )}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Mail color={colors.primary} size={24} />
            <Text style={styles.cardTitle}>Invite via email</Text>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Enter email address"
            placeholderTextColor={colors.textPlaceholder}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!creating && !error && !sending}
          />

          <TouchableOpacity
            style={[
              buttonStyles.primary.container,
              (creating || !!error || !pairsId || sending) && styles.buttonDisabled,
            ]}
            onPress={handleSendEmail}
            disabled={creating || !!error || !pairsId || sending}
          >
            {sending ? (
              <ActivityIndicator color={colors.textOnPrimary} />
            ) : (
              <Text style={buttonStyles.primary.text}>Send invite</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {copied ? (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[buttonStyles.primary.container, styles.completeButton]}
            onPress={goHome}
          >
            <Text style={buttonStyles.primary.text}>Complete</Text>
          </TouchableOpacity>
        </View>
      ) : null}
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
  backButton: { width: 40, alignItems: 'flex-start' },
  headerSpacer: { width: 40 },
  title: {
    flex: 1,
    textAlign: 'center',
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
  buttonDisabled: {
    opacity: 0.4,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    marginLeft: 12,
    fontFamily: fonts.body,
    fontSize: fontSizes.base,
    color: colors.textSecondary,
  },
  errorText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.base,
    color: colors.destructive,
  },
  footer: {
    paddingBottom: 24,
  },
  completeButton: {
    width: '100%',
  },
});
